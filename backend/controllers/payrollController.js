const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Get payroll records
// @route   GET /api/payroll
// @access  Private
const getPayrolls = async (req, res) => {
  try {
    let query = {};

    // Admin can view all payroll records; employees and managers view only their own
    if (req.user.role !== 'admin') {
      const employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!employee) {
        return res.status(200).json({ success: true, payrolls: [] });
      }
      query.employee = employee._id;
    }

    const payrolls = await Payroll.find(query)
      .populate('employee', 'name email employeeId department designation salary profileImage')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records.',
      error: error.message,
    });
  }
};

// @desc    Create / generate payroll record
// @route   POST /api/payroll
// @access  Private (Admin)
const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, basicSalary, allowances = 0, deductions = 0, paymentStatus = 'Paid' } = req.body;

    const netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);

    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      basicSalary: Number(basicSalary),
      allowances: Number(allowances),
      deductions: Number(deductions),
      netSalary,
      paymentStatus,
    });

    const populated = await Payroll.findById(payroll._id).populate('employee');

    res.status(201).json({
      success: true,
      message: 'Payroll generated successfully.',
      payroll: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll record.',
      error: error.message,
    });
  }
};

module.exports = {
  getPayrolls,
  createPayroll,
};
