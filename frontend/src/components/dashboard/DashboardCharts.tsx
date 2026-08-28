"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatINR } from "@/lib/utils/currency";

interface DashboardChartsProps {
  trendData: Array<{ day: string; total: number; hot: number; converted: number }>;
  productDemandData: Array<{ name: string; value: number; count: number; color: string }>;
  scoreDistributionData?: Array<{ range: string; count: number; fill: string }>;
}

export function DashboardCharts({
  trendData,
  productDemandData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Lead Inflow & Hot Lead Trend (8 cols) */}
      <div className="lg:col-span-8 rounded-2xl border border-white/8 bg-[#080d22] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Weekly Lead Inflow & Hot Trajectory</h3>
            <p className="text-xs text-slate-400">Total inquiries vs pre-qualified hot leads</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Total Inflow
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Hot Leads (90+)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090f28",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Leads"
              />
              <Area
                type="monotone"
                dataKey="hot"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHot)"
                name="Hot Leads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Product Demand Volume (4 cols) */}
      <div className="lg:col-span-4 rounded-2xl border border-white/8 bg-[#080d22] p-5 shadow-xl space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Demand by Product</h3>
          <p className="text-xs text-slate-400">Total pipeline loan value</p>
        </div>

        <div className="space-y-3 py-2">
          {productDemandData.map((prod) => (
            <div key={prod.name} className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">{prod.name}</span>
                <span className="font-mono text-cyan-300 font-bold">{formatINR(prod.value, true)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((prod.value / 10000000) * 100)}%`,
                    backgroundColor: prod.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Top: Prime Home Loan (₹98L)</span>
          <span className="text-indigo-400">52 Inquiries</span>
        </div>
      </div>
    </div>
  );
}
