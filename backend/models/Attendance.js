const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD for easy lookup
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    breakIn: {
      type: Date,
      default: null,
    },
    breakEnd: {
      type: Date,
      default: null,
    },
    isOnBreak: {
      type: Boolean,
      default: false,
    },
    lunchIn: {
      type: Date,
      default: null,
    },
    lunchEnd: {
      type: Date,
      default: null,
    },
    isOnLunch: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'Present',
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate attendance entries per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
