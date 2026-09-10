const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getVapidPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');

router.get('/vapid-public-key', protect, getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.delete('/subscribe', protect, unsubscribe);

module.exports = router;
