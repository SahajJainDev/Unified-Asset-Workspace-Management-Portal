const express = require('express');
const router = express.Router();
const { SoftwareVerification, InstalledSoftware } = require('../models/SoftwareVerification');
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const { logActivity } = require('../utils/activityLogger');

// Upload scan results
router.post('/upload-scan', async (req, res) => {
  try {
    const { employeeNumber, assetId, scanData } = req.body;

    console.log('=== Software Verification Upload ===');
    console.log('Employee Number:', employeeNumber);
    console.log('Asset ID:', assetId);
    console.log('Scan Data:', scanData ? 'Present' : 'Missing');

    // Validate scan data structure
    if (!scanData?.SystemInfo || !scanData?.InstalledSoftware) {
      console.log('ERROR: Invalid scan data format');
      return res.status(400).json({ error: 'Invalid scan data format' });
    }

    console.log('Software Count:', scanData.InstalledSoftware.length);

    // Verify employee
    const employee = await Employee.findOne({ empId: employeeNumber });

    if (!employee) {
      console.log('ERROR: Employee not found with empId:', employeeNumber);
      return res.status(404).json({ error: `Employee not found with ID: ${employeeNumber}. Please check the Employee Number.` });
    }

    console.log('Employee found:', employee.fullName);

    // Verify asset
    const asset = await Asset.findOne({ assetTag: assetId });

    if (!asset) {
      console.log('ERROR: Asset not found with assetTag:', assetId);
      return res.status(404).json({ error: `Asset not found with ID: ${assetId}. Please check the Asset ID.` });
    }

    console.log('Asset found:', asset.assetName);

    // Create verification record
    const verification = await SoftwareVerification.create({
      employeeId: employeeNumber,
      assetId: assetId,
      systemInfo: {
        computerName: scanData.SystemInfo.ComputerName,
        userName: scanData.SystemInfo.UserName,
        domain: scanData.SystemInfo.Domain,
        osVersion: scanData.SystemInfo.OSVersion,
        osArchitecture: scanData.SystemInfo.OSArchitecture,
        serialNumber: scanData.SystemInfo.SerialNumber,
        manufacturer: scanData.SystemInfo.Manufacturer,
        model: scanData.SystemInfo.Model,
        totalRAM: scanData.SystemInfo.TotalRAM,
        processor: scanData.SystemInfo.Processor,
        scanDate: new Date(scanData.SystemInfo.ScanDate)
      },
      scannedAt: new Date(scanData.SystemInfo.ScanDate),
      status: 'COMPLETED',
      softwareCount: scanData.InstalledSoftware.length
    });

    // Save installed software
    const softwareRecords = [];
    for (const software of scanData.InstalledSoftware) {
      // Skip entries without a name
      if (!software.Name || software.Name.trim() === '') {
        console.log('Skipping software with no name');
        continue;
      }

      const record = await InstalledSoftware.create({
        verificationId: verification._id,
        softwareName: software.Name.trim(),
        version: software.Version || 'Unknown',
        publisher: software.Publisher || 'Unknown',
        installDate: software.InstallDate || null,
        installLocation: software.InstallLocation || null,
        source: software.Source || 'UserRegistry'
      });
      softwareRecords.push(record);
    }

    console.log(`Saved ${softwareRecords.length} software records out of ${scanData.InstalledSoftware.length} total`);

    // Log activity
    await logActivity(
      'Software Verification',
      `${employee.fullName} completed software scan for ${asset.assetName} (${assetId}) - ${softwareRecords.length} applications detected`,
      'verified',
      'bg-blue-50 text-blue-600',
      'verification'
    );

    console.log('SUCCESS: Verification saved with ID:', verification._id);

    res.json({
      success: true,
      verificationId: verification._id,
      softwareCount: softwareRecords.length,
      computerName: scanData.SystemInfo.ComputerName,
      scanDate: scanData.SystemInfo.ScanDate,
      message: 'Software verification completed successfully',
    });

  } catch (error) {
    console.error('=== Software Verification Upload Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
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
