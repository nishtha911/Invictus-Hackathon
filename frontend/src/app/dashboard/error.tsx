"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Cognis Bank] Dashboard error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center bg-[#F5F7FA] px-4 py-16 min-h-[60vh]">
      <div className="w-full max-w-md rounded-2xl border border-[#E4E9F0] bg-white p-8 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#132443]">Dashboard hit a snag</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            A chart, lead, or call panel failed to render. Your leads and call log are unaffected — reload this section to continue.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload Dashboard
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4E9F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#132443] hover:bg-[#F5F7FA] transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Return Home
          </button>
        </div>
      </div>
    </main>
  );
}
