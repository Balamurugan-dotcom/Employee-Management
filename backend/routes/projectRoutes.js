const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager'), createProject);

router
  .route('/:id')
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin'), deleteProject);

module.exports = router;
