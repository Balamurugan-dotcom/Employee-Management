const DailyReport = require('../models/DailyReport');
const Employee = require('../models/Employee');

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to resolve employee record for current user
const resolveEmployee = async (req) => {
  let employee = req.employee;
  if (!employee) {
    employee = await Employee.findOne({
      $or: [
        { user: req.user._id },
        { email: req.user.email },
        { employeeId: req.user.employeeId },
      ],
    });
  }
  return employee;
};

// @desc    Get employee's reports (with optional month/date filter)
// @route   GET /api/reports/my-reports
// @access  Private (Employee)
const getMyReports = async (req, res) => {
  try {
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile associated with this account.',
      });
    }

    const { month, date } = req.query;
    const query = { employee: employee._id };

    if (date) {
      query.date = date;
    } else if (month) {
      // e.g., month = "2026-09"
      query.date = { $regex: `^${month}` };
    }

    const reports = await DailyReport.find(query).sort({ date: -1, createdAt: -1 });

    const todayStr = getTodayDateStr();
    const todayReport = reports.find((r) => r.date === todayStr) || null;

    res.status(200).json({
      success: true,
      count: reports.length,
      todayStr,
      hasSubmittedToday: Boolean(todayReport),
      todayReport,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily reports.',
      error: error.message,
    });
  }
};

// @desc    Get today's report for the logged in employee
// @route   GET /api/reports/today
// @access  Private (Employee)
const getTodayReport = async (req, res) => {
  try {
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile associated with this account.',
      });
    }

    const todayStr = getTodayDateStr();
    const report = await DailyReport.findOne({
      employee: employee._id,
      date: todayStr,
    });

    res.status(200).json({
      success: true,
      todayStr,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve today's report.",
      error: error.message,
    });
  }
};

// @desc    Create or update a daily report entity
// @route   POST /api/reports
// @access  Private (Employee)
const createOrUpdateReport = async (req, res) => {
  try {
    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No associated employee record found to submit daily report.',
      });
    }

    const {
      date,
      title,
      tasksCompleted,
      tasksPending,
      hoursWorked,
      blockers,
      planForTomorrow,
      additionalNotes,
      status,
    } = req.body;

    const reportDate = date ? String(date).trim() : getTodayDateStr();

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title or work summary for the daily report.',
      });
    }

    // Process tasks lists if provided as string or array
    const parseTasks = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') {
        return val
          .split('\n')
          .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter(Boolean);
      }
      return [];
    };

    const tasksCompletedArr = parseTasks(tasksCompleted);
    const tasksPendingArr = parseTasks(tasksPending);

    // Check if report already exists for this employee on this date
    let report = await DailyReport.findOne({
      employee: employee._id,
      date: reportDate,
    });

    if (report) {
      // Update existing entity
      report.title = title.trim();
      report.tasksCompleted = tasksCompletedArr;
      report.tasksPending = tasksPendingArr;
      if (hoursWorked !== undefined) report.hoursWorked = Number(hoursWorked) || 8;
      if (blockers !== undefined) report.blockers = String(blockers).trim() || 'None';
      if (planForTomorrow !== undefined) report.planForTomorrow = String(planForTomorrow).trim();
      if (additionalNotes !== undefined) report.additionalNotes = String(additionalNotes).trim();
      if (status) report.status = status;

      await report.save();

      return res.status(200).json({
        success: true,
        message: `Daily report for ${reportDate} updated successfully.`,
        report,
      });
    }

    // Create new entity
    report = await DailyReport.create({
      employee: employee._id,
      user: req.user._id,
      employeeName: employee.name || req.user.name,
      employeeId: employee.employeeId || req.user.employeeId || 'EMP',
      department: employee.department || 'General',
      date: reportDate,
      title: title.trim(),
      tasksCompleted: tasksCompletedArr,
      tasksPending: tasksPendingArr,
      hoursWorked: hoursWorked !== undefined ? Number(hoursWorked) || 8 : 8,
      blockers: blockers !== undefined ? String(blockers).trim() || 'None' : 'None',
      planForTomorrow: planForTomorrow ? String(planForTomorrow).trim() : '',
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : '',
      status: status || 'Submitted',
    });

    res.status(201).json({
      success: true,
      message: `Daily report for ${reportDate} created successfully.`,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save daily report.',
      error: error.message,
    });
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate('employee', 'name employeeId department profileImage')
      .populate('user', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Daily report not found.',
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report details.',
      error: error.message,
    });
  }
};

// @desc    Update a daily report by ID
// @route   PUT /api/reports/:id
// @access  Private (Employee, Manager, Admin)
const updateReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Daily report not found.',
      });
    }

    // Check ownership if not admin/manager
    if (req.user.role === 'employee' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this report.',
      });
    }

    const {
      title,
      tasksCompleted,
      tasksPending,
      hoursWorked,
      blockers,
      planForTomorrow,
      additionalNotes,
      status,
      feedback,
    } = req.body;

    if (title) report.title = title.trim();
    if (tasksCompleted !== undefined) {
      report.tasksCompleted = Array.isArray(tasksCompleted)
        ? tasksCompleted
        : String(tasksCompleted)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (tasksPending !== undefined) {
      report.tasksPending = Array.isArray(tasksPending)
        ? tasksPending
        : String(tasksPending)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (hoursWorked !== undefined) report.hoursWorked = Number(hoursWorked) || 8;
    if (blockers !== undefined) report.blockers = String(blockers).trim() || 'None';
    if (planForTomorrow !== undefined) report.planForTomorrow = String(planForTomorrow).trim();
    if (additionalNotes !== undefined) report.additionalNotes = String(additionalNotes).trim();
    if (status) report.status = status;
    if (feedback !== undefined) report.feedback = String(feedback).trim();

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update report.',
      error: error.message,
    });
  }
};

// @desc    Delete a daily report
// @route   DELETE /api/reports/:id
// @access  Private (Employee, Admin)
const deleteReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Daily report not found.',
      });
    }

    if (req.user.role === 'employee' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report.',
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Daily report removed successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete report.',
      error: error.message,
    });
  }
};

// @desc    Get all daily reports (Admin & Manager)
// @route   GET /api/reports
// @access  Private (Admin, Manager)
const getAllReports = async (req, res) => {
  try {
    const { date, department, employeeId } = req.query;
    const query = {};

    if (date) query.date = date;
    if (department) query.department = department;
    if (employeeId) query.employeeId = employeeId;

    const reports = await DailyReport.find(query)
      .populate('employee', 'name employeeId department profileImage')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all reports.',
      error: error.message,
    });
  }
};

module.exports = {
  getMyReports,
  getTodayReport,
  createOrUpdateReport,
  getReportById,
  updateReport,
  deleteReport,
  getAllReports,
};
