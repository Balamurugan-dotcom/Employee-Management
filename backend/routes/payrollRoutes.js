const express = require('express');
const router = express.Router();
const { getPayrolls, createPayroll } = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getPayrolls)
  .post(authorize('admin'), createPayroll);

module.exports = router;
