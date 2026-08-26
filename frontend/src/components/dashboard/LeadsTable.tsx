"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Flame,
} from "lucide-react";
import { SalesDashboardLeadItem } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface LeadsTableProps {
  leads: SalesDashboardLeadItem[];
  onSelectLead: (lead: SalesDashboardLeadItem) => void;
}

export function LeadsTable({ leads, onSelectLead }: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedScoreBand, setSelectedScoreBand] = useState<string>("All");
  const [sortField, setSortField] = useState<"score" | "amount" | "created">("score");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const matchesSearch =
          lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          lead.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === "All" || lead.loan_category === selectedCategory;

        const matchesStatus =
          selectedStatus === "All" || lead.status === selectedStatus;

        const matchesScoreBand =
          selectedScoreBand === "All" || lead.score_band === selectedScoreBand;

        return matchesSearch && matchesCategory && matchesStatus && matchesScoreBand;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "score") diff = a.lead_score - b.lead_score;
        if (sortField === "amount") diff = a.requested_amount - b.requested_amount;
        return sortAsc ? diff : -diff;
      });
  }, [leads, searchTerm, selectedCategory, selectedStatus, selectedScoreBand, sortField, sortAsc]);

  const toggleSort = (field: "score" | "amount" | "created") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080d22] p-5 sm:p-6 shadow-xl space-y-5">
      {/* Table Header & Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Qualified Inbound Leads Queue</span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-mono text-indigo-300">
              {filteredLeads.length} leads
            </span>
          </h3>
          <p className="text-xs text-slate-400">Click any row to open the AI Underwriting Briefing</p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, lead ID..."
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/6 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase mr-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Home Loan">Home Loan</option>
          <option value="Personal Loan">Personal Loan</option>
          <option value="Vehicle Loan">Vehicle Loan</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="In Review">In Review</option>
        </select>

        {/* Score Band Filter */}
        <select
          value={selectedScoreBand}
          onChange={(e) => setSelectedScoreBand(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="All">All Score Bands</option>
          <option value="HOT LEAD">Hot Lead (90+)</option>
          <option value="WARM LEAD">Warm Lead (75-89)</option>
        </select>
      </div>

      {/* Leads Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/8 text-slate-400 font-semibold">
              <th className="p-3">Customer</th>
              <th className="p-3">Product</th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                <div className="flex items-center gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleSort("score")}>
                <div className="flex items-center gap-1">
                  <span>AI Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3">Urgency</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 text-slate-300">
            {filteredLeads.map((lead) => {
              const isHot = lead.score_band === "HOT LEAD";
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                >
                  {/* Customer */}
                  <td className="p-3">
                    <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {lead.customer_name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{lead.phone}</div>
                  </td>

                  {/* Product */}
                  <td className="p-3">
                    <div className="font-medium text-white">{lead.product_name}</div>
                    <div className="text-[10px] text-indigo-400">{lead.loan_category}</div>
                  </td>

                  {/* Amount */}
                  <td className="p-3 font-mono font-bold text-cyan-300 text-sm">
                    {formatINR(lead.requested_amount, true)}
                  </td>

                  {/* AI Score */}
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${
                        isHot
                          ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                          : "border-indigo-500/40 bg-indigo-950/60 text-indigo-300"
                      }`}
                    >
                      {isHot && <Flame className="h-3 w-3 text-emerald-400" />}
                      <span>{lead.lead_score}/100</span>
                    </span>
                  </td>

                  {/* Urgency */}
                  <td className="p-3 text-[11px] text-slate-400">{lead.urgency.split(" ")[0]}</td>

                  {/* Status */}
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                        lead.status === "Qualified"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : lead.status === "New"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : lead.status === "Contacted"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3 text-right">
                    <button className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] font-semibold text-slate-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <span>Briefing</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs">
            No leads match your current search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
