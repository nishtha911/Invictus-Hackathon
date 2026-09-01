"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Cognis Bank] Unhandled page error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center bg-[#F5F7FA] px-4 py-16 min-h-[70vh]">
      <div className="w-full max-w-md rounded-2xl border border-[#E4E9F0] bg-white p-8 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#132443]">Something went wrong</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This page hit an unexpected error. Your session and data are safe — try again or head back home.
          </p>
        </div>
        {error.digest && (
          <p className="font-mono text-[10px] text-slate-400">Ref: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4E9F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#132443] hover:bg-[#F5F7FA] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Return Home
          </button>
        </div>
      </div>
    </main>
  );
}
