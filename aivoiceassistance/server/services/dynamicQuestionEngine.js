const groqService = require('./groqService');
const axios = require('axios');

/**
 * Dynamic Voice Question Engine — Calm & Patient Indian Bank Loan Customer Care Representative
 * Connected to Groq LLM to dynamically understand user answers (rescheduling, questions, portal guidance).
 */
class DynamicQuestionEngine {

  /**
   * Generates natural initial customer care call greeting
   * @param {Object} customer
   */
  async generateInitialQuestion(customer) {
    const pendingDocs = customer.pendingDocuments
      .filter(d => d.status === 'PENDING')
      .map(d => d.name);

    const loan = customer.loan || {};

    const systemPrompt = `You are Alex, a calm, warm, and polite Customer Care Executive calling from Cognis Bank.
You are calling applicant ${customer.name} regarding the ${loan.type} offer of ₹${loan.amount?.toLocaleString('en-IN')} they recently reviewed on our website.

GUIDELINES:
1. Greet ${customer.name} calmly and professionally.
2. Mention you are following up on the ${loan.type} offer of ₹${loan.amount?.toLocaleString('en-IN')} they checked on our Cognis Bank portal.
3. Ask calmly if now is a good time to discuss any questions or assist with their pending ${pendingDocs[0] || 'bank statement'}.
4. Keep the greeting under 2 short conversational sentences. Do NOT sound robotic.
`;

    const groqReply = await groqService.chatCompletion(systemPrompt, `Opening greeting for ${customer.name}`, false);
    if (groqReply) return groqReply.trim();

    return `Hi ${customer.name}, this is Alex calling from Cognis Bank customer care regarding the ${loan.type} offer of ₹${loan.amount?.toLocaleString('en-IN')} you checked on our website. Do you have a couple of minutes to discuss the next steps?`;
  }

  /**
   * Evaluates customer's natural response via Groq LLM & generates dynamic, calm response
   * @param {Object} params
   */
  async generateNextTurn({ customer, history = [], userSpeech = '' }) {
    console.log(`[Groq CustomerCare Engine] Customer: ${customer.name} | Spoke: "${userSpeech}"`);

    const pendingDocs = customer.pendingDocuments
      .filter(d => d.status === 'PENDING')
      .map(d => d.name);

    const loanPlan = customer.loanPlan || {};
    const loan = customer.loan || {};

    const systemPrompt = `You are Alex, a calm, patient, warm, and highly helpful Bank Loan Customer Care Representative at Cognis Bank.
You are having a live phone conversation with applicant ${customer.name}.

CUSTOMER & PRE-APPROVED LOAN PLAN CONTEXT:
- Customer Name: ${customer.name}
- Organization: Cognis Bank
- Loan Product: ${loan.type}
- Pre-Approved Amount: ₹${loanPlan.eligibleAmount?.toLocaleString('en-IN') || loan.amount}
- Interest Rate: ${loanPlan.interestRate || 11.5}%
- Monthly EMI: ₹${loanPlan.estimatedEMI?.toLocaleString('en-IN') || '16,480'}/month for ${loan.tenure || 36} months
- Pending Document: ${pendingDocs.join(', ') || 'All core documents uploaded'}

CALM CUSTOMER CARE RESPONSE RULES:
1. UNDERSTAND CONVERSATIONAL INTENT & RESPOND CALMLY & DIRECTLY:
   - IF CUSTOMER ASKS TO TALK LATER / RESCHEDULE (e.g. "call me in the evening", "can you call me later", "busy right now", "talk tomorrow"):
     --> Respond calmly and agreeably: "Sure, no problem at all! What time in the evening works best for you?" Set extracted_intent = "NEEDS_TIME".
   - IF CUSTOMER ASKS WHERE OR HOW TO UPLOAD (e.g. "where should I upload it?", "where do I send it?", "how to submit?"):
     --> Respond clearly: "You can upload it directly through the link sent to your mobile phone or on our website portal under Document Uploads. Would you like me to resend the link?"
   - IF CUSTOMER ASKS BASIC QUESTIONS (e.g. "which bank?", "what is the interest rate?", "what is my EMI?", "when will I get funds?"):
     --> Answer calmly using their pre-approved offer details:
         * Bank Name: "We are calling from Cognis Bank."
         * Rate/EMI: "Your pre-approved offer is ₹${loanPlan.estimatedEMI?.toLocaleString('en-IN') || '16,480'}/month at ${loanPlan.interestRate || 11.5}% interest rate."
         * Timeline: "Once your bank statement is uploaded, funds are disbursed within 24 to 48 hours."
   - IF CUSTOMER AGREES OR SAYS YES (e.g. "yes", "sure", "what details do you need"):
     --> Respond warmly: "We just need your last 6-month bank statement to verify your income. Shall I send you the upload link?"
   - IF CUSTOMER REQUESTS HUMAN MANAGER (e.g. "transfer me to manager", "speak to a human"):
     --> Respond politely: "I understand completely. I will have a senior loan manager contact you shortly." Set requires_human = true.

2. DO NOT USE REPETITIVE ROBOTIC OPENINGS (never repeat "Thank you for confirming that, [Name]"). Speak smoothly like a real calm human executive.
3. Keep response UNDER 2 short, clear sentences (ideal for speech synthesis).
4. Output ONLY valid JSON matching this schema:
{
  "speech_reply": "Calm, natural spoken text Alex will say out loud to the customer",
  "extracted_intent": "INTERESTED | NOT_INTERESTED | NEEDS_TIME | CALLBACK_REQUESTED | READY_TO_APPLY | APPLICATION_IN_PROGRESS | UNKNOWN",
  "document_status_update": { "name": "Document Name or null", "status": "SUBMITTED | PENDING | VERIFIED" },
  "suggested_customer_status": "DOCUMENTS_SUBMITTED | CALLBACK_REQUESTED | INTERESTED | NOT_INTERESTED | null",
  "requires_human": boolean
}
`;

    const conversationPayload = history.map(t => ({
      role: t.role === 'assistant' ? 'assistant' : 'user',
      content: t.text
    }));

    if (userSpeech) {
      conversationPayload.push({ role: 'user', content: userSpeech });
    }

    // Attempt Groq LLM call
    const groqResult = await groqService.chatCompletion(systemPrompt, conversationPayload, true);

    if (groqResult && groqResult.speech_reply) {
      console.log(`[Groq CustomerCare Output]:`, groqResult);
      return {
        speechReply: groqResult.speech_reply,
        extractedIntent: groqResult.extracted_intent || 'INTERESTED',
        documentUpdate: groqResult.document_status_update,
        suggestedStatus: groqResult.suggested_customer_status,
        requiresHuman: Boolean(groqResult.requires_human)
      };
    }

    // Smart Fallback Engine if Groq API is not set
    return this.fallbackSmartIntentEngine({ customer, history, userSpeech, pendingDocs, loan, loanPlan });
  }

