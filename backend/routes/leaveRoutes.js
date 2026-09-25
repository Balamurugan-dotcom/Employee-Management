const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  approveLeave,
  rejectLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .post(applyLeave)
  .get(getLeaves);

router.put('/:id/approve', authorize('admin', 'manager'), approveLeave);
router.put('/:id/reject', authorize('admin', 'manager'), rejectLeave);

module.exports = router;
