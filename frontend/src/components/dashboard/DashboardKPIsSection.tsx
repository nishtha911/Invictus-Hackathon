"use client";

import { Users, Flame, Percent, IndianRupee, ArrowUpRight } from "lucide-react";
import { DashboardKPIs } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface DashboardKPIsSectionProps {
  kpis: DashboardKPIs;
}

export function DashboardKPIsSection({ kpis }: DashboardKPIsSectionProps) {
  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Leads */}
        <div className="rounded-2xl border border-white/8 bg-[#080d22] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Leads</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.total_leads}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> +18.4%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Across 5 loan categories</span>
        </div>

        {/* KPI 2: Hot Leads */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-[#080d22] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Hot Leads (Score 90+)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{kpis.hot_leads}</span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">Ready to Sanction</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Under 7-day conversion window</span>
        </div>

        {/* KPI 3: Qualification Rate */}
        <div className="rounded-2xl border border-white/8 bg-[#080d22] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Qualification Rate</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.qualification_rate}%</span>
            <span className="text-xs text-cyan-300 font-semibold">Tier-1 & 2 Filter</span>
          </div>
          <span className="text-[11px] text-slate-400 block">FOIR & credit policy met</span>
        </div>

        {/* KPI 4: Total Loan Demand */}
        <div className="rounded-2xl border border-white/8 bg-[#080d22] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Loan Demand</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
              {formatINR(kpis.total_loan_demand, true)}
            </span>
            <span className="text-xs text-purple-300 font-semibold">Pipeline Sum</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Aggregated customer intent</span>
        </div>
      </div>

      {/* Conversion Pipeline Progress Bar (Section 48) */}
      <div className="rounded-2xl border border-white/8 bg-[#080d24] p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Conversion Pipeline Velocity
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">19 Converted Disbursals</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className="rounded-xl bg-black/40 p-3 border border-white/6 text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">1. New Intake</span>
            <span className="text-lg font-bold text-white font-mono">{kpis.conversion_pipeline.new}</span>
            <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-full" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl bg-black/40 p-3 border border-white/6 text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">2. Qualified</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{kpis.conversion_pipeline.qualified}</span>
            <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-[67%]" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl bg-black/40 p-3 border border-white/6 text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">3. Contacted</span>
            <span className="text-lg font-bold text-purple-400 font-mono">{kpis.conversion_pipeline.contacted}</span>
            <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[36%]" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl bg-black/40 p-3 border border-emerald-500/20 bg-emerald-950/20 text-left">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">4. Converted</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{kpis.conversion_pipeline.converted}</span>
            <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-[14%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
