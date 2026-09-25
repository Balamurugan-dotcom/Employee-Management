const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('admin', 'manager'), createTask)
  .get(getTasks);

router
  .route('/:id')
  .put(updateTask)
  .delete(authorize('admin', 'manager'), deleteTask);

module.exports = router;
