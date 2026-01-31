const Activity = require('../models/Activity');

/**
 * Log a new activity to the database
 * @param {string} title - The title/action of the activity
 * @param {string} user - The user or entity associated with the activity
 * @param {string} icon - Material Symbols icon name
 * @param {string} color - Tailwind color class string (e.g. 'bg-blue-50 text-blue-600')
 * @param {string} category - Category (asset, license, maintenance, reservation, policy, other)
 * @param {string} details - Optional details about the activity
 */
const logActivity = async (title, user, icon, color, category = 'other', details = '') => {
  try {
    const activity = new Activity({
      title,
      user,
      icon,
      color,
      category,
      details
    });
    await activity.save();
    console.log(`Activity logged: ${title}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw logic - logging failure shouldn't block the main operation
  }
};

module.exports = { logActivity };
