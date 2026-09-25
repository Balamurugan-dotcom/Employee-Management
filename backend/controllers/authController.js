const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      employeeId: user.employeeId,
      name: user.name,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_ems_2026_secure',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Login user (Email or Employee ID)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or employee ID and password.',
      });
    }

    const trimmed = identifier.trim();

    // Find user by email, username, or employeeId
    const user = await User.findOne({
      $or: [
        { email: trimmed.toLowerCase() },
        { username: trimmed.toLowerCase() },
        { employeeId: trimmed.toUpperCase() },
        { employeeId: trimmed },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    let isMatch = await user.matchPassword(password);
    if (!isMatch && typeof password === 'string' && password.trim() !== password) {
      isMatch = await user.matchPassword(password.trim());
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an Administrator.',
      });
    }

    // Fetch associated employee record if any
    const employee = await Employee.findOne({
      $or: [{ user: user._id }, { email: user.email }, { employeeId: user.employeeId }],
    });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        status: user.status,
        avatar: user.avatar || employee?.profileImage || '',
        employeeRecordId: employee?._id || null,
        department: employee?.department || '',
        designation: employee?.designation || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user & employee profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const employee = await Employee.findOne({
      $or: [{ user: user._id }, { email: user.email }, { employeeId: user.employeeId }],
    }).populate('manager', 'name email employeeId');

    res.status(200).json({
      success: true,
      user,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message,
    });
  }
};

// @desc    Update employee permitted profile information
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { phone, address, gender, profileImage } = req.body;

    const employee = await Employee.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
    });

    if (employee) {
      if (phone !== undefined) employee.phone = phone;
      if (address !== undefined) employee.address = address;
      if (gender !== undefined) employee.gender = gender;
      if (profileImage !== undefined) employee.profileImage = profileImage;
      await employee.save();
    }

    if (profileImage !== undefined) {
      req.user.avatar = profileImage;
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

// @desc    Logout user / clear token on client
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// @desc    Forgot Password simulation
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account registered with this email address.' });
  }

  // Simulated password reset instructions sent
  res.status(200).json({
    success: true,
    message: `Password reset instructions have been sent to ${email}. Check your inbox.`,
  });
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
};
