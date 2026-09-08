const express = require('express');
const router = express.Router();
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
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

module.exports = router;
