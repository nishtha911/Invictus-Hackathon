"use client";

import { useState } from "react";
import DocsPage from "./docs/page";
import QueryPage from "./query/page";
import UploadPage from "./upload/page";
import { BookOpen, MessageSquare, UploadCloud, ShieldCheck } from "lucide-react";

const TABS = [
  { label: "Policy Inquiry Assistant", icon: MessageSquare },
  { label: "Official Policy Guidelines", icon: BookOpen },
  { label: "Document Upload Desk", icon: UploadCloud },
];

export default function RagMainPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Premium Bank Header Banner */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Lending Policy Guidelines & FAQ Desk
              </h1>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Official Bank Rules
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Authoritative bank lending circulars, eligibility thresholds, and interest calculation formulas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Direct Bank Policy Verification</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const active = tab === i;
            return (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  active
                    ? "border-[#1F7A63] text-[#1F7A63]"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 0 && <QueryPage />}
        {tab === 1 && <DocsPage />}
        {tab === 2 && <UploadPage />}
      </div>
    </div>
  );
}
