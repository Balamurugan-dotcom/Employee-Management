const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employee, Manager)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required.',
      });
    }

    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No associated employee record found to apply for leave.',
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      user: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave application.',
      error: error.message,
    });
  }
};

// @desc    Get leaves (Admin sees all, Manager sees assigned team, Employee sees own)
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    // Role-based filtering
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!employee) {
        return res.status(200).json({ success: true, leaves: [] });
      }
      query.employee = employee._id;
    }

    let leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'name email employeeId department designation manager profileImage',
        populate: { path: 'manager', select: 'name email' },
      })
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    // If manager, filter to only team members
    if (req.user.role === 'manager') {
      leaves = leaves.filter(
        (l) => l.employee && l.employee.manager?._id?.toString() === req.user._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves.',
      error: error.message,
    });
  }
};

// @desc    Approve leave request
// @route   PUT /api/leaves/:id/approve
// @access  Private (Admin, Manager)
const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    // If manager, ensure this employee is assigned to them
    if (
      req.user.role === 'manager' &&
      leave.employee?.manager?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve leaves for your assigned team members.',
      });
    }

    leave.status = 'Approved';
    leave.approvedBy = req.user._id;
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request approved.',
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave.',
      error: error.message,
    });
  }
};

// @desc    Reject leave request
// @route   PUT /api/leaves/:id/reject
// @access  Private (Admin, Manager)
const rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (
      req.user.role === 'manager' &&
      leave.employee?.manager?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject leaves for your assigned team members.',
      });
    }

    leave.status = 'Rejected';
    leave.approvedBy = req.user._id;
    if (rejectionReason) leave.rejectionReason = rejectionReason;
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request rejected.',
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave.',
      error: error.message,
    });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  approveLeave,
  rejectLeave,
};
