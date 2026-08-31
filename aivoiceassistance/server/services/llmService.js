const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.LLM_API_KEY;
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini';
    this.isMockMode = !this.apiKey || this.apiKey.includes('test_key');
  }

  /**
   * Analyzes call transcript and generates structured JSON output
   * @param {Array|string} transcript
   * @param {Object} customerContext
   */
  async analyzeTranscript(transcript, customerContext) {
    console.log(`[LLMService] Analyzing transcript. Mock mode: ${this.isMockMode}`);

    const formattedTranscript = Array.isArray(transcript)
      ? transcript.map(t => `${t.role}: ${t.text}`).join('\n')
      : transcript;

    if (this.isMockMode || !formattedTranscript) {
      return this.generateMockAnalysis(formattedTranscript, customerContext);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert AI Analyst for a financial loan platform. Analyze the provided transcript between an AI voice assistant and a loan applicant. Output JSON matching this strict schema:
{
  "summary": "Short 1-2 sentence summary of conversation",
  "intent": "INTERESTED | NOT_INTERESTED | NEEDS_TIME | CALLBACK_REQUESTED | READY_TO_APPLY | APPLICATION_IN_PROGRESS | UNKNOWN",
  "sentiment": "POSITIVE | NEUTRAL | NEGATIVE",
  "outcome": "FOLLOW_UP_REQUIRED | COMPLETED | ESCALATED_TO_HUMAN | UNREACHABLE",
  "nextAction": "Short text of next logical action step",
  "followUpRequired": boolean,
  "suggestedFollowUp": "ISO-8601 date string or null",
  "requiresHuman": boolean,
  "documentUpdates": [
    { "name": "Document Name", "status": "SUBMITTED | PENDING | VERIFIED | REJECTED" }
  ]
}`
            },
            {
              role: 'user',
              content: `Customer Context:
Name: ${customerContext.name}
Loan Type: ${customerContext.loanType}
Pending Documents: ${customerContext.pendingDocuments?.join(', ')}

Call Transcript:
${formattedTranscript}`
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return this.validateAndFormatAnalysis(parsed);
    } catch (error) {
      console.error('[LLMService Error] Transcript analysis failed:', error.message);
      return this.generateMockAnalysis(formattedTranscript, customerContext);
    }
  }

  validateAndFormatAnalysis(data) {
    const validIntents = ['INTERESTED', 'NOT_INTERESTED', 'NEEDS_TIME', 'CALLBACK_REQUESTED', 'READY_TO_APPLY', 'APPLICATION_IN_PROGRESS', 'UNKNOWN'];
    const validSentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

    return {
      summary: data.summary || 'Call completed successfully.',
      intent: validIntents.includes(data.intent) ? data.intent : 'INTERESTED',
      sentiment: validSentiments.includes(data.sentiment) ? data.sentiment : 'NEUTRAL',
      outcome: data.outcome || 'FOLLOW_UP_REQUIRED',
      nextAction: data.nextAction || 'Follow up with customer as scheduled',
      followUpRequired: data.followUpRequired !== undefined ? Boolean(data.followUpRequired) : true,
      suggestedFollowUp: data.suggestedFollowUp ? new Date(data.suggestedFollowUp) : new Date(Date.now() + 86400000),
      requiresHuman: Boolean(data.requiresHuman),
      documentUpdates: Array.isArray(data.documentUpdates) ? data.documentUpdates : []
    };
  }

  generateMockAnalysis(transcript, customerContext) {
    const textLower = (transcript || '').toLowerCase();
    
    let intent = 'INTERESTED';
    let sentiment = 'POSITIVE';
    let requiresHuman = false;
    let nextAction = 'Check uploaded bank statement tomorrow';

    if (textLower.includes('not interested') || textLower.includes('cancel')) {
      intent = 'NOT_INTERESTED';
      sentiment = 'NEGATIVE';
      nextAction = 'Mark customer as not interested and disable auto follow-ups';
    } else if (textLower.includes('human') || textLower.includes('agent') || textLower.includes('manager')) {
      requiresHuman = true;
      nextAction = 'Transfer lead to human loan officer for manual review';
    }

    return {
      summary: `Automated call completed with ${customerContext.name || 'customer'}. Customer expressed ${intent.toLowerCase().replace('_', ' ')} interest in ${customerContext.loanType || 'loan'}.`,
      intent,
      sentiment,
      outcome: requiresHuman ? 'REQUIRES_HUMAN' : 'FOLLOW_UP_REQUIRED',
      nextAction,
      followUpRequired: intent !== 'NOT_INTERESTED',
      suggestedFollowUp: new Date(Date.now() + 86400000 * 2), // in 2 days
      requiresHuman,
      documentUpdates: customerContext.pendingDocuments?.length > 0 ? [
        { name: customerContext.pendingDocuments[0], status: 'SUBMITTED' }
      ] : []
    };
  }
}

module.exports = new LLMService();
