const axios = require('axios');

/**
 * Voice AI Service Abstraction Layer (Vapi + Retell AI + ElevenLabs TTS integration with Mock Mode support)
 */
class VoiceService {
  constructor() {
    this.provider = (process.env.VOICE_AI_PROVIDER || 'vapi').toLowerCase();
    this.apiKey = process.env.VOICE_AI_API_KEY || process.env.RETELL_API_KEY;
    this.phoneNumberId = process.env.VOICE_AI_PHONE_NUMBER_ID || process.env.RETELL_PHONE_NUMBER;
    this.agentId = process.env.RETELL_AGENT_ID;
    this.baseUrl = process.env.VOICE_AI_BASE_URL || (this.provider === 'retell' ? 'https://api.retellai.com/v2' : 'https://api.vapi.ai');
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    this.isMockMode = process.env.ENABLE_MOCK_VOICE === 'true' || !this.apiKey || this.apiKey.includes('test_key');
  }

  /**
   * Initiates an outbound voice call to a customer
   * @param {Object} params
   * @param {string} params.phoneNumber
   * @param {Object} params.customerContext
   * @param {string} params.callId (Internal DB call ID)
   * @returns {Promise<Object>} provider response with providerCallId
   */
  async initiateCall({ phoneNumber, customerContext, callId }) {
    console.log(`[VoiceService] Provider: ${this.provider.toUpperCase()} | Initiating call to ${phoneNumber}. Mock mode: ${this.isMockMode}`);

    if (this.isMockMode) {
      const mockProviderCallId = `${this.provider}_mock_call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log(`[VoiceService Mock] Generated provider call ID: ${mockProviderCallId}`);
      
      return {
        success: true,
        providerCallId: mockProviderCallId,
        status: 'INITIATED',
        isMock: true,
        message: 'Mock outbound call initiated successfully'
      };
    }

    if (this.provider === 'retell') {
      return this.initiateRetellCall({ phoneNumber, customerContext, callId });
    } else {
      return this.initiateVapiCall({ phoneNumber, customerContext, callId });
    }
  }

  /**
   * Retell AI Call Initiation
   */
  async initiateRetellCall({ phoneNumber, customerContext, callId }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/create-phone-call`,
        {
          from_number: this.phoneNumberId,
          to_number: phoneNumber,
          override_agent_id: this.agentId,
          retell_llm_dynamic_variables: {
            customer_name: customerContext.name,
            loan_type: customerContext.loanType,
            loan_amount: String(customerContext.loanAmount || ''),
            customer_status: customerContext.customerStatus,
            pending_documents: customerContext.pendingDocuments?.join(', ') || 'None',
            objective: customerContext.objective
          },
          metadata: {
            internalCallId: callId,
            customerId: customerContext.customerId
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        providerCallId: response.data.call_id || response.data.id,
        status: 'INITIATED',
        isMock: false,
        raw: response.data
      };
    } catch (error) {
      console.error('[VoiceService Retell Error]:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      throw new Error(`Retell AI call initiation failed: ${errMsg}`);
    }
  }

  /**
   * Vapi AI Call Initiation
   */
  async initiateVapiCall({ phoneNumber, customerContext, callId }) {
    try {
      const assistantPayload = {
        firstMessage: `Hello, am I speaking with ${customerContext.name}? This is Alex calling from Cognis Bank regarding your ${customerContext.loanType} application. Is now a convenient time to talk?`,
        model: {
          provider: 'openai',
          model: process.env.LLM_MODEL || 'gpt-4o-mini',
          systemPrompt: this.generateVapiSystemPrompt(customerContext)
        },
        serverUrl: `${process.env.APP_BASE_URL}/api/voice/webhook`,
        serverUrlSecret: process.env.WEBHOOK_SECRET
      };

      if (this.elevenLabsApiKey || process.env.ELEVENLABS_VOICE_ID) {
        assistantPayload.voice = {
          provider: 'elevenlabs',
          voiceId: this.elevenLabsVoiceId,
          ...(this.elevenLabsApiKey ? { apiKey: this.elevenLabsApiKey } : {})
        };
      }

      const callPayload = {
        type: 'outboundPhoneCall',
        phoneNumberId: this.phoneNumberId,
        customer: { number: phoneNumber },
        assistant: assistantPayload,
        metadata: {
          internalCallId: callId,
          customerId: customerContext.customerId
        }
      };

      let response;
      try {
        response = await axios.post(`${this.baseUrl}/call`, callPayload, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        if (err.response?.status === 404) {
          response = await axios.post(`${this.baseUrl}/call/phone`, callPayload, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          throw err;
        }
      }

      return {
        success: true,
        providerCallId: response.data.id || response.data.callId,
        status: response.data.status || 'INITIATED',
        isMock: false,
        raw: response.data
      };
    } catch (error) {
      console.error('[VoiceService Vapi Error]:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      throw new Error(`Vapi API call initiation failed: ${errMsg}`);
    }
  }

  /**
   * Terminates an active call
   */
  async endCall(providerCallId) {
    if (this.isMockMode || providerCallId.includes('mock')) {
      return { success: true, status: 'ENDED', isMock: true };
    }

    try {
      const endpoint = this.provider === 'retell'
        ? `${this.baseUrl}/delete-phone-call/${providerCallId}`
        : `${this.baseUrl}/call/${providerCallId}/end`;

      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return { success: true, status: 'ENDED', raw: response.data };
    } catch (error) {
      console.error('[VoiceService Error] End call failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetches call status from provider
   */
  async getCallStatus(providerCallId) {
    if (this.isMockMode || providerCallId.includes('mock')) {
      return { success: true, status: 'COMPLETED', isMock: true };
    }

    try {
      const endpoint = this.provider === 'retell'
        ? `${this.baseUrl}/get-call/${providerCallId}`
        : `${this.baseUrl}/call/${providerCallId}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return { success: true, status: response.data.status || response.data.call_status, raw: response.data };
    } catch (error) {
      console.error('[VoiceService Error] Get call status failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  generateVapiSystemPrompt(context) {
    return `
You are Alex, an AI Voice Assistant representing Cognis Bank.
You are calling customer: ${context.name}
Phone: ${context.phone}
Loan Type: ${context.loanType}
Requested Amount: ₹${context.loanAmount?.toLocaleString('en-IN') || context.loanAmount}
Current Status: ${context.customerStatus}
Pending Documents: ${context.pendingDocuments?.join(', ') || 'None'}
Objective of Call: ${context.objective}

GUIDELINES & CONVERSATION RULES:
1. Always identify yourself as an AI assistant for Cognis Bank.
2. Confirm you are speaking with ${context.name}.
3. Ask if it is a convenient time to speak. If not, ask when to call back and call backend tool 'schedule_followup'.
4. Explain the exact reason for the call concisely.
5. Trigger appropriate backend tools when customer provides updates.
6. NEVER pretend to be human.
7. NEVER guarantee loan approval or reject a customer autonomously.
8. End the conversation politely once objective is completed.
`;
  }
}

module.exports = new VoiceService();
