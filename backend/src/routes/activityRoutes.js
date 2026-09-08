const express = require('express');
const router = express.Router();
const {
  getActivities,
  clearActivities,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// All activity routes require authentication
router.use(protect);

router.route('/')
  .get(getActivities)
  .delete(clearActivities);

module.exports = router;
