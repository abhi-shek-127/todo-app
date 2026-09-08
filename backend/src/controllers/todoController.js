const Todo = require('../models/Todo');
const Activity = require('../models/Activity');

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
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;

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

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
