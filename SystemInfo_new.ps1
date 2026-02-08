<#
.SYNOPSIS
    Gathers system information and installed software, then uploads to the Asset Management API.
.DESCRIPTION
    This script collects:
    - Basic System Info (OS, IP, Domain, User)
    - Security Info (Admin rights, BitLocker, AV, USB status)
    - Installed VPN Software
    - Complete List of Installed Software (from Registry)
    
    It then POSTs this data to the configured API endpoint.
#>

# Configuration
$API_URL = "http://localhost:5000/api/software-verification/upload-scan"
# $API_URL = "https://your-server-address.com/api/software-verification/upload-scan" # Production URL

# Setup Error Handling & Logging
$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# Start Transcript for local debugging
Start-Transcript -Path "$env:TEMP\SysInfo_Upload.log" -Append

Write-Host "Starting System Information Scan at $(Get-Date)"

# --- 1. Gather Basic System Information ---
$computerInfo = Get-ComputerInfo
$os = Get-CimInstance -ClassName Win32_OperatingSystem
$computerName = $env:COMPUTERNAME
$loggedUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName
$userName = ($loggedUser -split '\\')[-1]
$domain = ($loggedUser -split '\\')[0]

# Network Info (IPv4, avoiding APIPA)
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1 -ExpandProperty IPAddress)

# Admin Rights Check
$adminGroupMembers = (net localgroup administrators)
$adminRights = if ($adminGroupMembers -match $userName) { "Yes" } else { "No" }

# encryption Status (BitLocker)
$bitlocker = Try { Get-BitLockerVolume | Select-Object MountPoint, VolumeType, ProtectionStatus } Catch { $null }
if (-not $bitlocker) { $encryptionStatus = "Not accessible" }
else { 
    $encryptionStatusArr = $bitlocker | ForEach-Object { "$($_.MountPoint):$($_.ProtectionStatus)" }
    $encryptionStatus = $encryptionStatusArr -join "; "
}

# USB Storage Access
$usbRegistry = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR" -ErrorAction SilentlyContinue
$usbAccess = switch ($usbRegistry.Start) {
    3 { "Enabled" }
    4 { "Disabled" }
    Default { "Unknown" }
}

# --- 2. Gather Security Software Info ---

# VPN Software Detection
$vpnSW = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* |
    Where-Object { $_.DisplayName -match "(VPN|Cisco|Fortinet|Pulse Secure|GlobalProtect|AnyConnect|NetMotion|Zscaler|SonicWall|Check Point|OpenVPN|Pritunl|WatchGuard)" } |
    Select-Object DisplayName, DisplayVersion
if ($vpnSW) {
    $vpnSWArr = $vpnSW | ForEach-Object { "$($_.DisplayName) ($($_.DisplayVersion))" }
    $vpnSWList = $vpnSWArr -join "; "
}
else {
    $vpnSWList = "None"
}

# Antivirus Detection
$av = Get-CimInstance -Namespace root\SecurityCenter2 -ClassName AntivirusProduct -ErrorAction SilentlyContinue
# Check for CrowdStrike specifically as it's often a service, not just WMI
$falcon = Get-Service -Name CSFalconService -ErrorAction SilentlyContinue

if ($falcon.Status -eq 'Running') {
    $antivirus = "CrowdStrike Falcon (Active)"
}
elseif ($av) {
    $avArr = $av | ForEach-Object { "$($_.displayName)" }
    $antivirus = $avArr -join "; "
}
else {
    $antivirus = "None"
}

# --- 3. Gather Installed Software (The "Bulk" list) ---
Write-Host "Gathering installed software list..."

$paramPolyfill = @{
    'Name'            = { $_.DisplayName }
    'Version'         = { $_.DisplayVersion }
    'Publisher'       = { $_.Publisher }
    'InstallDate'     = { $_.InstallDate }
    'InstallLocation' = { $_.InstallLocation }
}

$softwareList = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*, HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*, HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* |
    Where-Object { -not [string]::IsNullOrEmpty($_.DisplayName) } |
    Select-Object @{N='Name';E={ $_.DisplayName }}, @{N='Version';E={ $_.DisplayVersion }}, @{N='Publisher';E={ $_.Publisher }}, @{N='InstallDate';E={ $_.InstallDate }}, @{N='InstallLocation';E={ $_.InstallLocation }} |
    Sort-Object Name

# --- 4. Construct Payload ---

$payload = @{
    employeeID   = $userName
    assetId      = $computerName
    systemInfo   = @{
        computerName     = $computerName
        userName         = $userName
        domain           = $domain
        ipAddress        = $ipAddress
        osVersion        = $os.Caption
        buildNumber      = $os.BuildNumber
        osArchitecture   = $os.OSArchitecture
        serialNumber     = $computerInfo.BiosSeralNumber # Typo in property name is common in older PS, using generic if needed
        manufacturer     = $computerInfo.CsManufacturer
        model            = $computerInfo.CsModel
        totalRAM         = [math]::Round($computerInfo.CsTotalPhysicalMemory / 1GB, 2)
        processor        = $computerInfo.CsProcessors.Name
        adminRights      = $adminRights
        encryptionStatus = $encryptionStatus
        vpnSoftware      = $vpnSWList
        antivirus        = $antivirus
        usbStorageAccess = $usbAccess
        scanDate         = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    softwareList = $softwareList
}

# Convert to JSON
$jsonPayload = $payload | ConvertTo-Json -Depth 5 -Compress

# --- 5. Send to API ---
Write-Host "Refreshed data collected. Uploading to $API_URL..."

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $jsonPayload -ContentType "application/json" -TimeoutSec 30
    Write-Host "Upload Success! Verification ID: $($response.verificationId)" -ForegroundColor Green
}
catch {
    Write-Host "Upload Failed." -ForegroundColor Red
    Write-Host "Error Details: $_"
    # Optional: Save failed payload for debug
    $jsonPayload | Out-File "$env:TEMP\Failed_Upload_Payload.json"
}

Stop-Transcript