  /**
   * Intent-based Fallback Engine
   */
  async fallbackSmartIntentEngine({ customer, history, userSpeech, pendingDocs, loan, loanPlan }) {
    const apiKey = process.env.LLM_API_KEY ? process.env.LLM_API_KEY.replace(/["']/g, '').trim() : null;

    if (apiKey && !apiKey.includes('test_key')) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are Alex, a calm Indian loan customer care representative at Cognis Bank. If user wants to talk later (e.g. evening), agree calmly and ask preferred time. If user asks where/how to do something, answer clearly. If user asks bank name or EMI, answer directly. Output JSON: { "speech_reply": "string", "extracted_intent": "INTERESTED|NOT_INTERESTED|NEEDS_TIME|CALLBACK_REQUESTED", "requires_human": boolean }`
              },
              ...history.map(t => ({ role: t.role === 'assistant' ? 'assistant' : 'user', content: t.text })),
              { role: 'user', content: userSpeech }
            ]
          },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const data = JSON.parse(response.data.choices[0].message.content);
        return {
          speechReply: data.speech_reply,
          extractedIntent: data.extracted_intent || 'INTERESTED',
          requiresHuman: Boolean(data.requires_human)
        };
      } catch (err) {
        console.warn('[Fallback LLM Error]:', err.message);
      }
    }

    // Robust Intent Analyzer
    const textLower = userSpeech.toLowerCase();
    let reply = '';
    let intent = 'INTERESTED';
    let requiresHuman = false;

    // Rescheduling Intent (Evening / Morning / Later / Busy)
    if (textLower.includes('evening') || textLower.includes('morning') || textLower.includes('afternoon') || textLower.includes('later') || textLower.includes('busy') || textLower.includes('call me')) {
      reply = `Sure, no problem at all! What time in the evening works best for you?`;
      intent = 'NEEDS_TIME';
    } 
    // Where / How to Upload Intent
    else if (textLower.includes('where') || textLower.includes('how') || textLower.includes('portal') || textLower.includes('link') || textLower.includes('send')) {
      reply = `You can upload it directly through the link sent to your mobile phone or on our website portal under Document Uploads. Would you like me to resend the link?`;
    } 
    // Bank Name FAQ Intent
    else if (textLower.includes('bank') || textLower.includes('which bank') || textLower.includes('name of bank') || textLower.includes('from where')) {
      reply = `We are calling from Cognis Bank. Would you like me to check your application status?`;
    } 
    // Details Needed Intent
    else if (textLower.includes('what details') || textLower.includes('documents') || textLower.includes('need') || textLower.includes('require')) {
      reply = `We just need your last 6-month bank statement to verify your income. Shall I send you the portal link to upload it?`;
    } 
    // Rate / EMI Intent
    else if (textLower.includes('rate') || textLower.includes('interest') || textLower.includes('emi')) {
      reply = `Your pre-approved ${loan.type} has an estimated EMI of ₹${loanPlan.estimatedEMI?.toLocaleString('en-IN') || '16,480'}/month at ${loanPlan.interestRate || 11.5}% interest rate. Does this EMI plan work for you?`;
    } 
    // Human Manager Intent
    else if (textLower.includes('manager') || textLower.includes('human') || textLower.includes('officer')) {
      reply = `I understand completely. I will have a senior loan manager contact you shortly. Have a wonderful day!`;
      requiresHuman = true;
      intent = 'CALLBACK_REQUESTED';
    } 
    // Agreement / General Affirmation
    else {
      reply = `Got it! Once your ${pendingDocs[0] || 'bank statement'} is uploaded, our team will process your ₹${loan.amount?.toLocaleString('en-IN')} ${loan.type}. Is there anything else I can help you with?`;
    }

    return { speechReply: reply, extractedIntent: intent, requiresHuman };
  }
}

module.exports = new DynamicQuestionEngine();
