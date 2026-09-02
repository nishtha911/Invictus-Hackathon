"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardSegment, LeadSourceDatum } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

/* ── palette ──────────────────────────────────────────────────────────── */
const BLUE = "#2563EB"; // applications
const EMERALD = "#1F7A63"; // hot / eligible
const AMBER = "#D97706"; // converted / conditional
const SLATE = "#94A3B8"; // nurture / review
const GRID = "#EDF0F4";
const AXIS = "#9AA4B2";
const INK = "#1F2937";

const CATEGORY_FALLBACK = [EMERALD, "#4F46E5", "#0E7490", "#7C3AED", AMBER, SLATE];

interface TrendPoint {
  day: string;
  date?: string;
  total: number;
  hot: number;
  converted: number;
}

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { color?: string; fill?: string };
}
interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: TipEntry[];
}

function ChartTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E6E9EF] bg-white px-3 py-2 text-xs shadow-md">
      {label != null && label !== "" && <p className="mb-1 font-semibold text-[#1F2937]">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-600">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.payload?.color || p.payload?.fill }}
          />
          <span>{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-[#1F2937]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function Card({
  title,
  subtitle,
  span,
  children,
}: {
  title: string;
  subtitle?: string;
  span: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${span} rounded-xl border border-[#E6E9EF] bg-white p-5 shadow-sm`}>
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-[#1F2937]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

/** Horizontal breakdown row list — one consistent visual for every categorical split. */
function BreakdownRows({
  data,
  total,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}) {
  const safeTotal = Math.max(1, total);
  return (
    <div className="space-y-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
        {data.map((d) => (
          <div
            key={d.name}
            title={`${d.name}: ${d.value}`}
            style={{ width: `${(d.value / safeTotal) * 100}%`, background: d.color }}
          />
        ))}
      </div>
      {data.map((d) => (
        <div key={d.name} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold tabular-nums text-[#1F2937]">{d.value}</span>
            <span className="w-9 text-right text-xs font-medium text-slate-400 tabular-nums">
              {Math.round((d.value / safeTotal) * 100)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

interface DashboardChartsProps {
  trendData: TrendPoint[];
  productDemandData: Array<{ name: string; value: number; count: number; color: string }>;
  scoreDistributionData?: Array<{ range: string; count: number; fill: string }>;
  leadSourceData?: LeadSourceDatum[];
  eligibilityData?: DashboardSegment[];
}

export function DashboardCharts({
  trendData,
  productDemandData,
  scoreDistributionData = [],
  leadSourceData = [],
  eligibilityData = [],
}: DashboardChartsProps) {
  // Always plot oldest → newest, left → right, whatever order the API sends.
  const trend = [...trendData].sort((a, b) => {
    const ka = a.date ?? a.day;
    const kb = b.date ?? b.day;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  const demand = [...productDemandData].sort((a, b) => b.value - a.value).slice(0, 6);
  const maxDemand = Math.max(1, ...demand.map((d) => d.value));

  const scoreRows = scoreDistributionData.map((d) => ({
    name: d.range,
    value: d.count,
    color: d.fill,
  }));
  const scoreTotal = scoreRows.reduce((s, d) => s + d.value, 0);

  const eligRows = eligibilityData.map((d) => ({ name: d.name, value: d.value, color: d.color }));
  const eligTotal = eligRows.reduce((s, d) => s + d.value, 0);
  const eligPie = eligRows.filter((d) => d.value > 0);
  const eligiblePct =
    eligTotal === 0
      ? 0
      : Math.round(((eligRows.find((d) => d.name === "Loan-Eligible")?.value ?? 0) / eligTotal) * 100);

  const sourceRows = leadSourceData.map((d) => ({ name: d.name, value: d.value, color: d.color }));
  const sourceTotal = sourceRows.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* ── Application volume trend ─────────────────────────────────── */}
      <Card
        span="lg:col-span-12"
        title="Application volume"
        subtitle="Daily inbound applications, hot-qualified leads and conversions (oldest to newest)"
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <Legend color={BLUE} label="Applications" />
          <Legend color={EMERALD} label="Hot leads" />
          <Legend color={AMBER} label="Converted" />
        </div>

        {trend.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-slate-400">
            No dated leads yet — capture a lead to populate the trend.
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillHot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMERALD} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="day"
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                />
                <YAxis
                  stroke={AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={34}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#D8DEE7", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Applications"
                  stroke={BLUE}
                  strokeWidth={2}
                  fill="url(#fillApplications)"
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="hot"
                  name="Hot leads"
                  stroke={EMERALD}
                  strokeWidth={2}
                  fill="url(#fillHot)"
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="converted"
                  name="Converted"
                  stroke={AMBER}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  fill="none"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Loan product demand ─────────────────────────────────────── */}
      <Card
        span="lg:col-span-7"
        title="Loan product demand"
        subtitle="Requested value and lead count by category"
      >
        {demand.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No product demand yet.</p>
        ) : (
          <div className="space-y-3.5">
            {demand.map((d, i) => {
              const c = d.color?.startsWith("#") ? d.color : CATEGORY_FALLBACK[i % CATEGORY_FALLBACK.length];
              const pct = Math.round((d.value / maxDemand) * 100);
              return (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-[#1F2937]">
                      <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                      {d.name}
                    </span>
                    <span className="flex items-center gap-2 text-slate-500">
                      <span className="font-semibold tabular-nums text-[#1F2937]">
                        {formatINR(d.value, true)}
                      </span>
                      <span className="tabular-nums">
                        {d.count} {d.count === 1 ? "lead" : "leads"}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4F8]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(pct, 2)}%`, background: c }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Lead score distribution ─────────────────────────────────── */}
      <Card span="lg:col-span-5" title="Lead score mix" subtitle="Pipeline quality by score band">
        {scoreTotal === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No scored leads yet.</p>
        ) : (
          <BreakdownRows data={scoreRows} total={scoreTotal} />
        )}
      </Card>

      {/* ── Loan eligibility of captured leads ──────────────────────── */}
      <Card
        span="lg:col-span-7"
        title="Loan eligibility of captured leads"
        subtitle="Underwriting verdict from score band, FOIR and requested amount"
      >
        {eligTotal === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No leads to assess yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="relative h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={eligPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={eligPie.length > 1 ? 2 : 0}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {eligPie.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums text-[#1F2937]">{eligiblePct}%</span>
                <span className="text-xs font-medium text-slate-400">eligible</span>
              </div>
            </div>
            <BreakdownRows data={eligRows} total={eligTotal} />
          </div>
        )}
      </Card>

      {/* ── Lead origination channel ────────────────────────────────── */}
      <Card
        span="lg:col-span-5"
        title="Lead origination channel"
        subtitle="GenAI voice agent vs manual employee phone calls"
      >
        {sourceTotal === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No attributed leads yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-[#1F2937]" style={{ color: INK }}>
                {sourceTotal}
              </span>
              <span className="text-xs text-slate-400">attributed leads</span>
            </div>
            <BreakdownRows data={sourceRows} total={sourceTotal} />
          </div>
        )}
      </Card>
    </div>
  );
}
