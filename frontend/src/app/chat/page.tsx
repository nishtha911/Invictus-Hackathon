"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Zap, CheckCircle, Paperclip } from "lucide-react";
import {
  sendChatMessage as sendMessage,
  fetchRecommendations as getRecommendations,
  UIComponent,
  ChatMessage,
} from "@/lib/api/chat";
import { useStore } from "@/store/app-store";
import { toast } from "sonner";

// ── MCQ Option Card ──────────────────────────────────────────────
function MCQOption({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass glass-hover px-4 py-3 text-sm font-semibold text-slate-200 text-left transition-all hover:text-white"
    >
      {label}
    </button>
  );
}

// ── Slider Input ─────────────────────────────────────────────────
function SliderInput({ comp, onAnswer }: { comp: UIComponent; onAnswer: (v: string) => void }) {
  const min = comp.min_value ?? 0;
  const max = comp.max_value ?? 100;
  const step = comp.step ?? 1;
  const [val, setVal] = useState<number>((comp.default_value as number) ?? min);
  const pct = ((val - min) / (max - min)) * 100;

  const fmt = (n: number) => {
    if (comp.unit === "₹") {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString("en-IN")}`;
    }
    return `${n.toLocaleString("en-IN")}${comp.unit ? " " + comp.unit : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{fmt(min)}</span>
        <span className="text-xl font-black text-white">{fmt(val)}</span>
        <span className="text-xs text-slate-500">{fmt(max)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/8">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#22d3ee)" }}
        />
        <input
          type="range"
          min={min} max={max} step={step}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-indigo-400 bg-indigo-950 shadow-lg"
          style={{ left: `${pct}%` }}
        />
      </div>
      <button onClick={() => onAnswer(String(val))} className="btn-primary w-full justify-center">
        Confirm <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Text / Number Input ──────────────────────────────────────────
function TextInput({ comp, onAnswer }: { comp: UIComponent; onAnswer: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="glass glass-hover px-3 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0"
        onClick={() => toast.info("Document upload (OCR) coming soon!")}
        title="Upload Document"
      >
        <Paperclip className="w-5 h-5" />
      </button>
      <input
        type={comp.type === "number_input" ? "number" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={comp.placeholder ?? "Type your answer..."}
        className="input flex-1"
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onAnswer(val.trim()); }}
        autoFocus
      />
      <button
        onClick={() => { if (val.trim()) onAnswer(val.trim()); }}
        className="btn-primary px-4"
        disabled={!val.trim()}
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Yes / No ─────────────────────────────────────────────────────
function YesNo({ onAnswer }: { onAnswer: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      <button onClick={() => onAnswer("yes")} className="flex-1 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-bold hover:bg-emerald-500/20 transition-all">Yes</button>
      <button onClick={() => onAnswer("no")}  className="flex-1 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-bold hover:bg-rose-500/20 transition-all">No</button>
    </div>
  );
}

// ── UI Component Switcher ────────────────────────────────────────
function InputRenderer({ comp, onAnswer }: { comp: UIComponent; onAnswer: (v: string) => void }) {
  if (comp.type === "mcq" && comp.options) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {comp.options.map((o) => <MCQOption key={o.value} label={o.label} value={o.value} onClick={() => onAnswer(o.value)} />)}
      </div>
    );
  }
  if (comp.type === "yes_no") return <YesNo onAnswer={onAnswer} />;
  if (comp.type === "slider") return <SliderInput comp={comp} onAnswer={onAnswer} />;
  return <TextInput comp={comp} onAnswer={onAnswer} />;
}

// ── Main Chat Page ───────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const {
    sessionId, messages, currentQuestion,
    completeness, isComplete,
    addMessages, setCurrentQuestion, setCompleteness,
    setRecommendations,
  } = useStore();

  const [sending, setSending] = useState(false);
  const [fetching, setFetching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-fetch if complete
  useEffect(() => {
    if (isComplete && sessionId && !fetching) {
      handleGetRecommendations();
    }
  }, [isComplete]); // eslint-disable-line

  const handleAnswer = useCallback(async (answer: string) => {
    if (!sessionId || sending) return;
    setSending(true);

    const userMsg: ChatMessage = { role: "user", content: answer };
    addMessages([userMsg]);
    setCurrentQuestion(null);

    try {
      const res = await sendMessage(sessionId, answer, currentQuestion?.field_target ?? null);
      addMessages(res.messages);
      setCompleteness(res.session_state.completeness_pct, res.session_state.current_phase, res.session_state.is_complete);

      if (res.session_state.is_complete || res.session_state.completeness_pct >= 80) {
        await handleGetRecommendations(res.session_state.session_id);
        return;
      }

      const nextQ = res.messages.find((m) => m.role === "assistant" && m.ui_component)
        ?? res.messages.filter((m) => m.role === "assistant").pop()
        ?? null;
      setCurrentQuestion(nextQ ?? null);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong — please try again.");
    } finally {
      setSending(false);
    }
  }, [sessionId, sending, currentQuestion, addMessages, setCurrentQuestion, setCompleteness]); // eslint-disable-line

  async function handleGetRecommendations(sid?: string) {
    const id = sid ?? sessionId;
    if (!id) return;
    setFetching(true);
    toast.loading("Matching your profile to loan products...", { id: "fetch" });
    try {
      const res = await getRecommendations(id);
      setRecommendations(res.recommendations);
      toast.success("Recommendations ready!", { id: "fetch" });
      router.push("/results");
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch recommendations. Please retry.", { id: "fetch" });
      setFetching(false);
    }
  }

  const hasQuestion = currentQuestion !== null;

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-base/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="btn-ghost p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-white">DhanSetu AI Advisor</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-slate-500 font-mono">
              {sessionId?.slice(0, 12)}...
            </div>
            <div className="text-xs font-bold text-indigo-300">{completeness}% complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mx-4 mb-3 rounded-none" style={{ borderRadius: 0 }}>
          <div className="progress-fill" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        {messages.map((msg: ChatMessage, i: number) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
            style={{ animationDelay: `${i * 0.02}s` }}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "glass text-slate-200 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mr-2 mt-1 shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="dot-bounce" />
                <span className="dot-bounce" />
                <span className="dot-bounce" />
              </div>
            </div>
          </div>
        )}

        {fetching && (
          <div className="flex justify-center py-4">
            <div className="badge badge-indigo animate-pulse">
              <Zap className="w-3 h-3" /> Matching to loan products...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ──────────────────────────────────────────── */}
      {!fetching && hasQuestion && !sending && currentQuestion?.ui_component && (
        <div className="sticky bottom-0 bg-base/95 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
            {currentQuestion.content && (
              <p className="text-xs text-slate-500 font-medium truncate">{currentQuestion.content}</p>
            )}
            <InputRenderer comp={currentQuestion.ui_component} onAnswer={handleAnswer} />
          </div>
        </div>
      )}

      {/* Skip to results */}
      {!fetching && !sending && sessionId && completeness >= 50 && (
        <div className="text-center pb-4">
          <button
            onClick={() => handleGetRecommendations()}
            className="btn-ghost text-xs text-slate-600 hover:text-indigo-400"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Skip — get my recommendations now
          </button>
        </div>
      )}
    </div>
  );
}
