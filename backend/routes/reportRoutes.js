const express = require('express');
const router = express.Router();
const {
  getMyReports,
  getTodayReport,
  createOrUpdateReport,
  getReportById,
  updateReport,
  deleteReport,
  getAllReports,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/my-reports', getMyReports);
router.get('/today', getTodayReport);
router.get('/', authorize('admin', 'manager'), getAllReports);

router.post('/', createOrUpdateReport);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;
