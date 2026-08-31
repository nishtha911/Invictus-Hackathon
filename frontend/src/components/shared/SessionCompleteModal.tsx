"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Home, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";
import { BRAND } from "@/lib/constants";

interface SessionCompleteModalProps {
  open: boolean;
  onClose: () => void;
}

export function SessionCompleteModal({ open, onClose }: SessionCompleteModalProps) {
  const router = useRouter();
  const { resetDemo } = useJourneyStore();

  if (!open) return null;

  const handleReturnHome = () => {
    onClose();
    router.push("/");
  };

  const handleStartAgain = () => {
    resetDemo();
    onClose();
    router.push("/advisor");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#132443]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5F1] text-[#1F7A63]">
            <CheckCircle className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-xl font-bold tracking-tight text-[#132443]">Session Complete</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Thank you for exploring your loan options with <strong>{BRAND.name}</strong>. Your session is securely closed without capturing personal contact details.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            You can start another advisory session whenever you are ready to explore or apply.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReturnHome}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-semibold text-[#132443] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4 text-slate-500" />
              <span>Return Home</span>
            </button>
            <button
              onClick={handleStartAgain}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start Again</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
