"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Phone,
  Mail,
  Clock,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { SalesDashboardLeadItem } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";
import { toast } from "sonner";

interface LeadDetailDrawerProps {
  lead: SalesDashboardLeadItem | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, newStatus: SalesDashboardLeadItem["status"]) => void;
}

export function LeadDetailDrawer({ lead, onClose, onUpdateStatus }: LeadDetailDrawerProps) {
  if (!lead) return null;

  const handleCall = () => {
    toast.success(`Initiating secure bank dialer to ${lead.phone}...`, { id: "dialer" });
  };

  const handleMarkContacted = () => {
    onUpdateStatus(lead.id, "Contacted");
    toast.success(`Updated lead ${lead.id} status to 'Contacted'`, { id: "status" });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#02040b]/80 backdrop-blur-sm"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="relative w-full max-w-xl h-full overflow-y-auto border-l border-white/10 bg-[#080d24] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between pb-5 border-b border-white/8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  {lead.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                    lead.score_band === "HOT LEAD"
                      ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                      : "border-indigo-500/40 bg-indigo-950/60 text-indigo-300"
                  }`}
                >
                  {lead.score_band} · {lead.lead_score}/100
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{lead.customer_name}</h2>
              <p className="text-xs text-slate-400">Created {lead.created_at}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Key Financial Snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/8 bg-black/40 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Selected Loan Product
              </span>
              <span className="text-sm font-bold text-white block mt-0.5">{lead.product_name}</span>
              <span className="text-[10px] text-indigo-400">{lead.loan_category}</span>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/40 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Requested Principal
              </span>
              <span className="text-base font-extrabold text-cyan-300 font-mono block mt-0.5">
                {formatINR(lead.requested_amount)}
              </span>
              <span className="text-[10px] text-slate-400">EMI ~{formatINR(lead.estimated_emi)}/mo</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border border-white/8 bg-black/30 p-4 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-cyan-400" />
              <span className="font-mono">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-indigo-400" />
              <span>{lead.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Preferred Callback: <strong>{lead.preferred_time}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span>Urgency: <strong>{lead.urgency}</strong></span>
            </div>
          </div>

          {/* AI AGENT BRIEFING (Architecture Requirement Section 51) */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-[#060a1c] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Agent Underwriting Briefing
              </h3>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              &quot;{lead.ai_briefing}&quot;
            </p>
          </div>

          {/* WHY THIS LEAD SCORED HIGH */}
          <div className="rounded-2xl border border-white/8 bg-black/25 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Why this lead scored high
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {lead.scoring_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RECOMMENDED TALKING POINTS */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Recommended Pitch & Talking Points
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {lead.talking_points.map((tp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{tp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-white/8 flex items-center gap-3">
            <button
              onClick={handleCall}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call Customer</span>
            </button>
            <button
              onClick={handleMarkContacted}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-4 py-3 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/60 hover:text-white transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <span>Mark Contacted</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
