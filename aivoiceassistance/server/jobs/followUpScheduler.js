const cron = require('node-cron');
const FollowUp = require('../models/FollowUp');
const Customer = require('../models/Customer');
const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');
const voiceService = require('../services/voiceService');
const postCallService = require('../services/postCallService');

class FollowUpScheduler {
  constructor() {
    this.cronTask = null;
    this.isRunning = false;
  }

  start() {
    console.log('[FollowUpScheduler] Initializing node-cron follow-up scheduler (runs every 1 minute)...');
    
    // Run every 1 minute: '* * * * *'
    this.cronTask = cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        console.log('[FollowUpScheduler] Previous execution still running, skipping tick.');
        return;
      }

      this.isRunning = true;
      try {
        await this.processDueFollowUps();
      } catch (error) {
        console.error('[FollowUpScheduler Error]:', error.message);
      } finally {
        this.isRunning = false;
      }
    });
  }

  async processDueFollowUps() {
    const now = new Date();
    
    // Find due follow-ups (scheduledAt <= now, status: SCHEDULED)
    const dueFollowUps = await FollowUp.find({
      status: 'SCHEDULED',
      scheduledAt: { $lte: now }
    }).populate('customerId');

    if (dueFollowUps.length === 0) {
      return;
    }

    console.log(`[FollowUpScheduler] Found ${dueFollowUps.length} due follow-up(s) to process.`);

    for (const followUp of dueFollowUps) {
      const customer = followUp.customerId;

      // 1. Validation Checks
      if (!customer) {
        console.warn(`[FollowUpScheduler] Customer not found for follow-up ${followUp._id}, marking FAILED`);
        followUp.status = 'FAILED';
        followUp.notes = 'Associated customer deleted or missing';
        await followUp.save();
        continue;
      }

      // 2. Consent Check
      if (!customer.consent?.voiceCalls || !customer.followUp?.enabled) {
        console.log(`[FollowUpScheduler] Voice calls disabled or consent revoked for customer ${customer.name}, cancelling follow-up`);
        followUp.status = 'CANCELLED';
        followUp.notes = 'Cancelled due to missing customer consent or disabled AI follow-ups';
        await followUp.save();
        continue;
      }

      // 3. Attempt limit check
      if (followUp.attempts >= followUp.maxAttempts) {
        console.warn(`[FollowUpScheduler] Max call attempts (${followUp.maxAttempts}) reached for follow-up ${followUp._id}`);
        followUp.status = 'REQUIRES_HUMAN';
        followUp.priority = 'HIGH';
        followUp.notes = `Max attempts (${followUp.maxAttempts}) reached without response. Escalated to human.`;
        await followUp.save();

        customer.customerStatus = 'CALLBACK_REQUESTED';
        await customer.save();
        continue;
      }

      // 4. Duplicate active call check
      const existingActiveCall = await Call.findOne({
        customerId: customer._id,
        status: { $in: ['INITIATED', 'RINGING', 'IN_PROGRESS'] }
      });

      if (existingActiveCall) {
        console.log(`[FollowUpScheduler] Active call already in progress for customer ${customer.name}, postponing scheduler tick`);
        continue;
      }

      // 5. Lock and mark as CALLING
      followUp.status = 'CALLING';
      followUp.attempts += 1;
      followUp.lastAttemptAt = now;
      await followUp.save();

      try {
        console.log(`[FollowUpScheduler] Initiating scheduled AI call for customer ${customer.name} (${customer.phone})`);

        const pendingDocs = customer.pendingDocuments
          .filter(d => d.status === 'PENDING')
          .map(d => d.name);

        const objective = followUp.reason || `Follow up on ${customer.loan.type} application`;

        // Create Call Record
        const callRecord = await Call.create({
          customerId: customer._id,
          followUpId: followUp._id,
          phoneNumber: customer.phone,
          direction: 'OUTBOUND',
          status: 'INITIATED',
          startedAt: now
        });

        // Trigger Voice AI
        const providerResult = await voiceService.initiateCall({
          phoneNumber: customer.phone,
          customerContext: {
            customerId: customer._id.toString(),
            name: customer.name,
            phone: customer.phone,
            loanType: customer.loan.type,
            loanAmount: customer.loan.amount,
            customerStatus: customer.customerStatus,
            pendingDocuments: pendingDocs,
            objective
          },
          callId: callRecord._id.toString()
        });

        callRecord.providerCallId = providerResult.providerCallId;
        callRecord.status = 'IN_PROGRESS';
        await callRecord.save();

        await AuditLog.create({
          action: 'SCHEDULER_CALL_INITIATED',
          performedBy: 'NODE_CRON_SCHEDULER',
          entityType: 'Call',
          entityId: callRecord._id,
          details: { followUpId: followUp._id, customerId: customer._id }
        });

        // If mock mode, auto complete simulation
        if (providerResult.isMock) {
          setTimeout(async () => {
            const mockTranscript = [
              { role: 'assistant', text: `Hello ${customer.name}, calling from Cognis Bank regarding ${objective}.`, timestamp: new Date() },
              { role: 'user', text: `Hi! Yes, I am working on the pending documents.`, timestamp: new Date() },
              { role: 'assistant', text: `Great! Please upload them in your loan portal. Have a nice day!`, timestamp: new Date() }
            ];
            await postCallService.processCallCompletion(callRecord._id, mockTranscript, 30);
          }, 3000);
        }
      } catch (callErr) {
        console.error(`[FollowUpScheduler Call Error] Failed to launch call for ${customer.name}:`, callErr.message);
        followUp.status = 'FAILED';
        followUp.notes = `Call initiation failed: ${callErr.message}`;
        await followUp.save();
      }
    }
  }

  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      console.log('[FollowUpScheduler] Stopped scheduler task.');
    }
  }
}

module.exports = new FollowUpScheduler();
