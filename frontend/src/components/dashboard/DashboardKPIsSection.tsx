"use client";

import { Users, Flame, Percent, IndianRupee, ArrowRight } from "lucide-react";
import { DashboardKPIs } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface DashboardKPIsSectionProps {
  kpis: DashboardKPIs;
}

const CARDS = [
  { key: "total", label: "Total Inbound Leads", icon: Users, accent: "#132443", tint: "rgba(19,36,67,0.05)", note: "From completed advisory sessions" },
  { key: "hot", label: "Hot Leads (Score 70+)", icon: Flame, accent: "#1F7A63", tint: "rgba(31,122,99,0.07)", note: "Prioritised for sanction" },
  { key: "qual", label: "Qualification Rate", icon: Percent, accent: "#6366F1", tint: "rgba(99,102,241,0.07)", note: "Hot + warm share of pipeline" },
  { key: "demand", label: "Total Pipeline Demand", icon: IndianRupee, accent: "#F59E0B", tint: "rgba(245,158,11,0.08)", note: "Aggregated borrower intent" },
] as const;

export function DashboardKPIsSection({ kpis }: DashboardKPIsSectionProps) {
  const p = kpis.conversion_pipeline;
  const pipelineMax = Math.max(1, p.new, p.qualified, p.contacted, p.converted);
  const value: Record<string, string> = {
    total: String(kpis.total_leads),
    hot: String(kpis.hot_leads),
    qual: `${kpis.qualification_rate}%`,
    demand: formatINR(kpis.total_loan_demand, true),
  };

  const stages = [
    { label: "New", count: p.new, color: "#94A3B8" },
    { label: "Qualified", count: p.qualified, color: "#6366F1" },
    { label: "Contacted", count: p.contacted, color: "#132443" },
    { label: "Converted", count: p.converted, color: "#1F7A63" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, accent, tint, note }) => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: `linear-gradient(160deg, ${tint} 0%, #FFFFFF 55%)` }}
          >
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.06] transition-transform group-hover:scale-125"
              style={{ background: accent }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: accent }}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-3 text-3xl font-extrabold font-mono tracking-tight" style={{ color: accent }}>
              {value[key]}
            </div>
            <span className="relative mt-1 block text-[11px] text-slate-400">{note}</span>
          </div>
        ))}
      </div>

      {/* Conversion pipeline */}
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#132443]">Conversion Pipeline</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-bold text-[#1F7A63]">
            {p.converted} converted
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stages.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-[#E4E9F0] bg-[#F8FAFC] p-3">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="mt-1 block text-xl font-bold font-mono" style={{ color: s.color === "#94A3B8" ? "#132443" : s.color }}>
                  {s.count}
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E9EDF3]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((s.count / pipelineMax) * 100)}%`, background: s.color }}
                  />
                </div>
              </div>
              {i < stages.length - 1 && <ArrowRight className="hidden sm:block h-3.5 w-3.5 text-slate-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
