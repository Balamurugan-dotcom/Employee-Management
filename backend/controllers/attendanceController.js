const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Setting = require('../models/Setting');

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateStr = (timeZone = 'Asia/Kolkata') => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// Haversine formula to calculate distance in meters between two lat/lng points
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Retrieve or initialize company authorized office location settings
const getOfficeLocationSettings = async () => {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create({
      companyName: 'TalentFlow Enterprise Global Inc.',
      officialEmail: 'contact@talentflow.internal',
      workHoursPerDay: 8,
      standardLeaveQuota: 20,
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      halfDayCutoffTime: '10:00', // Check-in after 10:00 AM is Half Day
      absentCutoffTime: '14:00', // Check-in at or after 2:00 PM is Full Day Absent
      timezone: 'Asia/Kolkata',
      officeLocation: {
        name: 'Main Office Headquarters',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 500,
        enforceLocation: true,
      },
      allowRemotePunch: false,
    });
  }
  return setting;
};

// Evaluate attendance status based on check-in time and configured cutoff thresholds:
// 1. Check-in on or before halfDayCutoff (10:00 AM) => 'Present'
// 2. Check-in after halfDayCutoff (10:00 AM) and before absentCutoff (2:00 PM) => 'Half Day'
// 3. Check-in at or after absentCutoff (2:00 PM / 14:00) => 'Absent'
const evaluateCheckInStatus = (
  checkInDate,
  halfDayCutoff = '10:00',
  absentCutoff = '14:00',
  timezone = 'Asia/Kolkata'
) => {
  let hour, minute;
  try {
    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(checkInDate);

    hour = parseInt(timeParts.find((p) => p.type === 'hour')?.value, 10);
    minute = parseInt(timeParts.find((p) => p.type === 'minute')?.value, 10);
  } catch (e) {
    hour = checkInDate.getHours();
    minute = checkInDate.getMinutes();
  }

  const [halfH = 10, halfM = 0] = (halfDayCutoff || '10:00').split(':').map(Number);
  const [absH = 14, absM = 0] = (absentCutoff || '14:00').split(':').map(Number);

  const checkInMins = hour * 60 + minute;
  const halfDayCutoffMins = halfH * 60 + halfM;
  const absentCutoffMins = absH * 60 + absM;

  const displayTime = checkInDate.toLocaleTimeString('en-US', {
    timeZone: timezone || 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (checkInMins >= absentCutoffMins) {
    return {
      status: 'Absent',
      notes: `Late Check-in at ${displayTime} (after ${absentCutoff}) — Marked Full Day Absent per company policy`,
      message: `Checked in at ${displayTime}. Due to check-in at or after 2:00 PM (${absentCutoff}), attendance is marked as Full Day Absent.`,
    };
  } else if (checkInMins > halfDayCutoffMins) {
    return {
      status: 'Half Day',
      notes: `Late Check-in at ${displayTime} (after ${halfDayCutoff}) — Marked Half Day per company policy`,
      message: `Checked in at ${displayTime}. Due to check-in after 10:00 AM (${halfDayCutoff}), attendance is marked as Half Day.`,
    };
  } else {
    return {
      status: 'Present',
      notes: `On-time Check-in at ${displayTime} — Marked Present`,
      message: `Checked in successfully on time at ${displayTime}. Attendance marked as Present.`,
    };
  }
};

// Verify employee's current coordinates against the authorized office location
const verifyEmployeeLocation = async (req) => {
  const setting = await getOfficeLocationSettings();
  const office = setting.officeLocation || {
    name: 'Main Office Headquarters',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 500,
    enforceLocation: true,
  };

  // If remote punch is allowed by policy or geofencing disabled
  if (setting.allowRemotePunch || office.enforceLocation === false) {
    return {
      allowed: true,
      distance: 0,
      office,
      isBypassed: true,
    };
  }

  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return {
      allowed: false,
      message: 'Location verification required: GPS coordinates must be provided to confirm you are at the authorized workplace.',
      office,
    };
  }

  const userLat = Number(latitude);
  const userLon = Number(longitude);
  if (isNaN(userLat) || isNaN(userLon)) {
    return {
      allowed: false,
      message: 'Invalid GPS coordinates received.',
      office,
    };
  }

  const distance = calculateDistanceMeters(userLat, userLon, office.latitude, office.longitude);
  const allowedRadius = office.radiusMeters || 500;

  if (distance > allowedRadius) {
    return {
      allowed: false,
      message: `Location Unauthorized: You are ${distance}m away from the authorized office location (${office.name}). Attendance actions are only allowed within ${allowedRadius}m.`,
      distance,
      allowedRadius,
      office,
    };
  }

  return {
    allowed: true,
    distance,
    coordinates: { latitude: userLat, longitude: userLon },
    office,
  };
};

// @desc    Employee Check-in
// @route   POST /api/attendance/checkin
// @access  Private (Employee, Manager, Admin)
const checkIn = async (req, res) => {
  try {
    const setting = await getOfficeLocationSettings();
    const today = getTodayDateStr(setting.timezone);

    // Resolve employee record
    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
      });
      if (!employee && req.user) {
        employee = await Employee.create({
          user: req.user._id,
          name: req.user.name || 'Staff Member',
          email: req.user.email,
          employeeId: req.user.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          department: req.user.department || (req.user.role === 'manager' ? 'Management' : 'Operations'),
          designation: req.user.role === 'manager' ? 'Team Manager' : 'Employee',
          role: req.user.role || 'employee',
        });
      }
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    const now = new Date();
    const photo = req.body.faceImage || '';

    // Evaluate check-in cutoff rules (10:00 AM Half Day, 2:00 PM Full Day Absent)
    const clientTz = req.body.timezone || setting.timezone || 'Asia/Kolkata';
    const evalResult = evaluateCheckInStatus(
      now,
      setting.halfDayCutoffTime || '10:00',
      setting.absentCutoffTime || '14:00',
      clientTz
    );

    const checkInNotes = req.body.notes
      ? `${req.body.notes} | ${evalResult.notes}`
      : evalResult.notes;

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        user: req.user._id,
        date: today,
        checkIn: now,
        status: evalResult.status,
        notes: checkInNotes,
        faceVerified: req.body.faceVerified ?? false,
        faceImage: photo,
        locationVerified: true,
        locationDistance: locationCheck.distance || 0,
        locationCoordinates: locationCheck.coordinates || undefined,
      });
    } else {
      attendance.checkIn = now;
      attendance.status = evalResult.status;
      if (req.body.faceVerified !== undefined) attendance.faceVerified = req.body.faceVerified;
      if (photo) attendance.faceImage = photo;
      attendance.notes = checkInNotes;
      attendance.locationVerified = true;
      attendance.locationDistance = locationCheck.distance || 0;
      if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;
      await attendance.save();
    }

    // Update Employee profile photo and last check-in photo so Admin Employee Profile displays it
    if (photo) {
      try {
        await Employee.findByIdAndUpdate(employee._id, {
          profileImage: photo,
          lastCheckInPhoto: photo,
          lastCheckInTime: now,
        });

        const targetUserId = employee.user || req.user?._id;
        if (targetUserId) {
          await User.findByIdAndUpdate(targetUserId, {
            avatar: photo,
          });
        }
      } catch (photoUpdateErr) {
        console.warn('Failed to update employee/user avatar with check-in photo:', photoUpdateErr);
      }
    }

    res.status(200).json({
      success: true,
      message: evalResult.message,
      status: evalResult.status,
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
    const setting = await getOfficeLocationSettings();
    const today = getTodayDateStr(setting.timezone);

    let employee = req.employee;
    if (!employee) {
      employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }, { employeeId: req.user.employeeId }],
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    const now = new Date();
    attendance.checkOut = now;
    attendance.locationVerified = true;
    if (locationCheck.distance !== undefined) attendance.locationDistance = locationCheck.distance;
    if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;

    // Calculate working hours
    const diffMs = now - new Date(attendance.checkIn);
    const diffHours = +(diffMs / (1000 * 60 * 60)).toFixed(2);
    attendance.workingHours = diffHours;

    // Preserve check-in penalty: If checked in after 2:00 PM (Absent) or after 10:00 AM (Half Day),
    // do NOT overwrite back to Present upon check-out
    if (attendance.status === 'Absent') {
      // Kept as Absent (late arrival after 2:00 PM)
    } else if (attendance.status === 'Half Day') {
      // Kept as Half Day (late arrival after 10:00 AM)
    } else if (diffHours < 4) {
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    attendance.breakIn = new Date();
    attendance.isOnBreak = true;
    attendance.locationVerified = true;
    if (locationCheck.distance !== undefined) attendance.locationDistance = locationCheck.distance;
    if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    attendance.breakEnd = new Date();
    attendance.isOnBreak = false;
    attendance.locationVerified = true;
    if (locationCheck.distance !== undefined) attendance.locationDistance = locationCheck.distance;
    if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    attendance.lunchIn = new Date();
    attendance.isOnLunch = true;
    attendance.locationVerified = true;
    if (locationCheck.distance !== undefined) attendance.locationDistance = locationCheck.distance;
    if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;
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

    // Verify authorized location
    const locationCheck = await verifyEmployeeLocation(req);
    if (!locationCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance,
        allowedRadius: locationCheck.allowedRadius,
        officeLocation: locationCheck.office,
      });
    }

    attendance.lunchEnd = new Date();
    attendance.isOnLunch = false;
    attendance.locationVerified = true;
    if (locationCheck.distance !== undefined) attendance.locationDistance = locationCheck.distance;
    if (locationCheck.coordinates) attendance.locationCoordinates = locationCheck.coordinates;
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

