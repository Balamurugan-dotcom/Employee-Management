const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
    },
    department: {
      type: String,
      default: 'General',
    },
    date: {
      type: String, // Format: YYYY-MM-DD (e.g., 2026-09-26)
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title or summary for the daily report.'],
      trim: true,
    },
    tasksCompleted: {
      type: [String],
      default: [],
    },
    tasksPending: {
      type: [String],
      default: [],
    },
    hoursWorked: {
      type: Number,
      default: 8,
      min: 0,
      max: 24,
    },
    blockers: {
      type: String,
      default: 'None',
      trim: true,
    },
    planForTomorrow: {
      type: String,
      default: '',
      trim: true,
    },
    additionalNotes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Draft', 'Reviewed'],
      default: 'Submitted',
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to search quickly by employee and date
dailyReportSchema.index({ employee: 1, date: -1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
