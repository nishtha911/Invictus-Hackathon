import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2, Bot, User, RefreshCw, Send } from 'lucide-react';
import api from '../../services/api';

export default function WebRtcCallModal({ customer, onClose, onCallCompleted }) {
  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserListening, setIsUserListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [notice, setNotice] = useState('Initializing ElevenLabs Voice Engine & Microphone...');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef([]);
  const currentAudioRef = useRef(null);

  // Helper to play synthesized ElevenLabs speech audio or fallback to Web Speech
  const speakText = async (textToSpeak) => {
    setIsAiSpeaking(true);
    try {
      const res = await api.post('/calls/tts', { text: textToSpeak }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = () => {
          fallbackSpeechSynthesis(textToSpeak, resolve);
        };
        audio.play().catch(() => fallbackSpeechSynthesis(textToSpeak, resolve));
      });
    } catch (err) {
      console.warn('[TTS Fallback] Using Web Speech API:', err.message);
      await new Promise((resolve) => fallbackSpeechSynthesis(textToSpeak, resolve));
    } finally {
      setIsAiSpeaking(false);
      startMicrophoneListening();
    }
  };

  const fallbackSpeechSynthesis = (text, callback) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => callback();
      utterance.onerror = () => callback();
      window.speechSynthesis.speak(utterance);
    } else {
      callback();
    }
  };

  // Web Speech Microphone Recognition setup
  const startMicrophoneListening = () => {
    if (muted) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setNotice('Microphone speech recognition not supported in this browser. Use text input below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsUserListening(true);
        setNotice('🎙️ Microphone active! Speak naturally now...');
      };

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        console.log('[User Microphoned Speech]:', spokenText);
        if (spokenText && spokenText.trim()) {
          handleUserSpeechTurn(spokenText.trim());
        }
      };

      recognition.onerror = (e) => {
        console.warn('[Speech Recognition Warning]:', e.error);
        setIsUserListening(false);
      };

      recognition.onend = () => {
        setIsUserListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Mic Start Error]:', err);
    }
  };

  // Process user speech turn for THIS specific customer
  const handleUserSpeechTurn = async (userText) => {
    if (!userText || !userText.trim()) return;

    const userTurn = { role: 'user', text: userText, timestamp: new Date() };
    transcriptRef.current = [...transcriptRef.current, userTurn];
    setTranscript([...transcriptRef.current]);

    setNotice('🤖 AI Assistant analyzing your response...');

    try {
      const res = await api.post('/calls/web-conversation', {
        customerId: customer._id,
        customerName: customer.name,
        history: transcriptRef.current,
        userSpeech: userText
      });

      const replyText = res.data.replyText;

      const aiTurn = { role: 'assistant', text: replyText, timestamp: new Date() };
      transcriptRef.current = [...transcriptRef.current, aiTurn];
      setTranscript([...transcriptRef.current]);

      // Speak reply out loud with ElevenLabs Voice
      await speakText(replyText);
    } catch (err) {
      console.error('Conversation turn error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initCall = async () => {
      try {
        const configRes = await api.get(`/calls/web-config/${customer._id || encodeURIComponent(customer.name)}`);
        const { firstMessage } = configRes.data.data;

        if (!isMounted) return;

        setConnecting(false);
        setConnected(true);

        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        const initialTurn = { role: 'assistant', text: firstMessage, timestamp: new Date() };
        transcriptRef.current = [initialTurn];
        setTranscript([initialTurn]);

        // Greet user out loud using ElevenLabs Voice
        await speakText(firstMessage);

      } catch (err) {
        console.error('[Call Init Error]:', err);
        if (isMounted) {
          setConnecting(false);
          setConnected(true);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [customer]);

  const handleToggleMute = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    if (nextMute && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    } else {
      startMicrophoneListening();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleUserSpeechTurn(manualInput.trim());
      setManualInput('');
    }
  };

  const handleFinishCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (currentAudioRef.current) {
      try { currentAudioRef.current.pause(); } catch (e) {}
    }

    try {
      setNotice('Processing post-call LLM analysis & updating database...');
      await api.post('/calls/complete-web-call', {
        customerId: customer._id,
        customerName: customer.name,
        transcript: transcriptRef.current,
        duration: callDuration || 30
      });
      if (onCallCompleted) onCallCompleted();
    } catch (err) {
      console.error('Failed to save web call:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Live AI Voice Call (Target Lead: {customer.name})</h2>
              <p className="text-xs text-slate-300">
                Customer: <span className="font-semibold text-white">{customer.name}</span> ({customer.loan?.type})
              </p>
            </div>
          </div>
          <button onClick={handleFinishCall} className="text-slate-400 hover:text-white p-1 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Card */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          <div className="bg-slate-900 text-white p-6 rounded-2xl text-center space-y-3 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            
            <div className="relative z-10">
              {connecting ? (
                <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting Voice Engine for {customer.name}...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Audio Connected ({customer.name})
                  </div>
                  <h3 className="text-3xl font-extrabold font-mono tracking-wider">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isAiSpeaking
                      ? '🔊 ElevenLabs Voice Speaking...'
                      : isUserListening
                      ? '🎙️ Microphone Active! Speak into your laptop mic now.'
                      : 'Listening paused'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {notice && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs font-semibold text-center">
              {notice}
            </div>
          )}

          {/* Dialogue Stream */}
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1.5">
              Live Transcript & Speech Stream
            </h4>
            {transcript.map((t, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 text-xs p-3 rounded-2xl ${
                  t.role === 'assistant'
                    ? 'bg-blue-50 text-blue-950 border border-blue-100'
                    : 'bg-slate-100 text-slate-900 font-medium'
                }`}
              >
                {t.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <User className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block text-[11px] uppercase tracking-wide text-slate-500">
                    {t.role === 'assistant' ? 'Alex (ElevenLabs Voice)' : customer.name}
                  </span>
                  <p className="mt-0.5 text-sm">{t.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={`Speak or type what ${customer.name} says...`}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Speak
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-between items-center px-6">
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              muted
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{muted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          <button
            onClick={handleFinishCall}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call & Analyze</span>
          </button>
        </div>

      </div>
    </div>
  );
}
