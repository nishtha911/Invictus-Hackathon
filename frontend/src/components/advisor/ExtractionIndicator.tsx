"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface ExtractionIndicatorProps {
  message?: string;
  active?: boolean;
}

export function ExtractionIndicator({
  message = "Structuring financial profile signals...",
  active = true,
}: ExtractionIndicatorProps) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-[#F0FDF4] px-3 py-1 text-[11px] font-medium text-[#1F7A63]"
    >
      <Loader2 className="h-3.5 w-3.5 text-[#1F7A63] animate-spin" />
      <span>{message}</span>
    </motion.div>
  );
}
