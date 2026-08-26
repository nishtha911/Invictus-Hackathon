"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Home, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";

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
          className="fixed inset-0 bg-[#02040b]/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#090e24] p-6 sm:p-8 text-center shadow-2xl shadow-black/80"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30">
            <CheckCircle className="h-7 w-7 text-indigo-400" />
          </div>

          <h3 className="mt-4 text-xl font-bold tracking-tight text-white">Session Complete</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thanks for exploring your loan options with <strong>LoanSense AI</strong>. Your session is securely closed without capturing contact details.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            You can start another advisory session whenever you are ready to apply.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReturnHome}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Home className="h-4 w-4 text-slate-400" />
              <span>Return Home</span>
            </button>
            <button
              onClick={handleStartAgain}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-colors"
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
