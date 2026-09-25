const Department = require('../models/Department');
const Employee = require('../models/Employee');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'name email employeeId')
      .populate('employees', 'name email employeeId designation');

    // Also enrich with actual count of employees in that department
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const empCount = await Employee.countDocuments({ department: dept.departmentName });
        return {
          ...dept.toObject(),
          employeeCount: empCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      departments: enriched,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments.',
      error: error.message,
    });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentCode, manager, description } = req.body;

    if (!departmentName || !departmentCode) {
      return res.status(400).json({
        success: false,
        message: 'Department name and department code are required.',
      });
    }

    const exists = await Department.findOne({
      $or: [{ departmentName }, { departmentCode: departmentCode.toUpperCase() }],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Department name or code already exists.',
      });
    }

    const dept = await Department.create({
      departmentName,
      departmentCode: departmentCode.toUpperCase(),
      manager: manager || null,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: dept,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department.',
      error: error.message,
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Department updated.',
      department: dept,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update department.', error: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    res.status(200).json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete department.', error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
