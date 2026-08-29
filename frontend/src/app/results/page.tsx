"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Zap, Shield, Star, TrendingDown } from "lucide-react";
import { useStore } from "@/store/app-store";
import { Recommendation } from "@/lib/api/chat";

const STATUS_COLORS = {
  eligible: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", text: "#6ee7b7", label: "Eligible" },
  conditionally_eligible: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", text: "#fde68a", label: "Conditional" },
  not_eligible: { bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.3)", text: "#fda4af", label: "Review Required" },
};

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const r = 32, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#fb7185";

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="score-ring">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white">{pct}</span>
        <span className="text-[9px] text-slate-500 font-semibold">MATCH</span>
      </div>
    </div>
  );
}

function RecommendationCard({
  rec,
  isBest,
  onSelect,
}: {
  rec: Recommendation;
  isBest: boolean;
  onSelect: () => void;
}) {
  const status = STATUS_COLORS[rec.computed_terms.eligibility_status] ?? STATUS_COLORS.not_eligible;
  const emi = rec.computed_terms.estimated_emi;
  const rate = rec.computed_terms.interest_rate_pct;
  const months = rec.computed_terms.tenure_months;
  const years = Math.round(months / 12);

  const fmtINR = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <div
      className={`glass glass-hover rounded-2xl overflow-hidden transition-all ${
        isBest ? "ring-1 ring-indigo-500/40" : ""
      }`}
    >
      {isBest && (
        <div className="px-5 py-2 flex items-center gap-2 border-b border-indigo-500/20"
          style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.2), rgba(34,211,238,0.1))" }}>
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-indigo-300 tracking-wide">BEST MATCH</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-lg mb-1 truncate">{rec.product_name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="badge text-xs font-bold px-2.5 py-0.5"
                style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.text }}
              >
                {status.label}
              </span>
              {rec.ai_explanation.numbers_verified && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
          <ScoreRing score={rec.match_score} />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="text-lg font-black text-indigo-300">{rate}%</div>
            <div className="text-[10px] text-slate-500 font-medium">Interest Rate</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)" }}>
            <div className="text-sm font-black text-cyan-300">{fmtINR(emi)}<span className="text-[10px] font-normal text-slate-500">/mo</span></div>
            <div className="text-[10px] text-slate-500 font-medium">EMI</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-lg font-black text-white">{years}y</div>
            <div className="text-[10px] text-slate-500 font-medium">Tenure</div>
          </div>
        </div>

        {/* AI explanation */}
        {rec.ai_explanation.summary_text && (
          <p className="text-xs text-slate-400 leading-relaxed mb-4 border-l-2 border-indigo-500/30 pl-3">
            {rec.ai_explanation.summary_text}
          </p>
        )}

        <button onClick={onSelect} className="btn-primary w-full justify-center text-sm py-3">
          I&apos;m Interested — Apply Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { recommendations, sessionId, setSelectedRec, completeness } = useStore();
  const [shown, setShown] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!sessionId) { router.push("/"); return; }
    if (recommendations.length === 0) { router.push("/chat"); return; }
    // Stagger display
    recommendations.forEach((r, i) => {
      setTimeout(() => setShown((prev) => [...prev, r]), i * 120);
    });
  }, []); // eslint-disable-line

  const handleSelect = (rec: Recommendation) => {
    setSelectedRec(rec);
    router.push("/apply");
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-base/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/chat")} className="btn-ghost p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="font-black text-white">Your Loan Matches</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">{recommendations.length} products matched</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ── Profile summary ─────────────────────────────────── */}
        <div className="mb-8 space-y-2 animate-fade-up">
          <div className="flex items-center gap-2 badge badge-indigo w-fit">
            <TrendingDown className="w-3 h-3" /> Policy-Grounded Matching
          </div>
          <h1 className="text-3xl font-black text-white">
            We found <span className="text-gradient">{recommendations.length} matched products</span> for you
          </h1>
          <p className="text-slate-400 text-sm">
            Profile completeness: <span className="text-white font-semibold">{completeness}%</span> · EMIs are verified mathematically · Sorted by match score
          </p>
        </div>

        {/* ── Eligible banner ─────────────────────────────────── */}
        {recommendations.some(r => r.computed_terms.eligibility_status === "eligible") && (
          <div className="glass mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 border border-emerald-500/20 animate-fade-up animate-delay-1">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-slate-300">
              <strong className="text-emerald-400">You are eligible</strong> for {recommendations.filter(r => r.computed_terms.eligibility_status === "eligible").length} product(s). 
              All EMI calculations are deterministic and cross-verified against your income and FOIR.
            </p>
          </div>
        )}

        {/* ── Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shown.map((rec, i) => (
            <div key={rec.product_id} className="animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <RecommendationCard rec={rec} isBest={i === 0} onSelect={() => handleSelect(rec)} />
            </div>
          ))}
        </div>

        {/* ── Not Interested ──────────────────────────────────── */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <button
            onClick={() => router.push("/")}
            className="btn-ghost text-sm flex items-center gap-2 text-slate-500 hover:text-slate-300"
          >
            <AlertCircle className="w-4 h-4" /> Not interested — Start over
          </button>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
