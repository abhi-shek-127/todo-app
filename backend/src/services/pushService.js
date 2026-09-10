const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@taskmaster.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const sendPushNotification = async (subscription, payload) => {
  if (!process.env.VAPID_PUBLIC_KEY) return null;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return 'sent';
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) return 'expired';
    console.error('[PushService] Error:', err.message);
    return null;
  }
};

module.exports = { sendPushNotification };
