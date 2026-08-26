"use client";

import { motion } from "motion/react";
import { Sparkles, Cpu } from "lucide-react";

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
      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[11px] font-medium text-cyan-300 shadow-sm backdrop-blur-md"
    >
      <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
      <span>{message}</span>
      <Sparkles className="h-3 w-3 text-cyan-400" />
    </motion.div>
  );
}
