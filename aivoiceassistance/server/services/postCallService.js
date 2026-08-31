const Customer = require('../models/Customer');
const FollowUp = require('../models/FollowUp');
const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');
const llmService = require('./llmService');

class PostCallService {
  /**
   * Process post-call transcript and complete call workflow
   * @param {string} callId Internal Call ObjectId or providerCallId
   * @param {Array|string} transcript
   * @param {number} duration Call duration in seconds
   */
  async processCallCompletion(callId, transcript, duration = 60) {
    console.log(`[PostCallService] Processing post-call analysis for call: ${callId}`);

    let call = await Call.findOne({
      $or: [{ _id: callId }, { providerCallId: callId }]
    });

    if (!call) {
      console.error(`[PostCallService Error] Call record not found for ID: ${callId}`);
      return { success: false, reason: 'Call not found' };
    }

    const customer = await Customer.findById(call.customerId);
    if (!customer) {
      console.error(`[PostCallService Error] Customer not found for call: ${callId}`);
      return { success: false, reason: 'Customer not found' };
    }

    // Save transcript if provided
    if (transcript) {
      call.transcript = Array.isArray(transcript) ? transcript : [
        { role: 'assistant', text: transcript, timestamp: new Date() }
      ];
    }

    // Perform LLM transcript analysis
    const customerContext = {
      name: customer.name,
      loanType: customer.loan.type,
      pendingDocuments: customer.pendingDocuments.filter(d => d.status === 'PENDING').map(d => d.name)
    };

    const analysis = await llmService.analyzeTranscript(call.transcript, customerContext);

    // Update Call record with analysis results
    call.status = 'COMPLETED';
    call.endedAt = new Date();
    call.duration = duration || call.duration || 60;
    call.summary = analysis.summary;
    call.customerIntent = analysis.intent;
    call.sentiment = analysis.sentiment;
    call.outcome = analysis.outcome;
    call.nextAction = analysis.nextAction;
    call.requiresHuman = analysis.requiresHuman;

    await call.save();

    // Update Document statuses if extracted by AI
    if (analysis.documentUpdates && analysis.documentUpdates.length > 0) {
      for (const update of analysis.documentUpdates) {
        const docIndex = customer.pendingDocuments.findIndex(
          d => d.name.toLowerCase() === update.name.toLowerCase()
        );
        if (docIndex !== -1) {
          customer.pendingDocuments[docIndex].status = update.status;
          customer.pendingDocuments[docIndex].uploadedAt = new Date();
        }
      }

      // If all documents verified/submitted, update customer status
      const hasPending = customer.pendingDocuments.some(d => d.status === 'PENDING');
      if (!hasPending && customer.customerStatus === 'DOCUMENTS_PENDING') {
        customer.customerStatus = 'DOCUMENTS_SUBMITTED';
      }
    }

    // Handle Customer status updates based on Intent & Human Escalation
    if (analysis.requiresHuman) {
      customer.customerStatus = 'CALLBACK_REQUESTED';
    } else if (analysis.intent === 'NOT_INTERESTED') {
      customer.customerStatus = 'NOT_INTERESTED';
      customer.followUp.enabled = false;
    } else if (analysis.intent === 'INTERESTED' && customer.customerStatus === 'NEW') {
      customer.customerStatus = 'INTERESTED';
    }

    customer.followUp.lastFollowUpAt = new Date();
    await customer.save();

    // Update active FollowUp record if linked
    if (call.followUpId) {
      const activeFollowUp = await FollowUp.findById(call.followUpId);
      if (activeFollowUp) {
        activeFollowUp.status = analysis.requiresHuman ? 'REQUIRES_HUMAN' : 'COMPLETED';
        activeFollowUp.completedAt = new Date();
        activeFollowUp.outcome = analysis.summary;
        await activeFollowUp.save();
      }
    }

    // Schedule Next Follow-up if required
    if (analysis.followUpRequired && customer.followUp.enabled && !analysis.requiresHuman) {
      const nextDate = analysis.suggestedFollowUp || new Date(Date.now() + 86400000 * 2);
      
      const newFollowUp = await FollowUp.create({
        customerId: customer._id,
        reason: `Follow-up: ${analysis.nextAction}`,
        scheduledAt: nextDate,
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        notes: `Auto-scheduled post call: ${analysis.summary}`
      });

      customer.followUp.nextFollowUpAt = nextDate;
      await customer.save();
      console.log(`[PostCallService] Scheduled next follow-up (${newFollowUp._id}) for ${nextDate}`);
    }

    // Log Audit Trail
    await AuditLog.create({
      action: 'CALL_COMPLETED_POST_ANALYSIS',
      performedBy: 'SYSTEM_LLM',
      entityType: 'Call',
      entityId: call._id,
      details: {
        customerId: customer._id,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        requiresHuman: analysis.requiresHuman,
        summary: analysis.summary
      }
    });

    console.log(`[PostCallService] Call ${call._id} processing completed successfully.`);
    return {
      success: true,
      call,
      analysis
    };
  }
}

module.exports = new PostCallService();
