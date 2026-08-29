"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Phone,
  Mail,
  Clock,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Calendar,
  ShieldCheck,
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
          className="fixed inset-0 bg-[#081C2D]/60 backdrop-blur-xs"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="relative w-full max-w-xl h-full overflow-y-auto border-l border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between pb-5 border-b border-[#E2E8F0]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#F5F7FA] px-2 py-0.5 text-[11px] text-slate-600 border border-[#E2E8F0] tabular-nums">
                  {lead.id}
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold tabular-nums border ${lead.score_band === "HOT LEAD"
                      ? "border-emerald-200 bg-[#E8F5F1] text-[#1F7A63]"
                      : "border-slate-200 bg-[#F5F7FA] text-slate-700"
                    }`}
                >
                  {lead.score_band} · {lead.lead_score}/100
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#081C2D] tracking-tight">
                {lead.customer_name}
              </h2>
              <p className="text-xs text-slate-500">Submitted {lead.created_at}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F5F7FA] hover:text-[#081C2D] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Key Financial Snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Selected Loan Product
              </span>
              <span className="text-sm font-bold text-[#081C2D] block mt-0.5">{lead.product_name}</span>
              <span className="text-[10px] text-[#1F7A63] font-medium">{lead.loan_category}</span>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Requested Principal
              </span>
              <span className="text-base font-bold text-[#081C2D] tabular-nums block mt-0.5">
                {formatINR(lead.requested_amount)}
              </span>
              <span className="text-[10px] text-slate-500 tabular-nums">EMI ~{formatINR(lead.estimated_emi)}/mo</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#1F7A63]" />
              <span className="tabular-nums">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#1F7A63]" />
              <span>{lead.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#1F7A63]" />
              <span>Preferred Callback: <strong>{lead.preferred_time}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#1F7A63]" />
              <span>Urgency: <strong>{lead.urgency}</strong></span>
            </div>
          </div>

          {/* UNDERWRITING BRIEFING */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#081C2D] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
              Underwriting Assessment Notes
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              &quot;{lead.ai_briefing}&quot;
            </p>
          </div>

          {/* WHY THIS LEAD SCORED HIGH */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#081C2D] flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#1F7A63]" />
              Scoring Factors & Verification
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {lead.scoring_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RECOMMENDED TALKING POINTS */}
          <div className="rounded-xl border border-emerald-100 bg-[#F0FDF4] p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F7A63] flex items-center gap-1.5">
              Recommended Pitch & Talking Points
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {lead.talking_points.map((tp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{tp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center gap-3">
            <button
              onClick={handleCall}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-3 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call Customer</span>
            </button>
            <button
              onClick={handleMarkContacted}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#081C2D] bg-white px-4 py-3 text-xs font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Mark Contacted</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
