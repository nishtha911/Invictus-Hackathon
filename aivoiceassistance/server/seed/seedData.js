const Customer = require('../models/Customer');
const FollowUp = require('../models/FollowUp');
const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');

const demoCustomers = [
  {
    name: 'Paras Pingale',
    phone: '+919518560080',
    email: 'paraspingale@example.com',
    preferredLanguage: 'English / Hindi',
    preferredCallTime: 'Morning (9 AM - 12 PM)',
    customerStatus: 'DOCUMENTS_PENDING',
    loan: {
      type: 'Personal Loan',
      amount: 500000,
      tenure: 36,
      purpose: 'Home Renovation'
    },
    financialProfile: {
      monthlyIncome: 85000,
      employmentType: 'Salaried',
      existingEMI: 12000,
      creditScore: 780
    },
    loanPlan: {
      eligibleAmount: 600000,
      interestRate: 11.5,
      estimatedEMI: 16480,
      tenure: 36
    },
    pendingDocuments: [
      { name: 'Bank Statement', status: 'PENDING' },
      { name: 'Salary Slip', status: 'SUBMITTED' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 3600000), // in 1 hour
      attempts: 0
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Primary test customer for live outbound AI voice call.'
  },
  {
    name: 'Priya Patel',
    phone: '+919876543211',
    email: 'priya.patel@example.com',
    preferredLanguage: 'English',
    preferredCallTime: 'Afternoon (12 PM - 4 PM)',
    customerStatus: 'INTERESTED',
    loan: {
      type: 'Home Loan',
      amount: 4500000,
      tenure: 240,
      purpose: 'Apartment Purchase'
    },
    financialProfile: {
      monthlyIncome: 160000,
      employmentType: 'Salaried',
      existingEMI: 0,
      creditScore: 810
    },
    loanPlan: {
      eligibleAmount: 5000000,
      interestRate: 8.5,
      estimatedEMI: 39000,
      tenure: 240
    },
    pendingDocuments: [
      { name: 'Property Tax Receipt', status: 'PENDING' },
      { name: 'Identity Proof', status: 'VERIFIED' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 7200000),
      attempts: 0
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Very high intent buyer, requesting call to clarify interest rate breakdown.'
  },
  {
    name: 'Amit Verma',
    phone: '+919876543212',
    email: 'amit.verma@example.com',
    preferredLanguage: 'Hindi',
    preferredCallTime: 'Evening (4 PM - 8 PM)',
    customerStatus: 'CALLBACK_REQUESTED',
    loan: {
      type: 'Business Loan',
      amount: 1500000,
      tenure: 60,
      purpose: 'Working Capital Expansion'
    },
    financialProfile: {
      monthlyIncome: 210000,
      employmentType: 'Self-Employed',
      existingEMI: 25000,
      creditScore: 740
    },
    loanPlan: {
      eligibleAmount: 1800000,
      interestRate: 13.0,
      estimatedEMI: 34100,
      tenure: 60
    },
    pendingDocuments: [
      { name: 'GST Returns 2 Years', status: 'PENDING' },
      { name: 'Audited Financials', status: 'PENDING' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 1800000),
      attempts: 2
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Requested callback in evening after shop closing time.'
  },
  {
    name: 'Sneha Reddy',
    phone: '+919876543213',
    email: 'sneha.reddy@example.com',
    preferredLanguage: 'English',
    preferredCallTime: 'Morning (9 AM - 12 PM)',
    customerStatus: 'NEW',
    loan: {
      type: 'Education Loan',
      amount: 1200000,
      tenure: 84,
      purpose: 'Masters Abroad Studies'
    },
    financialProfile: {
      monthlyIncome: 65000,
      employmentType: 'Salaried',
      existingEMI: 5000,
      creditScore: 760
    },
    loanPlan: {
      eligibleAmount: 1200000,
      interestRate: 9.75,
      estimatedEMI: 19800,
      tenure: 84
    },
    pendingDocuments: [
      { name: 'University Admission Letter', status: 'PENDING' },
      { name: 'Co-applicant Income Proof', status: 'PENDING' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 14400000),
      attempts: 0
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Newly generated lead from loan calculator page.'
  },
  {
    name: 'Vikram Singh',
    phone: '+919876543214',
    email: 'vikram.singh@example.com',
    preferredLanguage: 'Hindi / English',
    preferredCallTime: 'Afternoon (12 PM - 4 PM)',
    customerStatus: 'APPLICATION_STARTED',
    loan: {
      type: 'Vehicle Loan',
      amount: 800000,
      tenure: 48,
      purpose: 'SUV Purchase'
    },
    financialProfile: {
      monthlyIncome: 95000,
      employmentType: 'Salaried',
      existingEMI: 8000,
      creditScore: 730
    },
    loanPlan: {
      eligibleAmount: 900000,
      interestRate: 9.25,
      estimatedEMI: 19900,
      tenure: 48
    },
    pendingDocuments: [
      { name: 'Driving License', status: 'VERIFIED' },
      { name: 'Dealer Quotation', status: 'PENDING' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 21600000),
      attempts: 1
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Incomplete application. Vehicle quotation pending from dealership.'
  },
  {
    name: 'Kavita Menon',
    phone: '+919876543215',
    email: 'kavita.menon@example.com',
    preferredLanguage: 'English',
    preferredCallTime: 'Morning (9 AM - 12 PM)',
    customerStatus: 'UNDER_REVIEW',
    loan: {
      type: 'Personal Loan',
      amount: 350000,
      tenure: 24,
      purpose: 'Medical Expenses'
    },
    financialProfile: {
      monthlyIncome: 70000,
      employmentType: 'Salaried',
      existingEMI: 0,
      creditScore: 790
    },
    loanPlan: {
      eligibleAmount: 400000,
      interestRate: 12.0,
      estimatedEMI: 16400,
      tenure: 24
    },
    pendingDocuments: [
      { name: 'PAN Card', status: 'VERIFIED' },
      { name: 'Salary Slip', status: 'VERIFIED' },
      { name: 'Bank Statement', status: 'SUBMITTED' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 28800000),
      attempts: 1
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Documents submitted. Underwriting team reviewing bank statements.'
  },
  {
    name: 'Rajesh Gupta',
    phone: '+919876543216',
    email: 'rajesh.gupta@example.com',
    preferredLanguage: 'Hindi',
    preferredCallTime: 'Evening (4 PM - 8 PM)',
    customerStatus: 'NOT_INTERESTED',
    loan: {
      type: 'Personal Loan',
      amount: 200000,
      tenure: 12,
      purpose: 'Travel'
    },
    financialProfile: {
      monthlyIncome: 50000,
      employmentType: 'Salaried',
      existingEMI: 15000,
      creditScore: 680
    },
    loanPlan: {
      eligibleAmount: 200000,
      interestRate: 14.5,
      estimatedEMI: 18000,
      tenure: 12
    },
    pendingDocuments: [],
    followUp: {
      enabled: false,
      nextFollowUpAt: null,
      attempts: 3
    },
    consent: { voiceCalls: false, recordedCalls: false },
    notes: 'Declined during previous call due to interest rate objection.'
  },
  {
    name: 'Ananya Roy',
    phone: '+919876543217',
    email: 'ananya.roy@example.com',
    preferredLanguage: 'English',
    preferredCallTime: 'Afternoon (12 PM - 4 PM)',
    customerStatus: 'DOCUMENTS_SUBMITTED',
    loan: {
      type: 'Home Loan',
      amount: 6000000,
      tenure: 300,
      purpose: 'Villa Purchase'
    },
    financialProfile: {
      monthlyIncome: 250000,
      employmentType: 'Salaried',
      existingEMI: 30000,
      creditScore: 825
    },
    loanPlan: {
      eligibleAmount: 7000000,
      interestRate: 8.4,
      estimatedEMI: 47900,
      tenure: 300
    },
    pendingDocuments: [
      { name: 'Sale Agreement', status: 'SUBMITTED' },
      { name: '3 Years ITR', status: 'VERIFIED' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 36000000),
      attempts: 1
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'All core documents uploaded. Verification in progress.'
  },
  {
    name: 'Suresh Kumar',
    phone: '+919876543218',
    email: 'suresh.kumar@example.com',
    preferredLanguage: 'Hindi',
    preferredCallTime: 'Morning (9 AM - 12 PM)',
    customerStatus: 'UNREACHABLE',
    loan: {
      type: 'Business Loan',
      amount: 2500000,
      tenure: 36,
      purpose: 'Equipment Purchase'
    },
    financialProfile: {
      monthlyIncome: 180000,
      employmentType: 'Self-Employed',
      existingEMI: 40000,
      creditScore: 710
    },
    loanPlan: {
      eligibleAmount: 2200000,
      interestRate: 13.5,
      estimatedEMI: 74500,
      tenure: 36
    },
    pendingDocuments: [{ name: 'Machinery Invoice', status: 'PENDING' }],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 43200000),
      attempts: 3
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Did not answer 3 previous call attempts.'
  },
  {
    name: 'Deepak Joshi',
    phone: '+919876543219',
    email: 'deepak.joshi@example.com',
    preferredLanguage: 'English / Hindi',
    preferredCallTime: 'Evening (4 PM - 8 PM)',
    customerStatus: 'APPROVED',
    loan: {
      type: 'Personal Loan',
      amount: 1000000,
      tenure: 48,
      purpose: 'Debt Consolidation'
    },
    financialProfile: {
      monthlyIncome: 120000,
      employmentType: 'Salaried',
      existingEMI: 10000,
      creditScore: 800
    },
    loanPlan: {
      eligibleAmount: 1200000,
      interestRate: 10.99,
      estimatedEMI: 25800,
      tenure: 48
    },
    pendingDocuments: [
      { name: 'E-Mandate', status: 'VERIFIED' },
      { name: 'Loan Agreement Sign', status: 'VERIFIED' }
    ],
    followUp: {
      enabled: true,
      nextFollowUpAt: new Date(Date.now() + 50000000),
      attempts: 0
    },
    consent: { voiceCalls: true, recordedCalls: true },
    notes: 'Approved! Need final follow-up call to confirm bank account details for disbursement.'
  }
];

const runSeed = async () => {
  await Customer.deleteMany({});
  await FollowUp.deleteMany({});
  await Call.deleteMany({});
  await AuditLog.deleteMany({});

  const createdCustomers = await Customer.insertMany(demoCustomers);

  const followUpsToCreate = [];
  for (const customer of createdCustomers) {
    if (customer.followUp.enabled && customer.followUp.nextFollowUpAt) {
      followUpsToCreate.push({
        customerId: customer._id,
        reason: `Follow up on ${customer.customerStatus.replace('_', ' ').toLowerCase()} for ${customer.loan.type}`,
        scheduledAt: customer.followUp.nextFollowUpAt,
        status: 'SCHEDULED',
        priority: customer.customerStatus === 'DOCUMENTS_PENDING' || customer.customerStatus === 'CALLBACK_REQUESTED' ? 'HIGH' : 'MEDIUM',
        attempts: customer.followUp.attempts,
        notes: customer.notes
      });
    }
  }

  if (followUpsToCreate.length > 0) {
    await FollowUp.insertMany(followUpsToCreate);
  }

  return createdCustomers;
};

module.exports = { demoCustomers, runSeed };