// @desc    Get authorized office location and geofence parameters
// @route   GET /api/attendance/office-location
// @access  Private
const getOfficeLocation = async (req, res) => {
  try {
    const setting = await getOfficeLocationSettings();
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.status(200).json({
      success: true,
      officeLocation: setting.officeLocation,
      allowRemotePunch: setting.allowRemotePunch,
      companyName: setting.companyName,
      officialEmail: setting.officialEmail,
      workHoursPerDay: setting.workHoursPerDay,
      standardLeaveQuota: setting.standardLeaveQuota,
      emailAlerts: setting.emailAlerts,
      twoFactorEnforced: setting.twoFactorEnforced,
      shiftStartTime: setting.shiftStartTime || '09:00',
      shiftEndTime: setting.shiftEndTime || '18:00',
      halfDayCutoffTime: setting.halfDayCutoffTime || '10:00',
      absentCutoffTime: setting.absentCutoffTime || '14:00',
      timezone: setting.timezone || 'Asia/Kolkata',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve office location.',
      error: error.message,
    });
  }
};

// @desc    Update authorized office location and geofence parameters (Admin only)
// @route   PUT /api/attendance/office-location
// @access  Private (Admin)
const updateOfficeLocation = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      radiusMeters,
      enforceLocation,
      allowRemotePunch,
      companyName,
      officialEmail,
      workHoursPerDay,
      standardLeaveQuota,
      emailAlerts,
      twoFactorEnforced,
      shiftStartTime,
      shiftEndTime,
      halfDayCutoffTime,
      absentCutoffTime,
      timezone,
    } = req.body;
    let setting = await getOfficeLocationSettings();

    if (!setting.officeLocation) {
      setting.officeLocation = {};
    }

    if (name) setting.officeLocation.name = name;
    if (latitude !== undefined) setting.officeLocation.latitude = Number(latitude);
    if (longitude !== undefined) setting.officeLocation.longitude = Number(longitude);
    if (radiusMeters !== undefined) setting.officeLocation.radiusMeters = Number(radiusMeters);
    if (enforceLocation !== undefined) setting.officeLocation.enforceLocation = Boolean(enforceLocation);
    if (allowRemotePunch !== undefined) setting.allowRemotePunch = Boolean(allowRemotePunch);

    if (companyName !== undefined) setting.companyName = companyName;
    if (officialEmail !== undefined) setting.officialEmail = officialEmail;
    if (workHoursPerDay !== undefined) setting.workHoursPerDay = Number(workHoursPerDay);
    if (standardLeaveQuota !== undefined) setting.standardLeaveQuota = Number(standardLeaveQuota);
    if (emailAlerts !== undefined) setting.emailAlerts = Boolean(emailAlerts);
    if (twoFactorEnforced !== undefined) setting.twoFactorEnforced = Boolean(twoFactorEnforced);
    if (shiftStartTime !== undefined) setting.shiftStartTime = shiftStartTime;
    if (shiftEndTime !== undefined) setting.shiftEndTime = shiftEndTime;
    if (halfDayCutoffTime !== undefined) setting.halfDayCutoffTime = halfDayCutoffTime;
    if (absentCutoffTime !== undefined) setting.absentCutoffTime = absentCutoffTime;
    if (timezone !== undefined) setting.timezone = timezone;

    setting.markModified('officeLocation');
    await setting.save();

    res.status(200).json({
      success: true,
      message: 'Settings and authorized office location updated successfully.',
      officeLocation: setting.officeLocation,
      allowRemotePunch: setting.allowRemotePunch,
      companyName: setting.companyName,
      officialEmail: setting.officialEmail,
      workHoursPerDay: setting.workHoursPerDay,
      standardLeaveQuota: setting.standardLeaveQuota,
      shiftStartTime: setting.shiftStartTime,
      shiftEndTime: setting.shiftEndTime,
      halfDayCutoffTime: setting.halfDayCutoffTime,
      absentCutoffTime: setting.absentCutoffTime,
      timezone: setting.timezone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update office location and settings.',
      error: error.message,
    });
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
  getOfficeLocation,
  updateOfficeLocation,
};
