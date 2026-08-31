const Call = require('../models/Call');
const AuditLog = require('../models/AuditLog');
const postCallService = require('../services/postCallService');

// In-memory idempotency cache (or DB check) to prevent duplicate processing
const processedWebhookEvents = new Set();

// Utility for webhook verification
const verifyWebhookAuth = (req) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // If secret is not set, allow in dev
  const authHeader = req.headers['x-vapi-secret'] || req.headers['authorization'];
  return authHeader === secret || authHeader === `Bearer ${secret}`;
};

// 1. POST /api/voice/webhook (General Vapi Event / Tool Call Webhook)
exports.handleGeneralWebhook = async (req, res) => {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
    }

    const { message } = req.body;
    const eventType = message?.type || req.body.type || 'unknown';
    const providerCallId = message?.call?.id || req.body.callId;

    console.log(`[Webhook General] Received event: ${eventType} for call: ${providerCallId}`);

    // Idempotency check
    const eventId = `${providerCallId}_${eventType}_${message?.timestamp || Date.now()}`;
    if (processedWebhookEvents.has(eventId)) {
      console.log(`[Webhook Idempotency] Skipping duplicate event: ${eventId}`);
      return res.json({ success: true, message: 'Event already processed (idempotent)' });
    }
    processedWebhookEvents.add(eventId);

    if (eventType === 'tool-calls') {
      // Delegate tool calls if handled via webhooks
      return res.json({ success: true, results: [] });
    }

    if (eventType === 'end-of-call-report' || eventType === 'call-ended') {
      const transcript = message?.transcript || message?.artifact?.transcript;
      const duration = message?.duration || message?.artifact?.durationSeconds || 60;
      
      if (providerCallId) {
        await postCallService.processCallCompletion(providerCallId, transcript, duration);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[Webhook Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. POST /api/voice/call-status (Status changes: RINGING, IN_PROGRESS, etc.)
exports.handleCallStatus = async (req, res) => {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
    }

    const { providerCallId, status, timestamp } = req.body;
    console.log(`[Webhook Status] Call ${providerCallId} status -> ${status}`);

    const call = await Call.findOne({ providerCallId });
    if (call) {
      call.status = status.toUpperCase();
      if (status.toUpperCase() === 'IN_PROGRESS' && !call.startedAt) {
        call.startedAt = new Date();
      }
      await call.save();
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. POST /api/voice/call-ended (Final Call End Report)
exports.handleCallEnded = async (req, res) => {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
    }

    const { providerCallId, transcript, duration, recordingUrl } = req.body;
    console.log(`[Webhook CallEnded] Call ${providerCallId} ended. Duration: ${duration}s`);

    const eventId = `${providerCallId}_call_ended`;
    if (processedWebhookEvents.has(eventId)) {
      return res.json({ success: true, message: 'Call end event already processed' });
    }
    processedWebhookEvents.add(eventId);

    if (recordingUrl) {
      await Call.findOneAndUpdate({ providerCallId }, { recordingUrl });
    }

    const result = await postCallService.processCallCompletion(providerCallId, transcript, duration);

    res.json({ success: true, message: 'Call completion processed successfully', result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
