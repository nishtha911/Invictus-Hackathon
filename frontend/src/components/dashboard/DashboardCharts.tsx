"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
interface DashboardChartsProps {
  trendData: Array<{ day: string; total: number; hot: number; converted: number }>;
  productDemandData: Array<{ name: string; value: number; count: number; color: string }>;
  scoreDistributionData?: Array<{ range: string; count: number; fill: string }>;
}

export function DashboardCharts({
  trendData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Lead Inflow & Hot Lead Trend (12 cols) */}
      <div className="lg:col-span-12 bank-card p-5 sm:p-6 bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#132443]">Weekly Application Volume & Hot Leads</h3>
            <p className="text-xs text-slate-500">Inbound inquiries vs pre-qualified hot applications</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#132443]" />
              Total Inflow
            </span>
            <span className="flex items-center gap-1.5 text-[#1F7A63] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F7A63]" />
              Hot Leads (90+)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#132443" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#132443" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F7A63" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1F7A63" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "#132443",
                  boxShadow: "0 4px 12px rgba(19, 36, 67, 0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#132443"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Inflow"
              />
              <Area
                type="monotone"
                dataKey="hot"
                stroke="#1F7A63"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHot)"
                name="Hot Leads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
