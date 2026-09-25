const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');

// @desc    Get all employees (Admin can see all, Manager can see their team or all depending on query)
// @route   GET /api/employees
// @access  Private (Admin, Manager)
const getEmployees = async (req, res) => {
  try {
    const { search, department, status, role } = req.query;

    let query = {};

    // Default to only 'employee' role records — managers are managed separately
    // Allow explicit role override only for admin (e.g. role=all)
    if (role && role !== 'All') {
      // e.g. role=manager passed explicitly
      const userIds = await User.find({ role }).select('_id');
      query.user = { $in: userIds.map((u) => u._id) };
    } else if (!role || role === 'All') {
      // By default exclude manager-role records from employee list
      const managerUserIds = await User.find({ role: { $in: ['manager', 'admin'] } }).select('_id');
      query.user = { $nin: managerUserIds.map((u) => u._id) };
    }

    // If search term provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    // If manager is requesting, restrict to only their team members
    if (req.user.role === 'manager') {
      query.manager = req.user._id;
    }

    const employees = await Employee.find(query)
      .populate('manager', 'name email employeeId')
      .populate('user', 'role status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
      error: error.message,
    });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('manager', 'name email employeeId')
      .populate('user', 'role status');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Role security check: employees can only view themselves
    if (
      req.user.role === 'employee' &&
      employee.user?.toString() !== req.user._id.toString() &&
      employee.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own employee details.',
      });
    }

    // Role security check: managers can only view members of their team or themselves
    if (
      req.user.role === 'manager' &&
      employee.manager?._id?.toString() !== req.user._id.toString() &&
      employee.user?.toString() !== req.user._id.toString() &&
      employee.email !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view details of your assigned team members.',
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee.',
      error: error.message,
    });
  }
};

// @desc    Create new employee & associated user account
// @route   POST /api/employees
// @access  Private (Admin)
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      employeeId,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      department,
      designation,
      manager,
      joiningDate,
      salary,
      profileImage,
      role = 'employee',
    } = req.body;

    if (!name || !email || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, department, and designation are required.',
      });
    }

    // 1. Verify and validate Employee ID uniqueness
    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required.',
      });
    }

    const trimmedEmpId = employeeId.trim();
    const existingEmp = await Employee.findOne({ employeeId: trimmedEmpId });
    const existingUserEmp = await User.findOne({ employeeId: trimmedEmpId });

    if (existingEmp || existingUserEmp) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${trimmedEmpId}' is already registered in the database. Please enter a different Employee ID.`,
      });
    }

    // 2. Verify Username uniqueness
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required.',
      });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: `Username '${username}' is already registered in the database. Please choose a different username.`,
      });
    }

    // 3. Verify Password requirement
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.',
      });
    }

    // 4. Check if email already in use
    const trimmedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `An account with email '${email}' is already registered in the system.`,
      });
    }

    // Find manager name if manager ObjectId provided
    let managerName = 'None';
    if (manager) {
      const mgr = await User.findById(manager);
      if (mgr) managerName = mgr.name;
    }

    // Create User record for login credentials
    const newUser = await User.create({
      name,
      email: trimmedEmail,
      username: trimmedUsername,
      password,
      role: role || (designation.toLowerCase().includes('manager') ? 'manager' : 'employee'),
      employeeId: trimmedEmpId,
      status: 'Active',
      avatar: profileImage || '',
    });

    // Create Employee profile
    const newEmployee = await Employee.create({
      employeeId: trimmedEmpId,
      username: trimmedUsername,
      user: newUser._id,
      name,
      email: trimmedEmail,
      phone: phone || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'Not Specified',
      address: address || '',
      department,
      designation,
      manager: manager || null,
      managerName,
      joiningDate: joiningDate || Date.now(),
      salary: salary || 50000,
      profileImage: profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      status: 'Active',
    });

    // Optionally link employee to department record
    await Department.findOneAndUpdate(
      { departmentName: department },
      { $addToSet: { employees: newEmployee._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      employee: newEmployee,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee.',
      error: error.message,
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin, Manager limited)
const updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Manager role authorization check
    if (req.user.role === 'manager' && employee.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only edit details for their assigned team members.',
      });
    }

    const updates = { ...req.body };

    // Update managerName if manager ID was updated
    if (updates.manager) {
      const mgr = await User.findById(updates.manager);
      if (mgr) updates.managerName = mgr.name;
    } else if (updates.manager === null || updates.manager === '') {
      updates.managerName = 'None';
      updates.manager = null;
    }

    employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('manager', 'name email employeeId');

    // Sync status, name, or password with User collection if updated
    if (employee.user) {
      const userUpdates = {};
      if (updates.status) userUpdates.status = updates.status;
      if (updates.name) userUpdates.name = updates.name;
      if (updates.profileImage) userUpdates.avatar = updates.profileImage;
      if (updates.password && updates.password.trim().length >= 6) {
        const salt = await bcrypt.genSalt(10);
        userUpdates.password = await bcrypt.hash(updates.password.trim(), salt);
      }
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(employee.user, userUpdates);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee.',
      error: error.message,
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('user', 'role');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Prevent deleting admin accounts via this endpoint
    if (employee.user && employee.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deleted through this endpoint.',
      });
    }

    // Remove user account if linked
    if (employee.user) {
      await User.findByIdAndDelete(employee.user._id);
    }

    // Remove from department
    await Department.updateMany(
      { employees: employee._id },
      { $pull: { employees: employee._id } }
    );

    await Employee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee.',
      error: error.message,
    });
  }
};

// @desc    Get list of managers for dropdown assignment and management list
// @route   GET /api/employees/managers
// @access  Private (Admin)
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager', status: 'Active' })
      .select('name email employeeId role avatar')
      .sort({ name: 1 });

    const populated = await Promise.all(
      managers.map(async (m) => {
        const emp = await Employee.findOne({
          $or: [{ user: m._id }, { employeeId: m.employeeId }],
        }).select('department designation phone salary joiningDate profileImage');
        const teamCount = await Employee.countDocuments({ manager: m._id });
        return {
          _id: m._id,
          name: m.name,
          email: m.email,
          employeeId: m.employeeId,
          role: m.role,
          avatar: m.avatar,
          department: emp?.department || 'General Management',
          designation: emp?.designation || 'Team Manager',
          phone: emp?.phone || '',
          profileImage: emp?.profileImage || m.avatar || '',
          salary: emp?.salary || 0,
          teamCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      managers: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers.',
      error: error.message,
    });
  }
};

// @desc    Get manager's team members
// @route   GET /api/employees/my-team
// @access  Private (Manager)
const getMyTeam = async (req, res) => {
  try {
    const team = await Employee.find({ manager: req.user._id })
      .populate('user', 'status role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: team.length,
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members.',
      error: error.message,
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getManagers,
  getMyTeam,
};
