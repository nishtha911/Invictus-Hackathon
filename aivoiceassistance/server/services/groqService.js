const axios = require('axios');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  /**
   * Invoke Groq LLM with system prompt & user messages
   * @param {string} systemPrompt
   * @param {Array|string} userMessages
   * @param {boolean} jsonMode
   */
  async chatCompletion(systemPrompt, userMessages, jsonMode = false) {
    const apiKey = this.apiKey ? this.apiKey.replace(/["']/g, '').trim() : null;

    if (!apiKey || apiKey.includes('your_groq')) {
      console.warn('[GroqService] GROQ_API_KEY not configured or placeholder. Falling back to OpenAI / LLM service.');
      return null;
    }

    try {
      const messages = [{ role: 'system', content: systemPrompt }];

      if (Array.isArray(userMessages)) {
        messages.push(...userMessages);
      } else {
        messages.push({ role: 'user', content: userMessages });
      }

      console.log(`[Groq LLM Inbound Request] Model: ${this.model}`);

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages,
          temperature: 0.6,
          max_tokens: 350,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      return jsonMode ? JSON.parse(content) : content;
    } catch (error) {
      console.error('[Groq Error]:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new GroqService();
