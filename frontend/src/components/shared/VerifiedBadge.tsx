import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface VerifiedBadgeProps {
  type?: "calculation" | "policy" | "ai";
  label?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ type = "calculation", label, size = "sm" }: VerifiedBadgeProps) {
  if (type === "calculation") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 font-medium text-emerald-300 shadow-sm ${
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <CheckCircle2 className={size === "sm" ? "h-3 w-3 text-emerald-400" : "h-3.5 w-3.5 text-emerald-400"} />
        <span>{label || "Verified Calculation"}</span>
      </span>
    );
  }

  if (type === "policy") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 font-medium text-cyan-300 shadow-sm ${
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <ShieldCheck className={size === "sm" ? "h-3 w-3 text-cyan-400" : "h-3.5 w-3.5 text-cyan-400"} />
        <span>{label || "Policy Grounded"}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 font-medium text-indigo-300 shadow-sm ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Sparkles className={size === "sm" ? "h-3 w-3 text-indigo-400" : "h-3.5 w-3.5 text-indigo-400"} />
      <span>{label || "AI Explanation"}</span>
    </span>
  );
}
