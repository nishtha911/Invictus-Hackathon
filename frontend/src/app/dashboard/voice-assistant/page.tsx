"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";
import { ArrowLeft, PhoneOff } from "lucide-react";

// The voice / follow-up CRM is a separate app (see /aivoiceassistance).
// It is only embedded when its URL is explicitly configured for this environment.
const VOICE_APP_URL = process.env.NEXT_PUBLIC_VOICE_ASSISTANT_URL;

export default function VoiceAssistantPage() {
  const router = useRouter();
  const { role } = useJourneyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted && role !== "employee") {
      router.push("/login");
    }
  }, [mounted, role, router]);

  if (!mounted || role !== "employee") {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-sm text-slate-500 font-medium">Checking authorization...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#F5F7FA] h-[calc(100vh-64px)] overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Center
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="text-lg font-bold text-[#132443]">AI Voice &amp; Follow-up CRM</h1>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {VOICE_APP_URL ? (
          <iframe
            src={VOICE_APP_URL}
            className="absolute inset-0 w-full h-full border-none bg-slate-50"
            title="AI Voice Assistant"
            allow="microphone"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <PhoneOff className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-[#132443]">Voice CRM not connected</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The outbound voice &amp; follow-up module is a separate prototype
                (<code className="font-mono text-[11px]">/aivoiceassistance</code>). Set{" "}
                <code className="font-mono text-[11px]">NEXT_PUBLIC_VOICE_ASSISTANT_URL</code> to its
                deployed address to embed it here. It is not part of the core MVP.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Command Center
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
