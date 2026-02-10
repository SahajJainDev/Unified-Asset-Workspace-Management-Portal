const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const License = require('../models/License');
const Verification = require('../models/Verification');
const Software = require('../models/Software');
const Desk = require('../models/Desk');

// GET /api/reports/audit — Comprehensive Audit Report
router.get('/audit', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // ========== ASSET AUDIT ==========
    const totalAssets = await Asset.countDocuments();
    const assetStatusCounts = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const assetsByType = await Asset.aggregate([
      { $group: { _id: '$assetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Assets with warranty expired
    const warrantyExpired = await Asset.countDocuments({
      warrantyExpiry: { $lt: now }
    });
    // Assets with warranty expiring in 30 days
    const warrantyExpiring = await Asset.countDocuments({
      warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow }
    });

    // Assigned vs Unassigned (use status field to match status breakdown)
    const assignedAssets = await Asset.countDocuments({ status: 'Assigned' });
    const unassignedAssets = totalAssets - assignedAssets;

    // ========== VERIFICATION AUDIT ==========
    // Employee-centric: show ALL assigned assets, default "Pending" until verified

    // 1. Get all assigned assets (these need verification)
    const assignedAssetsList = await Asset.find({
      $or: [
        { status: 'Assigned' },
        { 'employee.number': { $exists: true, $ne: '' } },
        { assignedTo: { $exists: true, $ne: '', $ne: null } }
      ]
    }).lean();

    // 2. Get all existing verification records
    const allVerifications = await Verification.find()
      .populate('assetId', 'assetName assetTag assetType model serialNumber status')
      .sort({ verificationDate: -1 })
      .lean();

    // 3. Build lookup: assetId string → latest verification record
    const verificationByAsset = {};
    allVerifications.forEach(v => {
      const assetKey = v.assetId?._id?.toString() || v.assetId?.toString();
      if (assetKey && !verificationByAsset[assetKey]) {
        verificationByAsset[assetKey] = v; // first match = latest (sorted desc)
      }
    });

    // 4. Merge: for each assigned asset, use verification if exists, else "Pending"
    const verificationRecords = assignedAssetsList.map(asset => {
      const assetKey = asset._id.toString();
      const verification = verificationByAsset[assetKey];

      if (verification) {
        return {
          _id: verification._id.toString(),
          enteredAssetId: verification.enteredAssetId,
          employeeId: verification.employeeId,
          employeeName: verification.employeeName,
          status: verification.status,
          verificationDate: verification.verificationDate,
          notes: verification.notes || '',
          asset: {
            name: asset.assetName,
            tag: asset.assetTag,
            type: asset.assetType,
            model: asset.model,
            serialNumber: asset.serialNumber,
            status: asset.status
          }
        };
      } else {
        // No verification submitted yet — default to Pending
        return {
          _id: asset._id.toString(),
          enteredAssetId: '',
          employeeId: asset.employee?.number || asset.assignedTo || '',
          employeeName: asset.employee?.name || asset.assignedTo || 'Unassigned',
          status: 'Pending',
          verificationDate: null,
          notes: 'Not yet submitted',
          asset: {
            name: asset.assetName,
            tag: asset.assetTag,
            type: asset.assetType,
            model: asset.model,
            serialNumber: asset.serialNumber,
            status: asset.status
          }
        };
      }
    });

    // 5. Include verifications for assets no longer assigned (flagged/discrepant)
    const assignedAssetIds = new Set(assignedAssetsList.map(a => a._id.toString()));
    allVerifications.forEach(v => {
      const assetKey = v.assetId?._id?.toString() || v.assetId?.toString();
      if (assetKey && !assignedAssetIds.has(assetKey)) {
        verificationRecords.push({
          _id: v._id.toString(),
          enteredAssetId: v.enteredAssetId,
          employeeId: v.employeeId,
          employeeName: v.employeeName,
          status: v.status,
          verificationDate: v.verificationDate,
          notes: v.notes || '',
          asset: v.assetId && typeof v.assetId === 'object' && v.assetId.assetName ? {
            name: v.assetId.assetName,
            tag: v.assetId.assetTag,
            type: v.assetId.assetType,
            model: v.assetId.model,
            serialNumber: v.assetId.serialNumber,
            status: v.assetId.status
          } : null
        });
      }
    });

    // 6. Recalculate counts from merged records
    const verifiedCount = verificationRecords.filter(r => r.status === 'Verified').length;
    const pendingCount = verificationRecords.filter(r => r.status === 'Pending').length;
    const flaggedCount = verificationRecords.filter(r => r.status === 'Flagged').length;
    const totalVerifications = verificationRecords.length;

    // 7. Group by employee for compliance summary (compact, scalable)
    const employeeMap = {};
    verificationRecords.forEach(r => {
      const key = r.employeeId || 'unknown';
      if (!employeeMap[key]) {
        employeeMap[key] = {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          totalAssets: 0,
          verified: 0,
          pending: 0,
          flagged: 0
        };
      }
      employeeMap[key].totalAssets++;
      if (r.status === 'Verified') employeeMap[key].verified++;
      else if (r.status === 'Pending') employeeMap[key].pending++;
      else if (r.status === 'Flagged') employeeMap[key].flagged++;
    });

    const employeeSummary = Object.values(employeeMap)
      .map(e => ({
        ...e,
        compliance: e.totalAssets > 0 ? Math.round((e.verified / e.totalAssets) * 100) : 0
      }))
      .sort((a, b) => a.compliance - b.compliance); // Least compliant first

    // 8. Action items: only Pending + Flagged records (exception-driven audit)
    const actionItems = verificationRecords
      .filter(r => r.status !== 'Verified')
      .sort((a, b) => {
        // Flagged (discrepant) first, then Pending
        if (a.status === 'Flagged' && b.status !== 'Flagged') return -1;
        if (a.status !== 'Flagged' && b.status === 'Flagged') return 1;
        return 0;
      });

    // ========== LICENSE AUDIT ==========
    const totalLicenses = await License.countDocuments();
    const activeLicenses = await License.countDocuments({ expiryDate: { $gte: now } });
    const expiredLicenses = await License.countDocuments({ expiryDate: { $lt: now } });
    const expiringLicenses = await License.countDocuments({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow }
    });

    // License compliance by software
    const licensesBySoftware = await License.aggregate([
      {
        $group: {
          _id: '$softwareName',
          total: { $sum: 1 },
          totalSeats: { $sum: '$seatsLimit' },
          expired: {
            $sum: { $cond: [{ $lt: ['$expiryDate', now] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $gte: ['$expiryDate', now] }, 1, 0] }
          },
          expiring: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$expiryDate', now] }, { $lte: ['$expiryDate', thirtyDaysFromNow] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // ========== DESK / WORKSPACE AUDIT ==========
    const totalDesks = await Desk.countDocuments();
    const occupiedDesks = await Desk.countDocuments({ status: 'Occupied' });
    const availableDesks = await Desk.countDocuments({ status: 'Available' });

    // ========== OVERALL AUDIT SCORE (commented out as per requirements) ==========
    // const verificationScore = totalVerifications > 0 ? (verifiedCount / totalVerifications) * 100 : 100;
    // const licenseScore = totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 100;
    // const assignmentScore = totalAssets > 0 ? (assignedAssets / totalAssets) * 100 : 100;
    // const deskScore = totalDesks > 0 ? (occupiedDesks / totalDesks) * 100 : 100;
    // const overallScore = Math.round(
    //   (verificationScore * 0.4) + (licenseScore * 0.3) + (assignmentScore * 0.15) + (deskScore * 0.15)
    // );

    // Build the findings/flags list
    const findings = [];
    if (flaggedCount > 0) findings.push({ severity: 'high', message: `${flaggedCount} asset verification(s) discrepant`, area: 'Verification' });
    if (expiredLicenses > 0) findings.push({ severity: 'high', message: `${expiredLicenses} license(s) expired`, area: 'Licenses' });
    if (expiringLicenses > 0) findings.push({ severity: 'medium', message: `${expiringLicenses} license(s) expiring within 30 days`, area: 'Licenses' });
    if (warrantyExpired > 0) findings.push({ severity: 'medium', message: `${warrantyExpired} asset(s) past warranty`, area: 'Assets' });
    if (warrantyExpiring > 0) findings.push({ severity: 'low', message: `${warrantyExpiring} asset warranty(ies) expiring in 30 days`, area: 'Assets' });
    if (pendingCount > 0) findings.push({ severity: 'low', message: `${pendingCount} verification(s) still pending`, area: 'Verification' });
    if (unassignedAssets > 0) findings.push({ severity: 'low', message: `${unassignedAssets} asset(s) unassigned`, area: 'Assets' });

    res.json({
      generatedAt: now.toISOString(),
      sections: {
        assets: {
          totalAssets,
          statusBreakdown: assetStatusCounts,
          byType: assetsByType,
          assigned: assignedAssets,
          unassigned: unassignedAssets,
          warrantyExpired,
          warrantyExpiring
        },
        verification: {
          total: totalVerifications,
          verified: verifiedCount,
          pending: pendingCount,
          flagged: flaggedCount,
          employeeSummary,
          actionItems
        },
        licenses: {
          total: totalLicenses,
          active: activeLicenses,
          expired: expiredLicenses,
          expiring: expiringLicenses,
          bySoftware: licensesBySoftware
        },
        workspace: {
          totalDesks,
          occupied: occupiedDesks,
          available: availableDesks,
          utilization: totalDesks > 0 ? Math.round((occupiedDesks / totalDesks) * 100) : 0
        }
      },
      findings
    });
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({ message: 'Failed to generate audit report' });
  }
});

module.exports = router;
