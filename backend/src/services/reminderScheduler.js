const cron = require('node-cron');
const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const PushSubscription = require('../models/PushSubscription');
const { sendTaskReminderEmail } = require('./emailService');
const { sendPushNotification } = require('./pushService');

const ONE_HOUR = 60 * 60 * 1000;
const THREE_HOURS = 3 * ONE_HOUR;
const SIX_HOURS = 6 * ONE_HOUR;
const ONE_DAY = 24 * ONE_HOUR;

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + ONE_DAY);

    // Find incomplete tasks due within 24 hours that are not currently muted
    const dueTodos = await Todo.find({
      completed: false,
      dueDate: { $ne: null, $lte: in24h },
      $or: [{ mutedUntil: null }, { mutedUntil: { $lte: now } }],
    }).populate('user', 'name email');

    for (const todo of dueTodos) {
      if (!todo.user || !todo.user.email) continue;

      const timeUntilDue = todo.dueDate.getTime() - now.getTime();

      // Determine repeat interval based on urgency
      // ≤ 6 hours (or overdue): every 1 hour
      // ≤ 24 hours: every 3 hours
      const interval = timeUntilDue <= SIX_HOURS ? ONE_HOUR : THREE_HOURS;

      const lastSent = todo.lastReminderSentAt ? new Date(todo.lastReminderSentAt).getTime() : 0;
      const shouldSend = !lastSent || now.getTime() - lastSent >= interval;

      if (!shouldSend) continue;

      const urgencyLabel = timeUntilDue <= 0
        ? 'OVERDUE'
        : timeUntilDue <= SIX_HOURS
          ? 'DUE SOON'
          : 'DUE TODAY';

      // Send email
      try {
        await sendTaskReminderEmail({
          to: todo.user.email,
          name: todo.user.name,
          taskTitle: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          priority: todo.priority,
          urgencyLabel,
        });
      } catch (emailErr) {
        console.error(`[ReminderScheduler] Email error for "${todo.title}":`, emailErr.message);
      }

      // Send push notifications to all subscribed devices
      const pushSubs = await PushSubscription.find({ user: todo.user._id });
      for (const sub of pushSubs) {
        const result = await sendPushNotification(sub.subscription, {
          title: `${urgencyLabel === 'OVERDUE' ? '🚨' : '⏰'} ${urgencyLabel}: ${todo.title}`,
          body: `Priority: ${todo.priority.toUpperCase()} • Due: ${new Date(todo.dueDate).toLocaleString()}`,
          url: '/',
          tag: `reminder-${todo._id}`,
        });
        if (result === 'expired') {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }

      todo.lastReminderSentAt = now;
      todo.reminderSent = true;
      await todo.save();

      console.log(`[ReminderScheduler] Reminder sent for "${todo.title}" (${urgencyLabel}, interval: ${interval / ONE_HOUR}h)`);

      try {
        await Activity.create({
          user: todo.user._id,
          action: 'UPDATED',
          todoTitle: todo.title,
          todoId: todo._id,
          details: `${urgencyLabel} reminder sent via email${pushSubs.length > 0 ? ` + push (${pushSubs.length} device(s))` : ''}`,
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error('[ReminderScheduler] Error:', err.message);
  }
};

const initReminderScheduler = () => {
  cron.schedule('* * * * *', () => { checkAndSendReminders(); });
  console.log('[ReminderScheduler] Initialized — every 1h when ≤6h left, every 3h when ≤24h left.');
  setTimeout(() => { checkAndSendReminders(); }, 5000);
};

module.exports = { initReminderScheduler, checkAndSendReminders };
