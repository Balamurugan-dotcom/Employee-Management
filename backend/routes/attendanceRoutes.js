const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  breakIn,
  breakEnd,
  lunchIn,
  lunchEnd,
  getTodayStatus,
  getEmployeeAttendance,
  getAllAttendance,
  getOfficeLocation,
  updateOfficeLocation,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/office-location', getOfficeLocation);
router.put('/office-location', authorize('admin'), updateOfficeLocation);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.post('/break-in', breakIn);
router.post('/break-end', breakEnd);
router.post('/lunch-in', lunchIn);
router.post('/lunch-end', lunchEnd);
router.get('/today', getTodayStatus);
router.get('/', authorize('admin', 'manager'), getAllAttendance);
router.get('/:employeeId', getEmployeeAttendance);

module.exports = router;
