const express = require('express');
const router = express.Router();
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  sendManualReminder,
  muteTask,
  shiftDue,
} = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');

// All todo routes require authentication
router.use(protect);

router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .get(getTodoById)
  .put(updateTodo)
  .delete(deleteTodo);

// Send reminder email on demand
router.post('/:id/remind', sendManualReminder);

// Mute / unmute notifications for a task
router.patch('/:id/mute', muteTask);

// Shift due date forward (postpone) or backward (prepone)
router.patch('/:id/shift-due', shiftDue);

module.exports = router;
