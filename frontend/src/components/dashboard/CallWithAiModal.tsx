"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Mic, MicOff, PhoneOff, Bot, User, Loader2, Send, Volume2,
  CheckCircle2, AlertTriangle, MicOff as MicDenied,
} from "lucide-react";
import {
  CallContext, TranscriptTurn, CallAnalysis,
  fetchOpeningLine, fetchTurn, completeCall, fetchSpeechAudio,
  localOpening, localTurn, localAnalysis,
} from "@/lib/api/voice";
import { SalesDashboardLeadItem } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";
import { toast } from "sonner";

type Phase = "connecting" | "live" | "analyzing" | "done";

interface CallWithAiModalProps {
  lead: SalesDashboardLeadItem;
  onClose: () => void;
  onCallLogged?: () => void;
}

// Browser Web Speech API — free, no dependency. Returns null when unsupported.
function getRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function CallWithAiModal({ lead, onClose, onCallLogged }: CallWithAiModalProps) {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [muted, setMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [duration, setDuration] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [notice, setNotice] = useState("Connecting the AI voice agent…");
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [micState, setMicState] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");

  const contextRef = useRef<CallContext | null>(null);
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const recognitionRef = useRef<ReturnType<typeof getRecognition>>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mutedRef = useRef(false);
  const endedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handleUserTurnRef = useRef<(t: string) => void>(() => {});

  const localContext = useCallback((): CallContext => ({
    lead_id: lead.id,
    name: lead.customer_name || "there",
    phone: lead.phone,
    loan_type: lead.loan_category || "loan",
    loan_amount: lead.requested_amount || 0,
    emi: lead.estimated_emi,
    briefing: lead.ai_briefing,
    pending: ["6-month bank statement"],
  }), [lead]);

  const pushTurn = useCallback((turn: TranscriptTurn) => {
    transcriptRef.current = [...transcriptRef.current, turn];
    setTranscript([...transcriptRef.current]);
  }, []);

  const startListening = useCallback(() => {
    if (mutedRef.current || endedRef.current) return;
    // A recognition instance can't be restarted — stop any stale one first.
    try { recognitionRef.current?.abort(); } catch { /* noop */ }
    const rec = getRecognition();
    if (!rec) {
      setMicState("unsupported");
      setNotice("This browser has no speech recognition — type the customer's replies below.");
      return;
    }
    rec.continuous = false;
    rec.interimResults = false;
    // en-US has the most reliable Chrome speech-model coverage; en-IN can silently
    // fail to load its language pack on some machines.
    rec.lang = "en-US";
    rec.onstart = () => { setListening(true); setMicState("granted"); setNotice("Listening — speak now, or press the mic again to stop."); };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicState("denied");
        setNotice("Microphone blocked by the browser — click \"Allow Microphone\" below, or type the reply.");
      } else if (e.error === "no-speech") {
        setNotice("Didn't catch that — press the mic to try again, or type the reply.");
      } else if (e.error !== "aborted") {
        setNotice(`Mic error (${e.error}) — press the mic to retry, or type the reply.`);
      }
    };
    rec.onend = () => setListening(false);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const said = e.results?.[0]?.[0]?.transcript?.trim();
      if (said) handleUserTurnRef.current(said);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if called twice in the same tick — retry once, shortly after.
      setTimeout(() => { try { rec.start(); } catch { /* give up silently */ } }, 150);
    }
  }, []);

  /** Explicit mic-permission prompt — more reliable across browsers than relying
   *  on SpeechRecognition.start() alone to trigger it. */
  const requestMicAccess = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // we only needed the permission grant
      setMicState((prev) => (prev === "denied" ? "unknown" : prev));
      setNotice("Microphone enabled — press the mic button to speak.");
      startListening();
    } catch {
      setMicState("denied");
      setNotice("Microphone access was denied. You can still type the customer's replies below.");
    }
  }, [startListening]);

  const speak = useCallback(async (text: string) => {
    const fallbackTts = (done: () => void) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.02;
        u.onend = done;
        u.onerror = () => done();
        window.speechSynthesis.speak(u);
      } else {
        done();
      }
    };
    setAiSpeaking(true);
    const url = await fetchSpeechAudio(text);
    const speakOnce = new Promise<void>((resolve) => {
      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => fallbackTts(resolve);
        audio.play().catch(() => fallbackTts(resolve));
      } else {
        fallbackTts(resolve);
      }
    });
    // Chrome's speechSynthesis can silently hang (a known bug, especially on long
    // text or a backgrounded tab) and never fire onend — never let that block the
    // mic from opening.
    const timeoutGuard = new Promise<void>((resolve) => {
      const ms = Math.max(4000, text.length * 90);
      setTimeout(resolve, ms);
    });
    await Promise.race([speakOnce, timeoutGuard]);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setAiSpeaking(false);
    if (!endedRef.current && micState !== "denied" && micState !== "unsupported") startListening();
  }, [startListening, micState]);

  const handleUserTurn = useCallback(async (text: string) => {
    if (!text.trim() || endedRef.current) return;
    const ctx = contextRef.current || localContext();
    pushTurn({ role: "user", text });
    setNotice("AI agent is thinking…");
    let reply: { speech_reply: string; requires_human: boolean };
    try {
      const res = await fetchTurn(ctx, transcriptRef.current, text);
      reply = { speech_reply: res.speech_reply, requires_human: res.requires_human };
    } catch {
      reply = localTurn(text); // slow / offline — keep the conversation moving
    }
    pushTurn({ role: "assistant", text: reply.speech_reply });
    if (reply.requires_human) setNotice("Customer asked for a human — flagged for a manager call-back.");
    await speak(reply.speech_reply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushTurn, speak, localContext]);

  useEffect(() => { handleUserTurnRef.current = handleUserTurn; }, [handleUserTurn]);

  // Prime the mic permission as soon as the call opens, so we know upfront
  // whether we can listen at all instead of finding out mid-conversation.
  useEffect(() => {
    if (!getRecognition()) { setMicState("unsupported"); return; }
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    navigator.permissions.query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (status.state === "granted") setMicState("granted");
        else if (status.state === "denied") setMicState("denied");
      })
      .catch(() => { /* Permissions API not supported for "microphone" in this browser */ });
  }, []);

  // ── init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let opening: string;
      try {
        const res = await fetchOpeningLine({
          id: lead.id,
          customer_name: lead.customer_name,
          phone: lead.phone,
          loan_category: lead.loan_category,
          requested_amount: lead.requested_amount,
          estimated_emi: lead.estimated_emi,
          ai_briefing: lead.ai_briefing,
        });
        contextRef.current = res.context;
        opening = res.opening_line;
      } catch {
        // Backend slow / unreachable — start the call locally, never hang.
        contextRef.current = localContext();
        opening = localOpening(localContext());
      }
      if (cancelled) return;
      setPhase("live");
      setNotice("");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      pushTurn({ role: "assistant", text: opening });
      await speak(opening);
    })();
    return () => {
      cancelled = true;
      endedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      try { audioRef.current?.pause(); } catch { /* noop */ }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead]);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [transcript]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) { try { recognitionRef.current?.stop(); } catch { /* noop */ } }
    else startListening();
  };

  const endCall = async () => {
    if (phase === "analyzing" || phase === "done") { onClose(); return; }
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    try { audioRef.current?.pause(); } catch { /* noop */ }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();

    setPhase("analyzing");
    setNotice("Analysing the call…");
    try {
      const { analysis: a } = await completeCall(
        contextRef.current || localContext(), transcriptRef.current, duration || 30,
      );
      setAnalysis(a);
      onCallLogged?.();
    } catch {
      // Backend slow / down — always show a card so the officer has an action item.
      setAnalysis(localAnalysis(transcriptRef.current));
      toast.message("Analysed locally — backend was unavailable.");
    }
    setPhase("done");
  };

  const mmss = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={endCall}
          className="fixed inset-0 bg-[#132443]/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          className="relative w-full max-w-lg rounded-2xl border border-[#E4E9F0] bg-white shadow-lg overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#132443] px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-emerald-300">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">AI Voice Call · {lead.customer_name}</h3>
                <p className="text-[11px] text-slate-300">
                  {lead.loan_category} · {formatINR(lead.requested_amount)}
                </p>
              </div>
            </div>
            <button onClick={endCall} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {phase === "done" && analysis ? (
            /* ── Post-call summary ── */
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2 text-[#1F7A63]">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-bold">Call complete — logged to the pipeline</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Duration", mmss],
                  ["Intent", analysis.intent.replace(/_/g, " ")],
                  ["Sentiment", analysis.sentiment],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[#E4E9F0] bg-[#F5F7FA] p-2.5">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">{k}</span>
                    <span className="block text-xs font-bold text-[#132443] mt-0.5">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#E4E9F0] bg-[#F5F7FA] p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#132443]">Summary</span>
                <p className="text-xs text-slate-600 leading-relaxed">{analysis.summary}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-[#F0FDF4] p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A63]">Next action</span>
                <p className="text-xs text-slate-700 leading-relaxed">{analysis.next_action}</p>
              </div>
              {analysis.requires_human && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Customer requested a human — assign a loan officer for a manual call-back.</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-[#1F7A63] hover:bg-[#186350] py-2.5 text-xs font-semibold text-white transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Live call ── */
            <>
              <div className="px-5 pt-4">
                <div className="rounded-xl bg-[#F5F7FA] border border-[#E4E9F0] p-4 text-center space-y-1.5">
                  {phase === "connecting" ? (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5F1] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1F7A63]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] animate-pulse" /> Live
                      </span>
                      <div className="text-2xl font-bold font-mono text-[#132443]">{mmss}</div>
                      <p className="text-[11px] font-medium text-slate-500 inline-flex items-center gap-1.5">
                        {phase === "analyzing" ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Analysing…</>
                        ) : aiSpeaking ? (
                          <><Volume2 className="h-3 w-3 text-[#1F7A63]" /> AI agent speaking…</>
                        ) : listening ? (
                          <><Mic className="h-3 w-3 text-[#1F7A63] animate-pulse" /> Listening for the customer…</>
                        ) : micState === "denied" || micState === "unsupported" ? (
                          <><MicDenied className="h-3 w-3 text-rose-500" /> Mic off — use the text box below</>
                        ) : (
                          "Ready"
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {(micState === "denied" || micState === "unsupported") && (
                <div className="mx-5 mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[11px] font-medium text-rose-700 text-center space-y-1.5">
                  <p>
                    {micState === "denied"
                      ? "Microphone access is blocked. Type what the customer says below — the AI still replies."
                      : "This browser has no speech recognition (try Chrome or Edge). Type the customer's replies below."}
                  </p>
                  {micState === "denied" && (
                    <button
                      type="button"
                      onClick={() => void requestMicAccess()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors"
                    >
                      <Mic className="h-3 w-3" /> Allow Microphone
                    </button>
                  )}
                </div>
              )}

              {notice && (
                <p className="mx-5 mt-3 rounded-lg bg-[#F0FDF9] border border-emerald-100 px-3 py-2 text-[11px] font-medium text-[#186350] text-center">
                  {notice}
                </p>
              )}

              {/* Transcript */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[180px]">
                {transcript.map((t, i) => (
                  <div key={i} className={`flex gap-2.5 text-xs ${t.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${
                      t.role === "assistant" ? "bg-[#132443] text-white" : "bg-[#E8F5F1] text-[#1F7A63]"
                    }`}>
                      {t.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                      t.role === "assistant"
                        ? "bg-[#F5F7FA] text-[#132443] rounded-tl-sm"
                        : "bg-[#1F7A63] text-white rounded-tr-sm"
                    }`}>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Manual fallback input */}
              <form
                onSubmit={(e) => { e.preventDefault(); if (manualInput.trim()) { void handleUserTurn(manualInput.trim()); setManualInput(""); } }}
                className="flex gap-2 border-t border-[#E4E9F0] p-3"
              >
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Or type the customer's reply…"
                  className="flex-1 rounded-lg border border-[#E4E9F0] bg-[#F5F7FA] px-3 py-2 text-xs focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63]"
                />
                <button type="submit" className="rounded-lg bg-[#132443] px-3 py-2 text-white hover:bg-[#1d3660] transition-colors">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Controls */}
              <div className="flex items-center justify-between border-t border-[#E4E9F0] bg-[#F5F7FA] px-5 py-3">
                <button
                  onClick={toggleMute}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    muted ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-white border border-[#E4E9F0] text-[#132443] hover:bg-slate-50"
                  }`}
                >
                  {muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={endCall}
                  disabled={phase === "analyzing"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60"
                >
                  {phase === "analyzing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneOff className="h-3.5 w-3.5" />}
                  End & analyse
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
