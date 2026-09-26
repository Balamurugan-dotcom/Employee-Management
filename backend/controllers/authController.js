const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailService');

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

    // Find user by email, username, employeeId, or phone
    let user = await User.findOne({
      $or: [
        { email: trimmed.toLowerCase() },
        { username: trimmed.toLowerCase() },
        { employeeId: trimmed.toUpperCase() },
        { employeeId: trimmed },
        { phone: trimmed },
      ],
    }).select('+password');

    if (!user) {
      const emp = await Employee.findOne({ phone: trimmed });
      if (emp && emp.user) {
        user = await User.findById(emp.user).select('+password');
      }
    }

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

    if (phone !== undefined) {
      req.user.phone = phone;
      await req.user.save();
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

// @desc    Send OTP to phone number with Employee ID verification
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { identifier, employeeId, phone, email } = req.body;

    const idInput = (employeeId || identifier || email || '').trim();
    const phoneInput = (phone || '').trim();

    if (!idInput && !phoneInput) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Employee ID and registered phone number.',
      });
    }

    let user = null;
    let employee = null;

    // 1. If Employee ID / Email was provided, lookup the user/employee first
    if (idInput) {
      user = await User.findOne({
        $or: [
          { employeeId: idInput.toUpperCase() },
          { employeeId: idInput },
          { email: idInput.toLowerCase() },
          { username: idInput.toLowerCase() },
        ],
      });

      if (!user) {
        employee = await Employee.findOne({
          $or: [
            { employeeId: idInput.toUpperCase() },
            { employeeId: idInput },
            { email: idInput.toLowerCase() },
            { username: idInput.toLowerCase() },
          ],
        });
        if (employee) {
          if (employee.user) {
            user = await User.findById(employee.user);
          } else {
            user = await User.findOne({
              $or: [{ email: employee.email }, { employeeId: employee.employeeId }],
            });
          }
        }
      } else {
        employee = await Employee.findOne({
          $or: [{ user: user._id }, { email: user.email }, { employeeId: user.employeeId }],
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          isRegistered: false,
          message: `No employee profile found with ID or Email "${idInput}".`,
        });
      }
    }

    // 2. If no Employee ID was provided, search directly by phone number
    if (!user && phoneInput) {
      const digitsOnly = phoneInput.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: phoneInput },
          ...(digitsOnly.length >= 7 ? [{ phone: { $regex: digitsOnly.slice(-10), $options: 'i' } }] : []),
        ],
      });

      if (!user) {
        employee = await Employee.findOne({
          $or: [
            { phone: phoneInput },
            ...(digitsOnly.length >= 7 ? [{ phone: { $regex: digitsOnly.slice(-10), $options: 'i' } }] : []),
          ],
        });
        if (employee && employee.user) {
          user = await User.findById(employee.user);
        }
      } else {
        employee = await Employee.findOne({
          $or: [{ user: user._id }, { email: user.email }, { employeeId: user.employeeId }],
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          isRegistered: false,
          message: `The phone number "${phoneInput}" is not registered in our profile system. Please contact your HR administrator.`,
        });
      }
    }

    // 3. If phone is provided, verify that it matches the found profile
    if (phoneInput) {
      const candidatePhones = [employee?.phone, user?.phone].filter(Boolean).map((p) => p.trim());
      if (candidatePhones.length > 0) {
        const enteredDigits = phoneInput.replace(/\D/g, '');
        const isMatch = candidatePhones.some((regPhone) => {
          if (phoneInput === regPhone) return true;
          const regDigits = regPhone.replace(/\D/g, '');
          if (enteredDigits.length >= 7 && regDigits.includes(enteredDigits.slice(-10))) return true;
          if (regDigits.length >= 7 && enteredDigits.includes(regDigits.slice(-10))) return true;
          return false;
        });

        if (!isMatch) {
          return res.status(400).json({
            success: false,
            isRegistered: false,
            message: `The entered phone number does not match the registered phone number for "${user.name}" (${user.employeeId || idInput}).`,
          });
        }
      }
    }

    // 4. Check if profile is active
    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'This account is currently marked as Inactive. Please contact your administrator.',
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any previous OTPs for this user
    await Otp.deleteMany({ userId: user._id });

    // Store new OTP
    const savedPhone = phoneInput || user.phone || '';
    await Otp.create({
      userId: user._id,
      phone: savedPhone,
      email: user.email,
      otp,
    });

    // Send real OTP email to user's registered inbox
    await sendOtpEmail(user.email, user.name, otp);

    const displayTarget = savedPhone.length > 4
      ? `****${savedPhone.slice(-4)}`
      : savedPhone || user.email;

    return res.status(200).json({
      success: true,
      message: `Verified profile: ${user.name}. OTP sent to ${displayTarget}.`,
      userName: user.name,
      phone: savedPhone,
      email: user.email,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the 6-digit OTP code.',
      });
    }

    const trimmedOtp = otp.toString().trim();
    const trimmedPhone = phone ? phone.trim() : '';
    const trimmedEmail = email ? email.toLowerCase().trim() : '';

    let otpRecord = null;

    if (trimmedEmail) {
      otpRecord = await Otp.findOne({ email: trimmedEmail, otp: trimmedOtp, verified: false }).sort({ createdAt: -1 });
    }

    if (!otpRecord && trimmedPhone) {
      otpRecord = await Otp.findOne({ phone: trimmedPhone, otp: trimmedOtp, verified: false }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      // Fallback: match by OTP directly if active
      otpRecord = await Otp.findOne({ otp: trimmedOtp, verified: false }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please check the code or request a new one.',
      });
    }

    // Generate secure temporary reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    otpRecord.verified = true;
    otpRecord.resetToken = resetToken;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP.',
    });
  }
};

// @desc    Reset Password with verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Reset session expired. Please verify OTP again.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const otpRecord = await Otp.findOne({ resetToken, verified: true });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset session. Please request a new OTP.',
      });
    }

    const user = await User.findById(otpRecord.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    await user.save();

    // Clean up OTP records
    await Otp.deleteMany({ userId: user._id });

    console.log(`🔒 [AUTH] Password reset successfully for: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      email: user.email,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
    });
  }
};

// Backwards-compatible alias for existing frontend calls
const forgotPassword = sendOtp;

module.exports = {
  login,
  getProfile,
  updateProfile,
  logout,
  sendOtp,
  verifyOtp,
  resetPassword,
  forgotPassword,
};
