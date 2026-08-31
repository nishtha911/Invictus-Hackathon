"use client";

import { useState } from "react";
import DocsPage from "./docs/page";
import QueryPage from "./query/page";
import UploadPage from "./upload/page";
import { BookOpen, MessageSquare, UploadCloud, ShieldCheck, Lock } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";

export default function RagMainPage() {
  const [tab, setTab] = useState(0);
  const { role } = useJourneyStore();
  const isEmployee = role === "employee";

  const allTabs = [
    { id: 0, label: "Policy Inquiry Assistant", icon: MessageSquare, employeeOnly: false },
    { id: 1, label: "Official Policy Guidelines", icon: BookOpen, employeeOnly: false },
    { id: 2, label: "Document Upload Desk", icon: UploadCloud, employeeOnly: true },
  ];

  const visibleTabs = allTabs.filter(t => !t.employeeOnly || isEmployee);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Premium Bank Header Banner */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
              <span>Lending Policy Guidelines & FAQ Desk</span>
              {!isEmployee && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full">
                  <Lock size={12} /> Customer Read-Only
                </span>
              )}
            </h1>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex gap-8">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.label}
                  onClick={() => setTab(t.id)}
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

          {!isEmployee && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium py-2">
              <Lock size={12} className="text-amber-500" /> KB document uploads restricted to Bank Employees
            </span>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 0 && <QueryPage />}
        {tab === 1 && <DocsPage />}
        {tab === 2 && isEmployee && <UploadPage />}
      </div>
    </div>
  );
}

