const axios = require('axios');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    // Default to 'pNInz6obpgDQGcFmaJgB' (Adam - conversational male) or 'EXAVITQu4vr4xnSDxMaL' (Bella - natural female)
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
  }

  /**
   * Generates ultra-realistic human speech audio buffer using ElevenLabs Multilingual v2
   * @param {string} text
   * @returns {Promise<Buffer|null>}
   */
  async generateSpeech(text) {
    if (!this.apiKey || this.apiKey.includes('your_elevenlabs_api_key')) {
      console.warn('[ElevenLabs] No valid ELEVENLABS_API_KEY set in .env');
      return null;
    }

    try {
      const cleanedApiKey = this.apiKey.replace(/["']/g, '').trim();
      const cleanedVoiceId = (process.env.ELEVENLABS_VOICE_ID || this.voiceId).replace(/["']/g, '').trim();

      console.log(`[ElevenLabs Ultra-Human TTS] Synthesizing speech (Voice ID: ${cleanedVoiceId}) for: "${text.slice(0, 40)}..."`);

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${cleanedVoiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2', // ElevenLabs' most expressive human conversational model
          voice_settings: {
            stability: 0.35,        // Lower stability = higher dynamic emotion & natural pitch variation
            similarity_boost: 0.85, // Preserves natural vocal texture & breathiness
            style: 0.25,            // Adds realistic human emotional inflection & cadence
            use_speaker_boost: true // Enhances warm vocal clarity
          }
        },
        {
          headers: {
            'xi-api-key': cleanedApiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('[ElevenLabs Error]:', error.response?.data ? error.response.data.toString() : error.message);
      return null;
    }
  }
}

module.exports = new ElevenLabsService();
