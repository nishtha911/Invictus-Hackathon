"use client";

import { Users, Flame, Percent, IndianRupee, ArrowRight } from "lucide-react";
import { DashboardKPIs } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface DashboardKPIsSectionProps {
  kpis: DashboardKPIs;
}

const CARDS = [
  { key: "total", label: "Total inbound leads", icon: Users, accent: "#334155", note: "From completed advisory sessions" },
  { key: "hot", label: "Hot leads (score 78+)", icon: Flame, accent: "#1F7A63", note: "Prioritised for sanction" },
  { key: "qual", label: "Qualification rate", icon: Percent, accent: "#2563EB", note: "Hot + warm share of pipeline" },
  { key: "demand", label: "Total pipeline demand", icon: IndianRupee, accent: "#B45309", note: "Aggregated borrower intent" },
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
        {CARDS.map(({ key, label, icon: Icon, accent, note }) => (
          <div
            key={key}
            className="rounded-xl border border-[#E6E9EF] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <Icon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="mt-2 text-[28px] font-bold tracking-tight tabular-nums text-[#1F2937]">
              {value[key]}
            </div>
            <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
              {note}
            </span>
          </div>
        ))}
      </div>

      {/* Conversion pipeline */}
      <div className="rounded-xl border border-[#E6E9EF] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-[#1F2937]">Conversion pipeline</h3>
          <span className="text-[11px] font-medium text-slate-400">{p.converted} converted</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stages.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-[#E6E9EF] bg-[#FAFBFC] p-3">
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="mt-1 block text-lg font-bold tabular-nums text-[#1F2937]">
                  {s.count}
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1F5]">
                  <div
                    className="h-full rounded-full"
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
