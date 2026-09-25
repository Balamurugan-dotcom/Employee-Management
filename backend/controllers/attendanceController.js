const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Employee Check-in
// @route   POST /api/attendance/checkin
// @access  Private (Employee, Manager, Admin)
const checkIn = async (req, res) => {
  try {
    const today = getTodayDateStr();

    // Resolve employee record
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No associated employee profile found for your account.',
      });
    }

    let attendance = await Attendance.findOne({ employee: employee._id, date: today });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today.',
        attendance,
      });
    }

    const now = new Date();

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        user: req.user._id,
        date: today,
        checkIn: now,
        status: 'Present',
        notes: req.body.notes || 'Normal check-in',
      });
    } else {
      attendance.checkIn = now;
      attendance.status = 'Present';
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully.',
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Check-in failed.',
      error: error.message,
    });
  }
};

// @desc    Employee Check-out
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
  try {
    const today = getTodayDateStr();

    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.',
      });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have not checked in today yet.',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today.',
        attendance,
      });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate working hours
    const diffMs = now - new Date(attendance.checkIn);
    const diffHours = +(diffMs / (1000 * 60 * 60)).toFixed(2);
    attendance.workingHours = diffHours;

    if (diffHours < 4) {
      attendance.status = 'Half Day';
    } else {
      attendance.status = 'Present';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully.',
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Check-out failed.',
      error: error.message,
    });
  }
};

// @desc    Get attendance status for today for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res) => {
  try {
    const today = getTodayDateStr();
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
    }

    if (!employee) {
      return res.status(200).json({
        success: true,
        attendance: null,
      });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });

    res.status(200).json({
      success: true,
      attendance: attendance || null,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve today status.',
      error: error.message,
    });
  }
};

// @desc    Get attendance history of an employee
// @route   GET /api/attendance/:employeeId
// @access  Private
const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find employee by either MongoDB _id or employeeId string
    const employee = await Employee.findOne({
      $or: [{ _id: employeeId.match(/^[0-9a-fA-F]{24}$/) ? employeeId : null }, { employeeId }],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Role check: employee can only view their own
    if (
      req.user.role === 'employee' &&
      employee.user?.toString() !== req.user._id.toString() &&
      employee.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own attendance history.',
      });
    }

    const { month } = req.query; // e.g. '2026-09' or 'all'
    let query = { employee: employee._id };
    if (month && month.toLowerCase() !== 'all') {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    const allRecords = await Attendance.find({ employee: employee._id }).select('date');
    const availableMonths = [
      ...new Set(allRecords.map((r) => r.date.substring(0, 7))),
    ].sort().reverse();

    const totalPresent = records.filter((r) => r.status === 'Present').length;
    const totalHalfDay = records.filter((r) => r.status === 'Half Day').length;
    const totalAbsent = records.filter((r) => r.status === 'Absent').length;
    const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);

    res.status(200).json({
      success: true,
      employee,
      records,
      availableMonths,
      stats: {
        totalPresent,
        totalHalfDay,
        totalAbsent,
        totalHours: +totalHours.toFixed(2),
        totalLogs: records.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history.',
      error: error.message,
    });
  }
};

// @desc    Get all attendance (Admin & Manager overview)
// @route   GET /api/attendance
// @access  Private (Admin, Manager)
const getAllAttendance = async (req, res) => {
  try {
    const { date, department, managerId } = req.query;
    const queryDate = date || getTodayDateStr();

    let query = { date: queryDate };

    let records = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name email employeeId department designation manager profileImage',
        populate: { path: 'manager', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    // Filter by department if requested
    if (department && department !== 'All') {
      records = records.filter((r) => r.employee && r.employee.department === department);
    }

    // If manager, filter strictly to their own team members; if admin provided managerId, filter to that manager
    if (req.user.role === 'manager') {
      records = records.filter((r) => r.employee && r.employee.manager?._id?.toString() === req.user._id.toString());
    } else if (managerId) {
      records = records.filter((r) => r.employee && r.employee.manager?._id?.toString() === managerId);
    }

    res.status(200).json({
      success: true,
      date: queryDate,
      count: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: error.message,
    });
  }
};

// @desc    Break In
// @route   POST /api/attendance/break-in
// @access  Private
const breakIn = async (req, res) => {
  try {
    const today = getTodayDateStr();
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'You must check in first before taking a break.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Shift already completed for today.' });
    }

    if (attendance.isOnBreak) {
      return res.status(400).json({ success: false, message: 'You are already on break.' });
    }

    if (attendance.isOnLunch) {
      return res.status(400).json({ success: false, message: 'Please end your lunch before starting another break.' });
    }

    attendance.breakIn = new Date();
    attendance.isOnBreak = true;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Break In recorded successfully.',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record Break In.', error: error.message });
  }
};

// @desc    Break End
// @route   POST /api/attendance/break-end
// @access  Private
const breakEnd = async (req, res) => {
  try {
    const today = getTodayDateStr();
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'No active check-in record found.' });
    }

    attendance.breakEnd = new Date();
    attendance.isOnBreak = false;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Break End recorded. Welcome back!',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record Break End.', error: error.message });
  }
};

// @desc    Lunch In
// @route   POST /api/attendance/lunch-in
// @access  Private
const lunchIn = async (req, res) => {
  try {
    const today = getTodayDateStr();
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'You must check in first before starting lunch.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Shift already completed for today.' });
    }

    if (attendance.isOnLunch) {
      return res.status(400).json({ success: false, message: 'You are already on lunch break.' });
    }

    if (attendance.isOnBreak) {
      attendance.isOnBreak = false;
      attendance.breakEnd = new Date();
    }

    attendance.lunchIn = new Date();
    attendance.isOnLunch = true;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Lunch In recorded successfully. Enjoy your meal!',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record Lunch In.', error: error.message });
  }
};

// @desc    Lunch End
// @route   POST /api/attendance/lunch-end
// @access  Private
const lunchEnd = async (req, res) => {
  try {
    const today = getTodayDateStr();
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'No active check-in record found.' });
    }

    attendance.lunchEnd = new Date();
    attendance.isOnLunch = false;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Lunch End recorded. Welcome back!',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record Lunch End.', error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  breakIn,
  breakEnd,
  lunchIn,
  lunchEnd,
  getTodayStatus,
  getEmployeeAttendance,
  getAllAttendance,
};
