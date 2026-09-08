const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATED', 'COMPLETED', 'UNCOMPLETED', 'UPDATED', 'DELETED'],
    },
    todoTitle: {
      type: String,
      required: true,
    },
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', activitySchema);
