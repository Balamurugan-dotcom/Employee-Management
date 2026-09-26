const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'TalentFlow Enterprise Global Inc.',
    },
    officialEmail: {
      type: String,
      default: 'contact@talentflow.internal',
    },
    workHoursPerDay: {
      type: Number,
      default: 8,
    },
    standardLeaveQuota: {
      type: Number,
      default: 20,
    },
    shiftStartTime: {
      type: String,
      default: '09:00',
    },
    shiftEndTime: {
      type: String,
      default: '18:00',
    },
    halfDayCutoffTime: {
      type: String,
      default: '10:00', // Check-in after 10:00 AM is Half Day
    },
    absentCutoffTime: {
      type: String,
      default: '14:00', // Check-in at or after 2:00 PM (14:00) is Full Day Absent
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    officeLocation: {
      name: {
        type: String,
        default: 'Main Office Headquarters',
      },
      latitude: {
        type: Number,
        default: 12.9716, // Bangalore Tech Park coordinates (configurable)
      },
      longitude: {
        type: Number,
        default: 77.5946,
      },
      radiusMeters: {
        type: Number,
        default: 500, // 500 meters authorized geofence
      },
      enforceLocation: {
        type: Boolean,
        default: true,
      },
    },
    allowRemotePunch: {
      type: Boolean,
      default: false,
    },
    emailAlerts: {
      type: Boolean,
      default: true,
    },
    twoFactorEnforced: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
