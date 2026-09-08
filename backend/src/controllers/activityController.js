const Activity = require('../models/Activity');

// @desc    Get user activity log
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching activity history',
    });
  }
};

// @desc    Clear user activity log
// @route   DELETE /api/activities
// @access  Private
const clearActivities = async (req, res) => {
  try {
    await Activity.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: 'Activity history cleared successfully',
    });
  } catch (error) {
    console.error('Clear activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error clearing activity history',
    });
  }
};

module.exports = {
  getActivities,
  clearActivities,
};
