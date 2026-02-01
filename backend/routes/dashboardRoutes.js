const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const Software = require("../models/Software");
const Desk = require("../models/Desk");
const Verification = require("../models/Verification");
const Activity = require("../models/Activity");

// Helper function to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
};

// GET Dashboard Statistics
router.get("/stats", async (req, res) => {
  try {
    // Asset distribution by type
    const assetDistribution = await Asset.aggregate([
      { $group: { _id: "$assetType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Asset status counts
    const assetStatusCounts = await Asset.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Total assets
    const totalAssets = await Asset.countDocuments();

    // Software with expiring licenses (Real Data)
    const License = require("../models/License");
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLicenses = await License.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });

    // Recent activities (mock data - would need activity log model)
    const recentActivities = [
      { title: 'MacBook Pro assigned', user: 'Assigned to Sarah Jenkins (Design)', time: '2m ago', icon: 'laptop_mac', color: 'bg-blue-50 text-blue-600' },
      { title: 'License Expired', user: 'Adobe Creative Cloud (10 seats)', time: '1h ago', icon: 'warning', color: 'bg-amber-50 text-amber-600' },
      { title: 'Maintenance Complete', user: 'Server Room B cooling system check', time: '3h ago', icon: 'check_circle', color: 'bg-emerald-50 text-emerald-600' },
      { title: 'Desk Reservation', user: 'Mike Ross reserved Desk 4B-12', time: '5h ago', icon: 'event_seat', color: 'bg-purple-50 text-purple-600' },
      { title: 'Policy Update', user: 'Remote Work Equipment Policy v2.1', time: '1d ago', icon: 'description', color: 'bg-slate-50 text-slate-600' },
    ];

    // Desk status (mock data - would need desk model)
    // Desk status (Real Data)
    const totalDesks = await Desk.countDocuments();
    const occupiedDesks = await Desk.countDocuments({ status: 'Occupied' });
    const availableDesks = await Desk.countDocuments({ status: 'Available' });
    // Reserved is not currently tracked effectively in Excel/Model logic, usually specific status. 
    // If not tracked, set to 0 or imply from other logic. For now, 0 or check if 'Reserved' status exists.
    // Based on Desk.js model, status enum is ['Available', 'Occupied']. So Reserved is 0.
    const reservedDesks = 0;

    const deskStatus = {
      occupied: occupiedDesks,
      available: availableDesks,
      reserved: reservedDesks,
      total: totalDesks
    };

    // Helper for Asset Colors
    const getAssetColor = (index) => {
      const colors = ['#137fec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
      return colors[index % colors.length];
    };

    // Verification stats from database
    const verificationCounts = await Verification.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const verificationStats = {
      verified: verificationCounts.find(item => item._id === 'Verified')?.count || 0,
      pending: verificationCounts.find(item => item._id === 'Pending')?.count || 0,
      flagged: verificationCounts.find(item => item._id === 'Flagged')?.count || 0
    };

    const stats = {
      totalAssets,
      assetDistribution: assetDistribution.map((item, index) => ({
        name: item._id || 'Other',
        value: item.count,
        color: getAssetColor(index)
      })),
      assetStatusCounts,
      expiringLicenses,
      deskStatus,
      verificationStats,
      recentActivities
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// GET Software Statistics for Cards
router.get("/software-stats", async (req, res) => {
  try {
    const softwareList = await Software.find();

    const totalLicenses = softwareList.reduce((sum, sw) => sum + sw.totalSeats, 0);

    let totalUtil = 0;
    let count = 0;
    softwareList.forEach(sw => {
      if (sw.totalSeats > 0) {
        totalUtil += (sw.usedSeats / sw.totalSeats);
        count++;
      }
    });
    const utilizationAvg = count > 0 ? Math.round((totalUtil / count) * 100) : 0;

    // Renewals Pending (Licenses expiring in 30 days)
    // Need to query License model, so import needed if not present
    // But dashboardRoutes already imports models/Software. License model not imported?
    const License = require("../models/License");
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const pendingRenewals = await License.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });

    res.json([
      { label: 'Total Licenses', value: totalLicenses.toLocaleString(), icon: 'package_2', trend: '+0' }, // Trend logic can be refined later
      { label: 'Utilization Avg', value: `${utilizationAvg}%`, icon: 'group_work', trend: 'Avg' },
      { label: 'Renewals Pending', value: pendingRenewals.toString(), icon: 'event_repeat', trend: 'Next: 30 days' },
    ]);

  } catch (error) {
    console.error("Error fetching software stats:", error);
    res.status(500).json({ message: "Failed to fetch software stats" });
  }
});

// SEARCH GLOBAL
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ assets: [], software: [], licenses: [] });

  try {
    const regex = new RegExp(q, "i");

    const [assets, software, licenses] = await Promise.all([
      Asset.find({
        $or: [
          { assetName: regex },
          { assetTag: regex },
          { model: regex },
          { serialNumber: regex },
          { 'employee.name': regex }
        ]
      }).limit(5),
      Software.find({
        $or: [
          { name: regex },
          { version: regex }
        ]
      }).limit(5),
      require("../models/License").find({
        $or: [
          { softwareName: regex },
          { licenseKey: regex },
          { assignedSystem: regex }
        ]
      }).limit(5)
    ]);

    res.json({ assets, software, licenses });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Failed to perform global search" });
  }
});

module.exports = router;

