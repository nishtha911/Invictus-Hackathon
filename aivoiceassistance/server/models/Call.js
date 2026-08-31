const mongoose = require('mongoose');

const CALL_STATUSES = [
  'INITIATED',
  'RINGING',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_ANSWER',
  'BUSY',
  'FAILED',
  'CANCELLED',
  'TRANSFERRED'
];

const CUSTOMER_INTENTS = [
  'INTERESTED',
  'NOT_INTERESTED',
  'NEEDS_TIME',
  'CALLBACK_REQUESTED',
  'READY_TO_APPLY',
  'APPLICATION_IN_PROGRESS',
  'UNKNOWN'
];

const SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

const callSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    followUpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FollowUp'
    },
    providerCallId: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    direction: {
      type: String,
      enum: ['OUTBOUND', 'INBOUND'],
      default: 'OUTBOUND'
    },
    status: {
      type: String,
      enum: CALL_STATUSES,
      default: 'INITIATED'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number, // duration in seconds
      default: 0
    },
    transcript: [
      {
        role: { type: String, enum: ['assistant', 'user', 'system'] },
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    recordingUrl: {
      type: String,
      default: ''
    },
    summary: {
      type: String,
      default: ''
    },
    outcome: {
      type: String,
      default: ''
    },
    customerIntent: {
      type: String,
      enum: CUSTOMER_INTENTS,
      default: 'UNKNOWN'
    },
    sentiment: {
      type: String,
      enum: SENTIMENTS,
      default: 'NEUTRAL'
    },
    extractedInformation: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    nextAction: {
      type: String,
      default: ''
    },
    requiresHuman: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Call', callSchema);
module.exports.CALL_STATUSES = CALL_STATUSES;
module.exports.CUSTOMER_INTENTS = CUSTOMER_INTENTS;
module.exports.SENTIMENTS = SENTIMENTS;
