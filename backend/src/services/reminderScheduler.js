const cron = require('node-cron');
const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const PushSubscription = require('../models/PushSubscription');
const { sendTaskReminderEmail } = require('./emailService');
const { sendPushNotification } = require('./pushService');

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueTodos = await Todo.find({
      completed: false,
      dueDate: { $ne: null, $lte: reminderWindow },
      reminderSent: { $ne: true },
    }).populate('user', 'name email');

    if (dueTodos.length > 0) {
      console.log(`[ReminderScheduler] Found ${dueTodos.length} task(s) due for reminders.`);
    }

    for (const todo of dueTodos) {
      if (!todo.user || !todo.user.email) continue;

      // Send email reminder
      try {
        await sendTaskReminderEmail({
          to: todo.user.email,
          name: todo.user.name,
          taskTitle: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          priority: todo.priority,
        });
      } catch (emailErr) {
        console.error(`[ReminderScheduler] Email error for "${todo.title}":`, emailErr.message);
      }

      // Send push notifications to all user's subscribed devices
      const pushSubs = await PushSubscription.find({ user: todo.user._id });
      for (const sub of pushSubs) {
        const result = await sendPushNotification(sub.subscription, {
          title: `⏰ Reminder: ${todo.title}`,
          body: `Priority: ${todo.priority.toUpperCase()} • Due: ${new Date(todo.dueDate).toLocaleDateString()}`,
          url: '/',
          tag: `reminder-${todo._id}`,
        });
        if (result === 'expired') {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }

      todo.reminderSent = true;
      await todo.save();

      try {
        await Activity.create({
          user: todo.user._id,
          action: 'UPDATED',
          todoTitle: todo.title,
          todoId: todo._id,
          details: `Reminder sent via email${pushSubs.length > 0 ? ` + push (${pushSubs.length} device(s))` : ''}`,
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error('[ReminderScheduler] Error:', err.message);
  }
};

const initReminderScheduler = () => {
  cron.schedule('* * * * *', () => { checkAndSendReminders(); });
  console.log('[ReminderScheduler] Background task reminder scheduler initialized (checks every 1m).');
  setTimeout(() => { checkAndSendReminders(); }, 5000);
};

module.exports = { initReminderScheduler, checkAndSendReminders };
