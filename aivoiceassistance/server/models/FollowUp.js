const mongoose = require('mongoose');

const FOLLOWUP_STATUSES = [
  'SCHEDULED',
  'READY',
  'CALLING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REQUIRES_HUMAN'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const followUpSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Follow-up reason is required'],
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required']
    },
    status: {
      type: String,
      enum: FOLLOWUP_STATUSES,
      default: 'SCHEDULED'
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'MEDIUM'
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    lastAttemptAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    outcome: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FollowUp', followUpSchema);
module.exports.FOLLOWUP_STATUSES = FOLLOWUP_STATUSES;
module.exports.PRIORITIES = PRIORITIES;
