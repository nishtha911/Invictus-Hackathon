const mongoose = require('mongoose');
const Call = require('../models/Call');
const Customer = require('../models/Customer');
const FollowUp = require('../models/FollowUp');
const AuditLog = require('../models/AuditLog');
const voiceService = require('../services/voiceService');
const postCallService = require('../services/postCallService');
const elevenLabsService = require('../services/elevenLabsService');
const dynamicQuestionEngine = require('../services/dynamicQuestionEngine');

// GET /api/calls
exports.getCalls = async (req, res) => {
  try {
    const { customerId, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    const total = await Call.countDocuments(query);
    const calls = await Call.find(query)
      .populate('customerId', 'name phone email customerStatus loan')
      .populate('followUpId', 'reason scheduledAt status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: calls.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: calls
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/calls/tts (Generates audio stream via ElevenLabs)
exports.generateTTS = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'text parameter is required' });
    }

    const audioBuffer = await elevenLabsService.generateSpeech(text);

    if (audioBuffer) {
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length
      });
      return res.send(audioBuffer);
    }

    res.status(500).json({ success: false, message: 'Failed to synthesize speech via ElevenLabs' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/calls/web-conversation (Dynamic Groq/LLM Turn Generation based on previous customer answers)
exports.processWebConversationTurn = async (req, res) => {
  try {
    const { customerId, customerName, history = [], userSpeech = '' } = req.body;

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }
    
    if (!customer) {
      const searchKey = customerName || customerId;
      if (searchKey) {
        // Escape special regex characters safely
        const safeSearch = String(searchKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        customer = await Customer.findOne({
          $or: [
            { phone: searchKey },
            { name: { $regex: safeSearch, $options: 'i' } }
          ]
        });
      }
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Target customer profile not found' });
    }

    console.log(`[CallController WebTurn] Calling customer: ${customer.name} | Loan: ${customer.loan?.type} ₹${customer.loan?.amount}`);

    // Generate dynamic speech reply & next question via DynamicQuestionEngine
    const turnResult = await dynamicQuestionEngine.generateNextTurn({
      customer,
      history,
      userSpeech
    });

    // Update customer status or document statuses if identified
    if (turnResult.suggestedStatus) {
      customer.customerStatus = turnResult.suggestedStatus;
    }

    if (turnResult.documentUpdate && turnResult.documentUpdate.name) {
      const docIndex = customer.pendingDocuments.findIndex(
        d => d.name.toLowerCase() === turnResult.documentUpdate.name.toLowerCase()
      );
      if (docIndex !== -1) {
        customer.pendingDocuments[docIndex].status = turnResult.documentUpdate.status || 'SUBMITTED';
      }
    }

    if (turnResult.requiresHuman) {
      customer.customerStatus = 'CALLBACK_REQUESTED';
    }

    await customer.save();

    res.json({
      success: true,
      replyText: turnResult.speechReply,
      extractedIntent: turnResult.extractedIntent,
      requiresHuman: turnResult.requiresHuman
    });
  } catch (error) {
    console.error('[CallController Error] Dynamic turn failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/calls/web-config/:customerId (Dynamic Initial Greeting Question for target customer)
exports.getWebCallConfig = async (req, res) => {
  try {
    const { customerId } = req.params;

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }
    
    if (!customer) {
      const safeSearch = String(customerId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      customer = await Customer.findOne({
        $or: [
          { phone: customerId },
          { name: { $regex: safeSearch, $options: 'i' } }
        ]
      });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: `Customer '${customerId}' not found` });
    }

    console.log(`[CallController WebConfig] Generating greeting for target customer: ${customer.name} (${customer.loan?.type} ₹${customer.loan?.amount})`);

    // Generate dynamic initial opening question for THIS specific customer
    const firstMessage = await dynamicQuestionEngine.generateInitialQuestion(customer);

    res.json({
      success: true,
      data: {
        customer,
        hasElevenLabs: Boolean(process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('your_elevenlabs')),
        firstMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/calls/complete-web-call
exports.completeWebCall = async (req, res) => {
  try {
    const { customerId, customerName, transcript, duration = 45 } = req.body;

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }

    if (!customer) {
      const searchKey = customerName || customerId;
      if (searchKey) {
        const safeSearch = String(searchKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        customer = await Customer.findOne({
          $or: [
            { phone: searchKey },
            { name: { $regex: safeSearch, $options: 'i' } }
          ]
        });
      }
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Target customer not found' });
    }

    const callRecord = await Call.create({
      customerId: customer._id,
      phoneNumber: customer.phone,
      direction: 'OUTBOUND',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - duration * 1000),
      endedAt: new Date(),
      duration,
      providerCallId: `browser_live_${Date.now()}`
    });

    const result = await postCallService.processCallCompletion(callRecord._id, transcript, duration);

    res.json({
      success: true,
      message: 'Browser WebRTC call completion processed successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/calls/:id
exports.getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('customerId')
      .populate('followUpId');
    
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }
    res.json({ success: true, data: call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/calls/initiate (Manual AI Outbound Call Trigger)
exports.initiateCall = async (req, res) => {
  try {
    const { customerId, followUpId, customObjective } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }

    if (!customer) {
      const safeSearch = String(customerId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      customer = await Customer.findOne({
        $or: [
          { phone: customerId },
          { name: { $regex: safeSearch, $options: 'i' } }
        ]
      });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: `Customer '${customerId}' not found in database` });
    }

    if (customer.consent && customer.consent.voiceCalls === false) {
      return res.status(400).json({
        success: false,
        message: 'Customer has not granted consent for AI voice calls'
      });
    }

    const activeCall = await Call.findOne({
      customerId: customer._id,
      status: { $in: ['INITIATED', 'RINGING', 'IN_PROGRESS'] }
    });

    if (activeCall) {
      return res.status(409).json({
        success: false,
        message: 'An active call is already in progress for this customer',
        activeCallId: activeCall._id
      });
    }

    const pendingDocs = customer.pendingDocuments
      .filter(d => d.status === 'PENDING')
      .map(d => d.name);

    let objective = customObjective;
    if (!objective) {
      if (pendingDocs.length > 0) {
        objective = `Follow up on pending document(s): ${pendingDocs.join(', ')}`;
      } else if (customer.customerStatus === 'CALLBACK_REQUESTED') {
        objective = 'Respond to customer callback request regarding loan terms';
      } else {
        objective = `Follow up on ${customer.loan.type} application progress (Status: ${customer.customerStatus})`;
      }
    }

    const callRecord = await Call.create({
      customerId: customer._id,
      followUpId: followUpId || null,
      phoneNumber: customer.phone,
      direction: 'OUTBOUND',
      status: 'INITIATED',
      startedAt: new Date()
    });

    const customerContext = {
      customerId: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      loanType: customer.loan.type,
      loanAmount: customer.loan.amount,
      customerStatus: customer.customerStatus,
      pendingDocuments: pendingDocs,
      objective
    };

    const providerResult = await voiceService.initiateCall({
      phoneNumber: customer.phone,
      customerContext,
      callId: callRecord._id.toString()
    });

    callRecord.providerCallId = providerResult.providerCallId;
    callRecord.status = 'IN_PROGRESS';
    await callRecord.save();

    await AuditLog.create({
      action: 'CALL_INITIATED',
      performedBy: req.user?.name || 'ADMIN',
      entityType: 'Call',
      entityId: callRecord._id,
      details: { customerId: customer._id, phone: customer.phone, isMock: providerResult.isMock }
    });

    if (providerResult.isMock) {
      setTimeout(async () => {
        try {
          const mockTranscript = [
            { role: 'assistant', text: `Hello, am I speaking with ${customer.name}? This is Alex from Cognis Bank.`, timestamp: new Date() },
            { role: 'user', text: `Yes, speaking. How can I help you?`, timestamp: new Date() },
            { role: 'assistant', text: `I am calling to follow up on your ${customer.loan.type} application for ₹${customer.loan.amount.toLocaleString('en-IN')}. Is now a convenient time to speak?`, timestamp: new Date() },
            { role: 'user', text: `Yes, I have a few minutes.`, timestamp: new Date() },
            { role: 'assistant', text: `Great! We noticed that your ${pendingDocs[0] || 'bank statement'} is still pending. Will you be able to upload it today?`, timestamp: new Date() },
            { role: 'user', text: `Yes, I will upload the statement by this evening.`, timestamp: new Date() },
            { role: 'assistant', text: `Thank you ${customer.name}! I will update our records. Have a wonderful day!`, timestamp: new Date() }
          ];

          await postCallService.processCallCompletion(callRecord._id, mockTranscript, 45);
        } catch (err) {
          console.error('[Mock Call Simulation Error]:', err.message);
        }
      }, 3000);
    }

    res.status(201).json({
      success: true,
      message: providerResult.isMock
        ? 'Call initiated in Mock Mode (simulated response will complete in 3s)'
        : 'Outbound voice call initiated successfully',
      data: {
        callId: callRecord._id,
        providerCallId: providerResult.providerCallId,
        status: callRecord.status,
        phoneNumber: callRecord.phoneNumber,
        isMock: providerResult.isMock
      }
    });
  } catch (error) {
    console.error('[CallController Error] Initiate call failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
