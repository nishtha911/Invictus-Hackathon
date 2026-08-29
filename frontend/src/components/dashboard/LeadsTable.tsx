"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
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
    <div className="bank-card p-5 sm:p-6 bg-white border border-[#E2E8F0] shadow-sm space-y-5">
      {/* Table Header & Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-base font-bold text-[#081C2D] flex items-center gap-2">
            <span>Inbound Lead Applications</span>
            <span className="rounded-md bg-[#F5F7FA] px-2.5 py-0.5 text-xs font-mono text-slate-600 border border-[#E2E8F0]">
              {filteredLeads.length} leads
            </span>
          </h3>
          <p className="text-xs text-slate-500">Click any row to open the Underwriting Briefing</p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, lead ID..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] pl-10 pr-4 py-2 text-xs text-[#081C2D] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
        <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px] uppercase mr-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 py-1 text-slate-700 focus:outline-none"
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
          className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 py-1 text-slate-700 focus:outline-none"
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
          className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 py-1 text-slate-700 focus:outline-none"
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
            <tr className="border-b border-[#E2E8F0] text-slate-500 font-semibold">
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Product</th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                <div className="flex items-center gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort("score")}>
                <div className="flex items-center gap-1">
                  <span>Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Urgency</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
            {filteredLeads.map((lead) => {
              const isHot = lead.score_band === "HOT LEAD";
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-[#F5F7FA] cursor-pointer transition-colors group"
                >
                  {/* Customer */}
                  <td className="p-3.5">
                    <div className="font-semibold text-[#081C2D] group-hover:text-[#1F7A63] transition-colors">
                      {lead.customer_name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">{lead.phone}</div>
                  </td>

                  {/* Product */}
                  <td className="p-3.5">
                    <div className="font-medium text-[#081C2D]">{lead.product_name}</div>
                    <div className="text-[10px] text-slate-500">{lead.loan_category}</div>
                  </td>

                  {/* Amount */}
                  <td className="p-3.5 font-mono font-bold text-[#081C2D] text-sm">
                    {formatINR(lead.requested_amount, true)}
                  </td>

                  {/* Score */}
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                        isHot
                          ? "border-emerald-200 bg-[#E8F5F1] text-[#1F7A63]"
                          : "border-slate-200 bg-[#F5F7FA] text-slate-700"
                      }`}
                    >
                      {lead.lead_score}/100
                    </span>
                  </td>

                  {/* Urgency */}
                  <td className="p-3.5 text-[11px] text-slate-500">{lead.urgency.split(" ")[0]}</td>

                  {/* Status */}
                  <td className="p-3.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        lead.status === "Qualified"
                          ? "bg-emerald-50 text-[#1F7A63] border border-emerald-100"
                          : lead.status === "New"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : lead.status === "Contacted"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right">
                    <button className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 group-hover:border-[#1F7A63] group-hover:text-[#1F7A63] transition-all">
                      <span>Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No leads match your current search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
