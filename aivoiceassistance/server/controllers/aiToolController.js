const Customer = require('../models/Customer');
const FollowUp = require('../models/FollowUp');
const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');
const { CUSTOMER_STATUSES } = require('../models/Customer');
const { CUSTOMER_INTENTS } = require('../models/Call');

// 1. Tool: get_customer_profile
exports.getCustomerProfile = async (req, res) => {
  try {
    const { customerId, phone } = req.body;
    const query = customerId ? { _id: customerId } : { phone };

    const customer = await Customer.findOne(query);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    res.json({
      success: true,
      data: {
        customerId: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        preferredLanguage: customer.preferredLanguage,
        customerStatus: customer.customerStatus,
        loan: customer.loan,
        pendingDocuments: customer.pendingDocuments,
        loanPlan: {
          eligibleAmount: customer.loanPlan?.eligibleAmount,
          interestRate: customer.loanPlan?.interestRate,
          estimatedEMI: customer.loanPlan?.estimatedEMI,
          tenure: customer.loanPlan?.tenure
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tool: update_customer_status
exports.updateCustomerStatus = async (req, res) => {
  try {
    const { customerId, status, notes } = req.body;

    if (!CUSTOMER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid customer status: '${status}'. Allowed values: ${CUSTOMER_STATUSES.join(', ')}`
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const previousStatus = customer.customerStatus;
    customer.customerStatus = status;
    if (notes) customer.notes = `${customer.notes || ''}\n[AI Update ${new Date().toISOString()}]: ${notes}`.trim();

    await customer.save();

    await AuditLog.create({
      action: 'AI_TOOL_UPDATE_STATUS',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'Customer',
      entityId: customer._id,
      details: { previousStatus, newStatus: status, notes }
    });

    res.json({
      success: true,
      message: `Customer status successfully updated from ${previousStatus} to ${status}`,
      data: { customerId: customer._id, customerStatus: customer.customerStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Tool: update_document_status
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { customerId, documentName, status } = req.body;
    const validDocStatuses = ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'];

    if (!validDocStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document status: '${status}'. Allowed: ${validDocStatuses.join(', ')}`
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const docIndex = customer.pendingDocuments.findIndex(
      d => d.name.toLowerCase() === documentName.toLowerCase()
    );

    if (docIndex !== -1) {
      customer.pendingDocuments[docIndex].status = status;
      if (status === 'SUBMITTED' || status === 'VERIFIED') {
        customer.pendingDocuments[docIndex].uploadedAt = new Date();
      }
    } else {
      // Add document if not present
      customer.pendingDocuments.push({
        name: documentName,
        status,
        uploadedAt: status !== 'PENDING' ? new Date() : undefined
      });
    }

    // Auto update customer status if all pending documents are submitted
    const remainingPending = customer.pendingDocuments.some(d => d.status === 'PENDING');
    if (!remainingPending && customer.customerStatus === 'DOCUMENTS_PENDING') {
      customer.customerStatus = 'DOCUMENTS_SUBMITTED';
    }

    await customer.save();

    await AuditLog.create({
      action: 'AI_TOOL_UPDATE_DOCUMENT',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'Customer',
      entityId: customer._id,
      details: { documentName, status }
    });

    res.json({
      success: true,
      message: `Document status updated successfully`,
      data: { customerId: customer._id, pendingDocuments: customer.pendingDocuments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Tool: update_customer_intent
exports.updateCustomerIntent = async (req, res) => {
  try {
    const { customerId, callId, intent, notes } = req.body;

    if (!CUSTOMER_INTENTS.includes(intent)) {
      return res.status(400).json({
        success: false,
        message: `Invalid customer intent: '${intent}'. Allowed: ${CUSTOMER_INTENTS.join(', ')}`
      });
    }

    if (callId) {
      const call = await Call.findById(callId);
      if (call) {
        call.customerIntent = intent;
        if (notes) call.summary = `${call.summary || ''} (Intent: ${intent} - ${notes})`.trim();
        await call.save();
      }
    }

    const customer = await Customer.findById(customerId);
    if (customer) {
      if (intent === 'NOT_INTERESTED') {
        customer.customerStatus = 'NOT_INTERESTED';
        customer.followUp.enabled = false;
      } else if (intent === 'INTERESTED' && customer.customerStatus === 'NEW') {
        customer.customerStatus = 'INTERESTED';
      } else if (intent === 'CALLBACK_REQUESTED') {
        customer.customerStatus = 'CALLBACK_REQUESTED';
      }
      await customer.save();
    }

    await AuditLog.create({
      action: 'AI_TOOL_UPDATE_INTENT',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'Customer',
      entityId: customerId,
      details: { intent, notes }
    });

    res.json({
      success: true,
      message: `Customer intent recorded as ${intent}`,
      data: { customerId, intent }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Tool: schedule_followup
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { customerId, reason, scheduledAt, priority = 'MEDIUM', notes } = req.body;

    if (!customerId || !reason || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'customerId, reason, and scheduledAt parameters are required'
      });
    }

    const followUpDate = new Date(scheduledAt);
    if (isNaN(followUpDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid ISO date string for scheduledAt' });
    }

    const followUp = await FollowUp.create({
      customerId,
      reason,
      scheduledAt: followUpDate,
      status: 'SCHEDULED',
      priority,
      notes: notes ? `Scheduled by AI: ${notes}` : 'Scheduled by AI Voice Agent'
    });

    // Update customer next follow-up date
    await Customer.findByIdAndUpdate(customerId, {
      'followUp.enabled': true,
      'followUp.nextFollowUpAt': followUpDate
    });

    await AuditLog.create({
      action: 'AI_TOOL_SCHEDULE_FOLLOWUP',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'FollowUp',
      entityId: followUp._id,
      details: { customerId, reason, scheduledAt: followUpDate }
    });

    res.status(201).json({
      success: true,
      message: 'Follow-up successfully scheduled',
      data: followUp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Tool: request_human_agent
exports.requestHumanAgent = async (req, res) => {
  try {
    const { customerId, callId, reason } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.customerStatus = 'CALLBACK_REQUESTED';
    await customer.save();

    // Create high-priority human follow-up
    const followUp = await FollowUp.create({
      customerId,
      reason: `HUMAN ESCALATION: ${reason || 'Customer requested human agent during voice call'}`,
      scheduledAt: new Date(Date.now() + 1800000), // urgent 30 min window
      status: 'REQUIRES_HUMAN',
      priority: 'URGENT',
      notes: `Escalated by Voice AI. Reason: ${reason}`
    });

    if (callId) {
      await Call.findByIdAndUpdate(callId, { requiresHuman: true, outcome: 'HUMAN_ESCALATION_REQUESTED' });
    }

    await AuditLog.create({
      action: 'AI_TOOL_HUMAN_ESCALATION',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'FollowUp',
      entityId: followUp._id,
      details: { customerId, reason }
    });

    res.json({
      success: true,
      message: 'Human agent escalation created successfully',
      data: { customerId, followUpId: followUp._id, priority: 'URGENT' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Tool: update_call_outcome
exports.updateCallOutcome = async (req, res) => {
  try {
    const { callId, outcome, notes, summary } = req.body;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    call.outcome = outcome;
    if (summary) call.summary = summary;
    if (notes) call.nextAction = notes;

    await call.save();

    await AuditLog.create({
      action: 'AI_TOOL_UPDATE_CALL_OUTCOME',
      performedBy: 'VOICE_AI_AGENT',
      entityType: 'Call',
      entityId: call._id,
      details: { outcome, summary, notes }
    });

    res.json({
      success: true,
      message: 'Call outcome updated successfully',
      data: call
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
