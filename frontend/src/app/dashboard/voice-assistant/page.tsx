"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";
import { ArrowLeft } from "lucide-react";

export default function VoiceAssistantPage() {
  const router = useRouter();
  const { role } = useJourneyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          <div className="h-5 w-px bg-slate-200"></div>
          <h1 className="text-lg font-bold text-[#132443]">AI Voice & Follow-up CRM</h1>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <iframe 
          src="http://localhost:5173" 
          className="absolute inset-0 w-full h-full border-none bg-slate-50"
          title="AI Voice Assistant"
          allow="microphone"
        />
      </div>
    </main>
  );
}
