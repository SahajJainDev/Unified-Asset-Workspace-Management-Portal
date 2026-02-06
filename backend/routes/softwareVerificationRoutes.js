const express = require('express');
const router = express.Router();
const { SoftwareVerification, InstalledSoftware } = require('../models/SoftwareVerification');
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const { logActivity } = require('../utils/activityLogger');

// Upload scan results
router.post('/upload-scan', async (req, res) => {
  try {
    const { employeeID, assetId, systemInfo, softwareList } = req.body;

    console.log('=== Software Verification Upload ===');
    console.log('Employee ID:', employeeID);
    console.log('Asset ID:', assetId);
    
    // Validate required fields
    if (!employeeID || !assetId) {
       return res.status(400).json({ error: 'Missing required fields: employeeID or assetId' });
    }

    const installedSoftware = softwareList || [];
    console.log('Software Count:', installedSoftware.length);

    // Verify employee (using empId, email, or name)
    let employee = await Employee.findOne({ empId: employeeID });

    if (!employee) {
      console.log(`Employee not found with empId: ${employeeID}. Trying alternative lookups...`);
      
      // Try by email (assuming username part matches)
      // Escaping regex characters just in case
      const safeId = employeeID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      employee = await Employee.findOne({ 
        $or: [
          { email: { $regex: new RegExp(`^${safeId}@`, 'i') } }, // Match start of email
          { email: { $regex: new RegExp(safeId, 'i') } }, // Match anywhere in email (fallback)
          { fullName: { $regex: new RegExp(safeId.replace('.', ' '), 'i') } } // "sahaj.jain" -> "sahaj jain" match
        ]
      });
    }

    if (!employee) {
      console.log('Employee not found with any method for:', employeeID);
       return res.status(404).json({ error: `Employee not found with ID: ${employeeID}. Ensure the user exists in the database with a matching empId, email, or name.` });
    }

    console.log('Employee found:', employee.fullName);

    // Verify or Create Asset
    // The script sends computerName as assetId.
    let asset = await Asset.findOne({ assetTag: assetId });

    if (!asset) {
      console.log('Asset not found, creating new asset record for:', assetId);
      // Auto-create asset if it doesn't exist?
      // "assetId" from script is "computerName".
      // let's create a basic asset.
      asset = await Asset.create({
          assetTag: assetId,
          assetName: systemInfo?.computerName || assetId,
          category: 'Laptop', // Default assumption
          status: 'In Use',
          assignedTo: employee._id
      });
    }

    // Create verification record
    const verification = await SoftwareVerification.create({
      employeeId: employeeID,
      assetId: assetId,
      systemInfo: {
        computerName: systemInfo?.computerName,
        userName: systemInfo?.userName,
        domain: systemInfo?.domain,
        ipAddress: systemInfo?.ipAddress,
        osVersion: systemInfo?.osVersion,
        osBuildNumber: systemInfo?.buildNumber,
        osArchitecture: systemInfo?.osArchitecture, // Script might need to add this if missing
        serialNumber: systemInfo?.serialNumber, // Script might need to add this
        manufacturer: systemInfo?.manufacturer, // Script might need to add this
        model: systemInfo?.model, // Script might need to add this
        totalRAM: systemInfo?.totalRAM, // Script might need to add this
        processor: systemInfo?.processor, // Script might need to add this
        adminRights: systemInfo?.adminRights,
        encryptionStatus: systemInfo?.encryptionStatus,
        vpnSoftware: systemInfo?.vpnSoftware,
        antivirus: systemInfo?.antivirus,
        usbStorageAccess: systemInfo?.usbStorageAccess,
        scanDate: systemInfo?.scanDate ? new Date(systemInfo.scanDate) : new Date()
      },
      scannedAt: new Date(),
      status: 'COMPLETED',
      softwareCount: installedSoftware.length
    });

    // Save installed software
    const softwareRecords = [];
    for (const software of installedSoftware) {
      // Skip entries without a name
      if (!software.Name || software.Name.trim() === '') {
        continue;
      }

      const record = await InstalledSoftware.create({
        verificationId: verification._id,
        softwareName: software.Name.trim(),
        version: software.Version || 'Unknown',
        publisher: software.Publisher || 'Unknown',
        installDate: software.InstallDate || null,
        installLocation: software.InstallLocation || null,
        source: 'ScriptScan'
      });
      softwareRecords.push(record);
    }

    console.log(`Saved ${softwareRecords.length} software records.`);

    // Log activity
    await logActivity(
      'Software Verification',
      `${employee.fullName} completed software scan for ${asset.assetName} (${assetId}) - ${softwareRecords.length} applications detected`,
      'verified',
      'bg-blue-50 text-blue-600',
      'verification'
    );

    res.json({
      success: true,
      verificationId: verification._id,
      softwareCount: softwareRecords.length,
      message: 'Software verification completed successfully',
    });

  } catch (error) {
    console.error('=== Software Verification Upload Error ===');
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process scan data', details: error.message });
  }
});

