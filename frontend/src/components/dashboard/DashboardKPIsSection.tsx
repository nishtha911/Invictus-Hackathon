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
        <div className="bank-card p-5 bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Inbound Leads</span>
            <div className="h-8 w-8 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#081C2D]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#081C2D] font-mono">{kpis.total_leads}</span>
            <span className="text-xs text-[#1F7A63] font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> +18.4%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Across 5 loan categories</span>
        </div>

        {/* KPI 2: Hot Leads */}
        <div className="bank-card p-5 bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F7A63]">Hot Leads (Score 90+)</span>
            <div className="h-8 w-8 rounded-lg bg-[#E8F5F1] border border-emerald-100 flex items-center justify-center text-[#1F7A63]">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F7A63] font-mono">{kpis.hot_leads}</span>
            <span className="text-xs text-[#1F7A63] font-semibold font-mono">Sanction Ready</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Under 7-day conversion window</span>
        </div>

        {/* KPI 3: Qualification Rate */}
        <div className="bank-card p-5 bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Qualification Rate</span>
            <div className="h-8 w-8 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#081C2D]">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#081C2D] font-mono">{kpis.qualification_rate}%</span>
            <span className="text-xs text-slate-600 font-semibold">Tier-1 & 2 Filter</span>
          </div>
          <span className="text-[11px] text-slate-400 block">FOIR & credit criteria met</span>
        </div>

        {/* KPI 4: Total Loan Demand */}
        <div className="bank-card p-5 bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pipeline Demand</span>
            <div className="h-8 w-8 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#081C2D]">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] font-mono">
              {formatINR(kpis.total_loan_demand, true)}
            </span>
            <span className="text-xs text-slate-600 font-semibold">Pipeline Sum</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Aggregated borrower intent</span>
        </div>
      </div>

      {/* Conversion Pipeline Progress */}
      <div className="bank-card p-5 bg-white border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#081C2D]">
            Conversion Pipeline Velocity
          </h3>
          <span className="text-[11px] font-mono font-semibold text-[#1F7A63]">
            19 Converted Disbursals
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className="rounded-xl bg-[#F5F7FA] p-3.5 border border-[#E2E8F0] text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              1. Inbound Intake
            </span>
            <span className="text-xl font-bold text-[#081C2D] font-mono">{kpis.conversion_pipeline.new}</span>
            <div className="mt-2 h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#081C2D] w-full" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl bg-[#F5F7FA] p-3.5 border border-[#E2E8F0] text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              2. Qualified
            </span>
            <span className="text-xl font-bold text-[#081C2D] font-mono">{kpis.conversion_pipeline.qualified}</span>
            <div className="mt-2 h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#081C2D] w-[67%]" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl bg-[#F5F7FA] p-3.5 border border-[#E2E8F0] text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              3. Contacted
            </span>
            <span className="text-xl font-bold text-[#081C2D] font-mono">{kpis.conversion_pipeline.contacted}</span>
            <div className="mt-2 h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#081C2D] w-[36%]" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl bg-[#F0FDF4] p-3.5 border border-emerald-200 text-left">
            <span className="text-[10px] text-[#1F7A63] uppercase tracking-wider block font-semibold">
              4. Converted
            </span>
            <span className="text-xl font-bold text-[#1F7A63] font-mono">{kpis.conversion_pipeline.converted}</span>
            <div className="mt-2 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1F7A63] w-[14%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
