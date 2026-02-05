import React, { useState, useEffect } from 'react';

interface SoftwareVerificationProps {
  employeeNumber?: string;
  assetId?: string;
}

const SoftwareVerificationNoAdmin: React.FC<SoftwareVerificationProps> = ({ 
  employeeNumber: propEmployeeNumber, 
  assetId: propAssetId 
}) => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState(propEmployeeNumber || '');
  const [assetId, setAssetId] = useState(propAssetId || '');

  useEffect(() => {
    // Load from localStorage if not provided as props
    if (!propEmployeeNumber) {
      const storedEmpId = localStorage.getItem('employeeNumber') || localStorage.getItem('empId');
      if (storedEmpId) setEmployeeNumber(storedEmpId);
    }
    if (!propAssetId) {
      const storedAssetId = localStorage.getItem('assignedAssetId');
      if (storedAssetId) setAssetId(storedAssetId);
    }
  }, [propEmployeeNumber, propAssetId]);

  // PowerShell script that works without admin rights
  const powerShellScript = `# Software Verification Script (No Admin Required)
# AssetTrack Pro - Software Inventory Scanner
# Version 1.0

$OutputFile = "$env:TEMP\\software_scan_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host " AssetTrack Pro Software Scanner" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scanning installed software (No admin rights required)..." -ForegroundColor Green
Write-Host ""

# Method 1: Current User Registry (No admin needed)
Write-Host "[1/4] Scanning user registry..." -ForegroundColor Yellow
$UserSoftware = Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName } |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate

# Method 2: WMI Query (Usually accessible)
Write-Host "[2/4] Querying Windows Management Instrumentation..." -ForegroundColor Yellow
$WmiSoftware = Get-WmiObject -Class Win32_Product -ErrorAction SilentlyContinue |
    Select-Object Name, Version, Vendor, InstallDate

# Method 3: Get-Package (Works without admin on Windows 10+)
Write-Host "[3/4] Checking package manager..." -ForegroundColor Yellow
$PackageSoftware = Get-Package -ErrorAction SilentlyContinue |
    Select-Object Name, Version, ProviderName, Source

# Combine all sources
Write-Host "[4/4] Consolidating results..." -ForegroundColor Yellow
$AllSoftware = @()

foreach ($item in $UserSoftware) {
    $AllSoftware += @{
        Name = $item.DisplayName
        Version = $item.DisplayVersion
        Publisher = $item.Publisher
        InstallDate = $item.InstallDate
        Source = "UserRegistry"
    }
}

foreach ($item in $WmiSoftware) {
    if (-not ($AllSoftware | Where-Object { $_.Name -eq $item.Name })) {
        $AllSoftware += @{
            Name = $item.Name
            Version = $item.Version
            Publisher = $item.Vendor
            InstallDate = $item.InstallDate
            Source = "WMI"
        }
    }
}

foreach ($item in $PackageSoftware) {
    if (-not ($AllSoftware | Where-Object { $_.Name -eq $item.Name })) {
        $AllSoftware += @{
            Name = $item.Name
            Version = $item.Version
            Publisher = $item.ProviderName
            InstallDate = $null
            Source = "PackageManager"
        }
    }
}

# Get system information (No admin required)
Write-Host ""
Write-Host "Collecting system information..." -ForegroundColor Green
$SystemInfo = @{
    ComputerName = $env:COMPUTERNAME
    UserName = $env:USERNAME
    Domain = $env:USERDOMAIN
    OSVersion = (Get-WmiObject Win32_OperatingSystem).Caption
    OSArchitecture = (Get-WmiObject Win32_OperatingSystem).OSArchitecture
    SerialNumber = (Get-WmiObject Win32_BIOS).SerialNumber
    Manufacturer = (Get-WmiObject Win32_ComputerSystem).Manufacturer
    Model = (Get-WmiObject Win32_ComputerSystem).Model
    TotalRAM = [Math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    Processor = (Get-WmiObject Win32_Processor).Name
    ScanDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Create output object
$Output = @{
    SystemInfo = $SystemInfo
    InstalledSoftware = $AllSoftware
    TotalCount = $AllSoftware.Count
}

# Save to JSON
$Output | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host " Scan Completed Successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Computer: $($SystemInfo.ComputerName)" -ForegroundColor Cyan
Write-Host "User: $($SystemInfo.UserName)" -ForegroundColor Cyan
Write-Host "Software Found: $($AllSoftware.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output saved to:" -ForegroundColor Yellow
Write-Host "$OutputFile" -ForegroundColor White
Write-Host ""
Write-Host "Please upload this file to the Employee Portal." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to open the folder"

# Open the folder containing the file
Start-Process explorer.exe -ArgumentList "/select,$OutputFile"`;

  const downloadScript = () => {
    const blob = new Blob([powerShellScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'software_scan.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(powerShellScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate employee and asset IDs first
    if (!employeeNumber?.trim() || !assetId?.trim()) {
      setError('Please enter both Employee Number and Asset ID before uploading.');
      event.target.value = ''; // Reset file input
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Read the JSON file
      const fileContent = await file.text();
      const scanData = JSON.parse(fileContent);

      // Validate the data structure
      if (!scanData.SystemInfo || !scanData.InstalledSoftware) {
        throw new Error('Invalid scan file format. Please use the provided script.');
      }

      // Send to backend
      const response = await fetch('http://localhost:5000/api/software-verification/upload-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeNumber,
          assetId,
          scanData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload scan data');
      }

      const result = await response.json();
      setResult(result);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process scan file');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#dbe0e6] dark:border-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-blue-500 text-3xl">inventory_2</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Software Verification</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verify installed software on your computer • No admin rights required
          </p>
        </div>

        {/* Employee & Asset Info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-3 mb-4">
            <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Important:</strong> Please enter your Employee Number and Asset ID below before uploading the scan file.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                Employee Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="e.g., 1042"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                Asset ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="e.g., LAP-001"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Download the Scan Script
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Download our PowerShell script that will scan your computer's installed software.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <strong>No admin rights required</strong>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadScript}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Download Script
                  </button>
                  <button
                    onClick={copyScript}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">{scriptCopied ? 'check' : 'content_copy'}</span>
                    {scriptCopied ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Run the Script
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
                  <p>Right-click on the downloaded file <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-xs">software_scan.ps1</code> and select:</p>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="font-semibold text-gray-900 dark:text-white">• "Run with PowerShell"</p>
                  </div>
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    If you get an execution policy error, open PowerShell and run:
                  </p>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                    powershell -ExecutionPolicy Bypass -File software_scan.ps1
                  </code>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-yellow-800 dark:text-yellow-300 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">info</span>
                      The script will automatically open the folder containing the scan results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  Upload the Results
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Upload the generated JSON file (usually named <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-xs">software_scan_*.json</code>).
                </p>
                
                {(!employeeNumber?.trim() || !assetId?.trim()) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
                    <p className="text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Please fill in Employee Number and Asset ID above before uploading.
                    </p>
                  </div>
                )}
                
                <label className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-colors text-sm font-semibold w-fit shadow-md ${
                  (!employeeNumber?.trim() || !assetId?.trim())
                    ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                }`}>
                  <span className="material-symbols-outlined">upload_file</span>
                  {uploading ? 'Uploading...' : 'Upload Scan Results'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={uploading || !employeeNumber?.trim() || !assetId?.trim()}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 flex-shrink-0 text-xl">error</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Upload Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 flex-shrink-0 text-3xl">check_circle</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                    ✓ Verification Completed Successfully!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-2xl font-bold text-green-600">{result.softwareCount}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Applications Detected</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-lg font-semibold text-green-600">{result.computerName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Computer Name</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-600">{new Date(result.scanDate).toLocaleString()}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Scan Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">help</span>
          Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-sm">
          <details className="cursor-pointer group">
            <summary className="font-semibold text-gray-900 dark:text-white list-none flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 group-open:rotate-90 transition-transform">chevron_right</span>
              Why don't you need admin rights?
            </summary>
            <p className="text-gray-600 dark:text-gray-400 mt-2 ml-7">
              The script reads software information from user-accessible registry keys, WMI queries, and the Windows Package Manager - all of which work without administrator privileges.
            </p>
          </details>
          
          <details className="cursor-pointer group">
            <summary className="font-semibold text-gray-900 dark:text-white list-none flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 group-open:rotate-90 transition-transform">chevron_right</span>
              Is this safe?
            </summary>
            <p className="text-gray-600 dark:text-gray-400 mt-2 ml-7">
              Yes! The script only reads information - it doesn't modify anything on your computer. You can review the script code before running it by opening it in a text editor.
            </p>
          </details>
          
          <details className="cursor-pointer group">
            <summary className="font-semibold text-gray-900 dark:text-white list-none flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 group-open:rotate-90 transition-transform">chevron_right</span>
              What if I get a security warning?
            </summary>
            <p className="text-gray-600 dark:text-gray-400 mt-2 ml-7">
              Windows may show a security warning for downloaded scripts. This is normal. You can bypass it by using the PowerShell command provided in Step 2 or by changing your execution policy temporarily.
            </p>
          </details>

          <details className="cursor-pointer group">
            <summary className="font-semibold text-gray-900 dark:text-white list-none flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 group-open:rotate-90 transition-transform">chevron_right</span>
              Where is the scan file saved?
            </summary>
            <p className="text-gray-600 dark:text-gray-400 mt-2 ml-7">
              The scan file is saved in your Windows Temp folder and the script will automatically open the folder for you. The file is named with a timestamp like <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">software_scan_20260205_143022.json</code>.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};

export default SoftwareVerificationNoAdmin;
