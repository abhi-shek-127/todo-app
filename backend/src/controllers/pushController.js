const PushSubscription = require('../models/PushSubscription');
const { sendPushNotification } = require('../services/pushService');

const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};

const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    await PushSubscription.findOneAndUpdate(
      { user: req.user._id, 'subscription.endpoint': subscription.endpoint },
      { user: req.user._id, subscription },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Push subscription saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ user: req.user._id, 'subscription.endpoint': endpoint });
    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getVapidPublicKey, subscribe, unsubscribe };
