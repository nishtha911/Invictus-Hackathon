"use client";

import { useState, useEffect } from "react";
import UploadPage from "./upload/page";
import DocsPage from "./docs/page";
import QueryPage from "./query/page";
import { UploadCloud, BookOpen, MessageSquare, Sparkles } from "lucide-react";

const TABS = [
  { label: "Query Policies & Chat", icon: MessageSquare },
  { label: "Knowledge Base Documents", icon: BookOpen },
  { label: "Upload Documents", icon: UploadCloud },
];

export default function RagMainPage() {
  const [tab, setTab] = useState(0);
  const [llmInfo, setLlmInfo] = useState<{ provider?: string; model?: string } | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    fetch(`${apiBase}/config`)
      .then((r) => r.json())
      .then(setLlmInfo)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#081C2D] tracking-tight">
                Policy Knowledge Base & RAG Engine
              </h1>
              <span className="rounded-md bg-[#E8F5F1] px-2.5 py-0.5 text-xs font-semibold text-[#1F7A63] border border-emerald-100">
                Live RAG
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly grounded bank lending policies with vector similarity search & user advisory personalization.
            </p>
          </div>

          {llmInfo && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-[#1F7A63]">
                {llmInfo.provider ? llmInfo.provider.toUpperCase() : "GROQ"}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md max-w-[200px] truncate">
                {llmInfo.model || "openai/gpt-oss-120b"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Siddhi's 3 Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 sm:gap-2">
          {TABS.map((t, i) => {
            const IconComp = t.icon;
            return (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  tab === i
                    ? "border-[#1F7A63] text-[#1F7A63]"
                    : "border-transparent text-slate-500 hover:text-[#081C2D] hover:border-slate-300"
                }`}
              >
                <IconComp className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {tab === 0 && <QueryPage />}
        {tab === 1 && <DocsPage />}
        {tab === 2 && <UploadPage />}
      </main>
    </div>
  );
}
