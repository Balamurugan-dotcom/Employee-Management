const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getManagers,
  getMyTeam,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/managers', authorize('admin'), getManagers);
router.get('/my-team', authorize('manager', 'admin'), getMyTeam);

router
  .route('/')
  .get(authorize('admin', 'manager'), getEmployees)
  .post(authorize('admin'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(authorize('admin', 'manager'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

module.exports = router;
