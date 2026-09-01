"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";
import {
  ArrowLeft, RefreshCw, Bot, User, PhoneOff, Clock, TrendingUp, AlertTriangle,
} from "lucide-react";
import { fetchVoiceCalls, VoiceCallRecord } from "@/lib/api/voice";
import { formatINR } from "@/lib/utils/currency";

const SENTIMENT_STYLES: Record<string, string> = {
  POSITIVE: "bg-[#E8F5F1] text-[#1F7A63] border-emerald-200",
  NEUTRAL: "bg-slate-100 text-slate-600 border-slate-200",
  NEGATIVE: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function VoiceCallLogPage() {
  const router = useRouter();
  const { role } = useJourneyStore();
  const [mounted, setMounted] = useState(false);
  const [calls, setCalls] = useState<VoiceCallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted && role !== "employee") router.push("/login");
  }, [mounted, role, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setCalls(await fetchVoiceCalls());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!mounted || role !== "employee") return;
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [mounted, role, load]);

  if (!mounted || role !== "employee") {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-sm text-slate-500 font-medium">Checking authorization…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#132443] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">AI Voice CRM</span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#132443] tracking-tight">Call Log</h1>
            </div>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <p className="text-xs text-slate-500">
          AI follow-up calls run in the browser (no phone number) and are logged here with an LLM summary,
          sentiment and next action. Start a call from any lead in the dashboard.
        </p>

        {calls.length === 0 && !loading && (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center text-sm text-slate-500">
            No calls yet. Open a lead in the dashboard and click <strong>Call with AI</strong>.
          </div>
        )}

        <div className="space-y-3">
          {calls.map((c) => (
            <div key={c.call_id} className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === c.call_id ? null : c.call_id)}
                className="w-full flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-[#F5F7FA] transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#132443]">{c.customer_name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{c.call_id}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.loan_type} · {formatINR(c.loan_amount)} · {new Date(c.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${SENTIMENT_STYLES[c.sentiment] || SENTIMENT_STYLES.NEUTRAL}`}>
                    {c.sentiment}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {c.intent?.replace(/_/g, " ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                    <Clock className="h-3 w-3" />
                    {Math.floor(c.duration_seconds / 60)}:{String(c.duration_seconds % 60).padStart(2, "0")}
                  </span>
                </div>
              </button>

              {expanded === c.call_id && (
                <div className="border-t border-[#E2E8F0] p-4 sm:p-5 space-y-4 bg-[#F5F7FA]/40">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#132443]">Summary</span>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.summary}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-[#F0FDF4] p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F7A63] flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Next action
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.next_action}</p>
                    </div>
                  </div>

                  {c.requires_human && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Escalated — customer asked for a human loan officer.</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <PhoneOff className="h-3 w-3" /> Transcript
                    </span>
                    <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white p-3">
                      {(c.transcript || []).map((t, i) => (
                        <div key={i} className={`flex gap-2 text-xs ${t.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
                            t.role === "assistant" ? "bg-[#132443] text-white" : "bg-[#E8F5F1] text-[#1F7A63]"
                          }`}>
                            {t.role === "assistant" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          </div>
                          <div className={`max-w-[80%] rounded-xl px-3 py-1.5 ${
                            t.role === "assistant" ? "bg-[#F5F7FA] text-[#132443]" : "bg-[#1F7A63] text-white"
                          }`}>
                            {t.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
