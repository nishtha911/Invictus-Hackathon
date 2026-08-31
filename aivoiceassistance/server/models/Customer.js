const mongoose = require('mongoose');

const CUSTOMER_STATUSES = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'APPLICATION_STARTED',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CALLBACK_REQUESTED',
  'NOT_INTERESTED',
  'UNREACHABLE',
  'CONVERTED'
];

const LOAN_TYPES = [
  'Personal Loan',
  'Home Loan',
  'Education Loan',
  'Business Loan',
  'Vehicle Loan'
];

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      unique: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    preferredLanguage: {
      type: String,
      default: 'English'
    },
    preferredCallTime: {
      type: String,
      default: 'Morning (9 AM - 12 PM)'
    },
    customerStatus: {
      type: String,
      enum: CUSTOMER_STATUSES,
      default: 'NEW'
    },
    loan: {
      type: {
        type: String,
        enum: LOAN_TYPES,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      tenure: {
        type: Number, // in months
        default: 36
      },
      purpose: {
        type: String,
        default: 'General Purpose'
      }
    },
    financialProfile: {
      monthlyIncome: { type: Number, default: 0 },
      employmentType: { type: String, default: 'Salaried' },
      existingEMI: { type: Number, default: 0 },
      creditScore: { type: Number, default: 750 }
    },
    loanPlan: {
      eligibleAmount: { type: Number },
      interestRate: { type: Number, default: 10.5 },
      estimatedEMI: { type: Number },
      tenure: { type: Number, default: 36 }
    },
    pendingDocuments: [
      {
        name: { type: String, required: true },
        status: {
          type: String,
          enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
          default: 'PENDING'
        },
        uploadedAt: { type: Date }
      }
    ],
    followUp: {
      enabled: { type: Boolean, default: true },
      nextFollowUpAt: { type: Date },
      lastFollowUpAt: { type: Date },
      attempts: { type: Number, default: 0 }
    },
    consent: {
      voiceCalls: { type: Boolean, default: true },
      recordedCalls: { type: Boolean, default: true }
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

module.exports = mongoose.model('Customer', customerSchema);
module.exports.CUSTOMER_STATUSES = CUSTOMER_STATUSES;
module.exports.LOAN_TYPES = LOAN_TYPES;
