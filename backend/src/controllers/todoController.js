const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const PushSubscription = require('../models/PushSubscription');
const { sendPushNotification } = require('../services/pushService');

// @desc    Get all todos for the authenticated user
// @route   GET /api/todos
// @access  Private
const getTodos = async (req, res) => {
  try {
    const { status, priority, search, sortBy } = req.query;

    const query = { user: req.user._id };

    // Filter by status (completed / pending)
    if (status === 'completed') {
      query.completed = true;
    } else if (status === 'pending') {
      query.completed = false;
    }

    // Filter by priority
    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      query.priority = priority.toLowerCase();
    }

    // Filter by search keyword in title or description
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Sort order
    let sortOptions = { createdAt: -1 }; // default newest first
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'dueDate') {
      sortOptions = { dueDate: 1 };
    } else if (sortBy === 'priority') {
      // Custom priority sort can be mapped if needed, or by title
      sortOptions = { priority: 1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: 1 };
    }

    const todos = await Todo.find(query).sort(sortOptions);

    res.json({
      success: true,
      count: todos.length,
      data: todos,
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching todos',
    });
  }
};

// @desc    Get single todo by ID
// @route   GET /api/todos/:id
// @access  Private
const getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or unauthorized access',
      });
    }

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching todo',
    });
  }
};

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a task title',
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      user: req.user._id,
    });

    // Record activity
    try {
      await Activity.create({
        user: req.user._id,
        action: 'CREATED',
        todoTitle: todo.title,
        todoId: todo._id,
        details: `Created task "${todo.title}" with ${todo.priority} priority`,
      });
    } catch (actErr) {
      console.warn('Failed to log activity:', actErr.message);
    }

    res.status(201).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating todo',
    });
  }
};

// @desc    Update an existing todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    let todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or unauthorized access',
      });
    }

    const wasCompleted = todo.completed;

    const { title, description, completed, priority, dueDate } = req.body;

    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
    if (completed !== undefined) todo.completed = Boolean(completed);
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) {
      todo.dueDate = dueDate ? new Date(dueDate) : null;
      todo.reminderSent = false; // Reset reminder so updated date triggers reminders
    }

    const updatedTodo = await todo.save();

    // Determine activity action
    let action = 'UPDATED';
    let details = `Updated task "${updatedTodo.title}"`;

    if (completed !== undefined && completed !== wasCompleted) {
      action = completed ? 'COMPLETED' : 'UNCOMPLETED';
      details = completed
        ? `Marked "${updatedTodo.title}" as completed`
        : `Reopened "${updatedTodo.title}"`;
    }

    // Record activity
    try {
      await Activity.create({
        user: req.user._id,
        action,
        todoTitle: updatedTodo.title,
        todoId: updatedTodo._id,
        details,
      });
    } catch (actErr) {
      console.warn('Failed to log activity:', actErr.message);
    }

    res.json({
      success: true,
      data: updatedTodo,
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating todo',
    });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or unauthorized access',
      });
    }

    const todoTitle = todo.title;
    await todo.deleteOne();

    // Record activity
    try {
      await Activity.create({
        user: req.user._id,
        action: 'DELETED',
        todoTitle,
        todoId: null,
        details: `Deleted task "${todoTitle}"`,
      });
    } catch (actErr) {
      console.warn('Failed to log activity:', actErr.message);
    }

    res.json({
      success: true,
      message: 'Todo removed successfully',
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting todo',
    });
  }
};

// @desc    Send on-demand email + push reminder for a task
// @route   POST /api/todos/:id/remind
// @access  Private
const sendManualReminder = async (req, res) => {
  try {
    const { sendTaskReminderEmail } = require('../services/emailService');

    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found or unauthorized access' });
    }

    // Fire email + push in parallel for maximum speed
    const [emailResult, pushSubs] = await Promise.all([
      sendTaskReminderEmail({
        to: req.user.email,
        name: req.user.name,
        taskTitle: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        priority: todo.priority,
      }),
      PushSubscription.find({ user: req.user._id }),
    ]);

    // Send push to all subscribed devices (non-blocking)
    const pushPromises = pushSubs.map(async (sub) => {
      const result = await sendPushNotification(sub.subscription, {
        title: `⏰ Reminder: ${todo.title}`,
        body: `Priority: ${todo.priority.toUpperCase()}${todo.dueDate ? ' • Due: ' + new Date(todo.dueDate).toLocaleDateString() : ''}`,
        url: '/',
        tag: `manual-reminder-${todo._id}`,
      });
      if (result === 'expired') await PushSubscription.deleteOne({ _id: sub._id });
    });
    await Promise.allSettled(pushPromises);

    todo.reminderSent = true;
    await todo.save();

    Activity.create({
      user: req.user._id,
      action: 'UPDATED',
      todoTitle: todo.title,
      todoId: todo._id,
      details: `Reminder sent — email to ${req.user.email}${pushSubs.length > 0 ? ` + push to ${pushSubs.length} device(s)` : ''}`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Reminder sent to ${req.user.email}${pushSubs.length > 0 ? ` + ${pushSubs.length} device(s)` : ''}`,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error sending reminder' });
  }
};

const MUTE_DURATIONS = {
  '10min':  10 * 60 * 1000,
  '30min':  30 * 60 * 1000,
  '1hour':   1 * 60 * 60 * 1000,
  '2hours':  2 * 60 * 60 * 1000,
  '4hours':  4 * 60 * 60 * 1000,
  '8hours':  8 * 60 * 60 * 1000,
  '1day':   24 * 60 * 60 * 1000,
};

// @desc    Mute or unmute notifications for a task
// @route   PATCH /api/todos/:id/mute
// @access  Private
const muteTask = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const { muteFor } = req.body; // null to unmute

    if (!muteFor) {
      todo.mutedUntil = null;
    } else {
      const ms = MUTE_DURATIONS[muteFor];
      if (!ms) return res.status(400).json({ success: false, message: 'Invalid mute duration' });
      todo.mutedUntil = new Date(Date.now() + ms);
    }

    await todo.save();

    try {
      await Activity.create({
        user: req.user._id,
        action: 'UPDATED',
        todoTitle: todo.title,
        todoId: todo._id,
        details: muteFor ? `Notifications muted for ${muteFor}` : 'Notifications unmuted',
      });
    } catch (_) {}

    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Mute task error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Shift due date forward or backward by N days
// @route   PATCH /api/todos/:id/shift-due
// @access  Private
const shiftDue = async (req, res) => {
  try {
    const { days } = req.body; // positive = postpone, negative = prepone
    if (!days || typeof days !== 'number') {
      return res.status(400).json({ success: false, message: 'Provide days as a number' });
    }

    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    if (!todo.dueDate) return res.status(400).json({ success: false, message: 'Task has no due date to shift' });

    const newDate = new Date(todo.dueDate);
    newDate.setDate(newDate.getDate() + days);
    todo.dueDate = newDate;
    todo.lastReminderSentAt = null; // reset so reminders fire for the new date
    todo.reminderSent = false;
    await todo.save();

    const action = days > 0 ? 'Postponed' : 'Preponed';
    const absDays = Math.abs(days);

    try {
      await Activity.create({
        user: req.user._id,
        action: 'UPDATED',
        todoTitle: todo.title,
        todoId: todo._id,
        details: `${action} "${todo.title}" by ${absDays} day${absDays !== 1 ? 's' : ''} → new due: ${newDate.toLocaleDateString()}`,
      });
    } catch (_) {}

    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Shift due error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  sendManualReminder,
  muteTask,
  shiftDue,
};