// Get verification history for an employee
router.get('/history/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;

    const verifications = await SoftwareVerification.find({ employeeId: employeeNumber })
      .sort({ scannedAt: -1 })
      .limit(10);

    const results = await Promise.all(verifications.map(async (verification) => {
      const asset = await Asset.findOne({ assetTag: verification.assetId });
      const softwareCount = await InstalledSoftware.countDocuments({ verificationId: verification._id });
      
      return {
        id: verification._id,
        assetId: verification.assetId,
        assetName: asset?.assetName || 'Unknown',
        computerName: verification.systemInfo.computerName,
        scannedAt: verification.scannedAt,
        softwareCount: softwareCount,
        status: verification.status
      };
    }));

    res.json(results);

  } catch (error) {
    console.error('Error fetching verification history:', error);
    res.status(500).json({ error: 'Failed to fetch verification history' });
  }
});

// Get latest verification for an asset
router.get('/asset/:assetId/latest', async (req, res) => {
  try {
    const { assetId } = req.params;

    const verification = await SoftwareVerification.findOne({ assetId })
      .sort({ scannedAt: -1 });

    if (!verification) {
      return res.status(404).json({ error: 'No verification found for this asset' });
    }

    const software = await InstalledSoftware.find({ verificationId: verification._id });
    const asset = await Asset.findOne({ assetTag: assetId });
    const employee = await Employee.findOne({ empId: verification.employeeId });

    res.json({
      id: verification._id,
      asset: asset ? { tag: asset.assetTag, name: asset.assetName } : null,
      employee: employee ? { id: employee.empId, name: employee.fullName } : null,
      systemInfo: verification.systemInfo,
      scannedAt: verification.scannedAt,
      softwareCount: software.length,
      status: verification.status,
      installedSoftware: software
    });

  } catch (error) {
    console.error('Error fetching asset verification:', error);
    res.status(500).json({ error: 'Failed to fetch asset verification' });
  }
});

// Get all verifications (admin view)
router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await SoftwareVerification.countDocuments();
    const verifications = await SoftwareVerification.find()
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(limit);

    const results = await Promise.all(verifications.map(async (verification) => {
      const asset = await Asset.findOne({ assetTag: verification.assetId });
      const employee = await Employee.findOne({ empId: verification.employeeId });
      
      return {
        id: verification._id,
        employeeId: verification.employeeId,
        employeeName: employee?.fullName || 'Unknown',
        assetId: verification.assetId,
        assetName: asset?.assetName || 'Unknown',
        computerName: verification.systemInfo.computerName,
        scannedAt: verification.scannedAt,
        softwareCount: verification.softwareCount,
        status: verification.status
      };
    }));

    res.json({
      data: results,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });

  } catch (error) {
    console.error('Error fetching all verifications:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// Get detailed verification by ID
router.get('/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;

    const verification = await SoftwareVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const software = await InstalledSoftware.find({ verificationId: verification._id });
    const asset = await Asset.findOne({ assetTag: verification.assetId });
    const employee = await Employee.findOne({ empId: verification.employeeId });

    res.json({
      id: verification._id,
      asset: asset ? { tag: asset.assetTag, name: asset.assetName, type: asset.assetType } : null,
      employee: employee ? { id: employee.empId, name: employee.fullName } : null,
      systemInfo: verification.systemInfo,
      scannedAt: verification.scannedAt,
      softwareCount: software.length,
      status: verification.status,
      installedSoftware: software.map(s => ({
        name: s.softwareName,
        version: s.version,
        publisher: s.publisher,
        installDate: s.installDate,
        source: s.source
      }))
    });

  } catch (error) {
    console.error('Error fetching verification details:', error);
    res.status(500).json({ error: 'Failed to fetch verification details' });
  }
});

module.exports = router;
