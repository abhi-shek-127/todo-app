const cron = require('node-cron');
const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const { sendTaskReminderEmail } = require('./emailService');

/**
 * Scan for tasks that are due soon and have not yet received a reminder
 */
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // Window: due anytime up to 24 hours from now (or already overdue)
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

      try {
        await sendTaskReminderEmail({
          to: todo.user.email,
          name: todo.user.name,
          taskTitle: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          priority: todo.priority,
        });

        todo.reminderSent = true;
        await todo.save();

        // Log in user's activity feed
        try {
          await Activity.create({
            user: todo.user._id,
            action: 'UPDATED',
            todoTitle: todo.title,
            todoId: todo._id,
            details: `Automated reminder email sent to ${todo.user.email}`,
          });
        } catch (actErr) {
          // ignore non-critical activity log error
        }
      } catch (sendErr) {
        console.error(
          `[ReminderScheduler] Error sending reminder for task "${todo.title}":`,
          sendErr.message
        );
      }
    }
  } catch (err) {
    console.error('[ReminderScheduler] Error running reminder job:', err.message);
  }
};

/**
 * Initialize background cron job
 */
const initReminderScheduler = () => {
  // Check every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    checkAndSendReminders();
  });

  console.log('[ReminderScheduler] Background task reminder scheduler initialized (checks every 15m).');

  // Also run an initial check shortly after startup
  setTimeout(() => {
    checkAndSendReminders();
  }, 10000);
};

module.exports = {
  initReminderScheduler,
  checkAndSendReminders,
};
