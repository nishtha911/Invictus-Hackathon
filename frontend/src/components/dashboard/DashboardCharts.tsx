"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, PieChart, Layers } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}
interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: TipEntry[];
}

interface DashboardChartsProps {
  trendData: Array<{ day: string; total: number; hot: number; converted: number }>;
  productDemandData: Array<{ name: string; value: number; count: number; color: string }>;
  scoreDistributionData?: Array<{ range: string; count: number; fill: string }>;
}

const NAVY = "#132443";
const EMERALD = "#1F7A63";
const INDIGO = "#6366F1";
const AMBER = "#F59E0B";
const CYAN = "#06B6D4";
const BAR_PALETTE = [EMERALD, INDIGO, AMBER, CYAN, "#8B5CF6", "#EC4899"];

function ChartTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#132443] px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-white mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-200">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}</span>
          <span className="ml-auto font-mono font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: `${color}14`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function DashboardCharts({
  trendData,
  productDemandData,
  scoreDistributionData = [],
}: DashboardChartsProps) {
  const demand = [...productDemandData].sort((a, b) => b.value - a.value).slice(0, 6);
  const maxDemand = Math.max(1, ...demand.map((d) => d.value));
  const distTotal = Math.max(1, scoreDistributionData.reduce((s, d) => s + d.count, 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ── Trend: Application Volume vs Hot Leads ───────────────────── */}
      <div className="lg:col-span-12 rounded-2xl border border-[#E4E9F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#132443] text-white">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#132443]">Application Volume vs Hot Leads</h3>
              <p className="text-[11px] text-slate-500">Inbound applications, hot-qualified, and converted over time</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <LegendPill color={NAVY} label="Total" />
            <LegendPill color={EMERALD} label="Hot" />
            <LegendPill color={AMBER} label="Converted" />
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-slate-400">
            No dated leads yet — capture a lead to populate the trend.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gHot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMERALD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0.02} />
                  </linearGradient>
                  <filter id="glow" height="200%" width="200%" x="-50%" y="-50%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={EMERALD} floodOpacity="0.25" />
                  </filter>
                </defs>
                <CartesianGrid vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="total" name="Total" stroke={NAVY} strokeWidth={2.5} fill="url(#gTotal)" />
                <Area type="monotone" dataKey="converted" name="Converted" stroke={AMBER} strokeWidth={2} fill="url(#gConv)" />
                <Area type="monotone" dataKey="hot" name="Hot" stroke={EMERALD} strokeWidth={2.5} fill="url(#gHot)" filter="url(#glow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Loan Product Demand ─────────────────────────────────────── */}
      <div className="lg:col-span-7 rounded-2xl border border-[#E4E9F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F7A63] text-white">
            <PieChart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#132443]">Loan Product Demand</h3>
            <p className="text-[11px] text-slate-500">Requested value & lead count by category</p>
          </div>
        </div>

        {demand.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No product demand yet.</p>
        ) : (
          <div className="space-y-3.5">
            {demand.map((d, i) => {
              const c = d.color?.startsWith("#") ? d.color : BAR_PALETTE[i % BAR_PALETTE.length];
              const pct = Math.round((d.value / maxDemand) * 100);
              return (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#132443] flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
                      {d.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#132443]">{formatINR(d.value, true)}</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: `${c}18`, color: c }}
                      >
                        {d.count} {d.count === 1 ? "lead" : "leads"}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${c}CC, ${c})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lead Score Distribution ─────────────────────────────────── */}
      <div className="lg:col-span-5 rounded-2xl border border-[#E4E9F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366F1] text-white">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#132443]">Lead Score Distribution</h3>
            <p className="text-[11px] text-slate-500">Pipeline quality mix</p>
          </div>
        </div>

        {scoreDistributionData.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No scored leads yet.</p>
        ) : (
          <>
            <div className="flex h-3 w-full rounded-full overflow-hidden mb-5">
              {scoreDistributionData.map((d) => (
                <div
                  key={d.range}
                  title={`${d.range}: ${d.count}`}
                  style={{ width: `${(d.count / distTotal) * 100}%`, background: d.fill }}
                />
              ))}
            </div>
            <div className="space-y-3">
              {scoreDistributionData.map((d) => (
                <div key={d.range} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                    {d.range}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#132443]">{d.count}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {Math.round((d.count / distTotal) * 100)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
