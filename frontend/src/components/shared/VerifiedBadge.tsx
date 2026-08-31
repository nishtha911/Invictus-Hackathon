import { CheckCircle2, ShieldCheck, Check } from "lucide-react";

interface VerifiedBadgeProps {
  type?: "calculation" | "policy" | "ai";
  label?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ type = "calculation", label, size = "sm" }: VerifiedBadgeProps) {
  if (type === "calculation") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-[#E8F5F1] font-semibold text-[#1F7A63] ${
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <CheckCircle2 className={size === "sm" ? "h-3 w-3 text-[#1F7A63]" : "h-3.5 w-3.5 text-[#1F7A63]"} />
        <span>{label || "Verified Calculation"}</span>
      </span>
    );
  }

  if (type === "policy") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F5F7FA] font-semibold text-slate-700 ${
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <ShieldCheck className={size === "sm" ? "h-3 w-3 text-[#1F7A63]" : "h-3.5 w-3.5 text-[#1F7A63]"} />
        <span>{label || "Policy Grounded"}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F5F7FA] font-semibold text-slate-700 ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Check className={size === "sm" ? "h-3 w-3 text-[#1F7A63]" : "h-3.5 w-3.5 text-[#1F7A63]"} />
      <span>{label || "Verified Terms"}</span>
    </span>
  );
}
