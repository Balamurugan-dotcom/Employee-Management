const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getManagerDashboardStats,
  getEmployeeDashboardStats,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboardStats);
router.get('/manager', authorize('manager'), getManagerDashboardStats);
router.get('/employee', authorize('employee'), getEmployeeDashboardStats);

module.exports = router;
