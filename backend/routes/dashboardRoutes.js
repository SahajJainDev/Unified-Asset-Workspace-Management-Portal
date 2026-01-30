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

    // Software with expiring licenses (mock data for now - would need license expiry logic)
    const expiringLicenses = await Software.countDocuments({ status: 'Expiring Soon' });

    // Recent activities (mock data - would need activity log model)
    const recentActivities = [
      { title: 'MacBook Pro assigned', user: 'Assigned to Sarah Jenkins (Design)', time: '2m ago', icon: 'laptop_mac', color: 'bg-blue-50 text-blue-600' },
      { title: 'License Expired', user: 'Adobe Creative Cloud (10 seats)', time: '1h ago', icon: 'warning', color: 'bg-amber-50 text-amber-600' },
      { title: 'Maintenance Complete', user: 'Server Room B cooling system check', time: '3h ago', icon: 'check_circle', color: 'bg-emerald-50 text-emerald-600' },
      { title: 'Desk Reservation', user: 'Mike Ross reserved Desk 4B-12', time: '5h ago', icon: 'event_seat', color: 'bg-purple-50 text-purple-600' },
      { title: 'Policy Update', user: 'Remote Work Equipment Policy v2.1', time: '1d ago', icon: 'description', color: 'bg-slate-50 text-slate-600' },
    ];

    // Desk status (mock data - would need desk model)
    const deskStatus = {
      occupied: 425,
      available: 50,
      reserved: 25,
      total: 500
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
      assetDistribution: assetDistribution.map(item => ({
        name: item._id || 'Other',
        value: item.count,
        color: '#137fec'
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

module.exports = router;
