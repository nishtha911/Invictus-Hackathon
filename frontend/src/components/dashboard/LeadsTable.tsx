"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, ArrowDown, ArrowUp, ChevronRight, PhoneCall, RotateCcw } from "lucide-react";
import { SalesDashboardLeadItem } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";
import { CallWithAiModal } from "./CallWithAiModal";

interface LeadsTableProps {
  leads: SalesDashboardLeadItem[];
  onSelectLead: (lead: SalesDashboardLeadItem) => void;
}

type SortField = "recent" | "score" | "amount" | "name" | "eligibility";

const SORT_LABELS: Record<SortField, string> = {
  recent: "Recently added",
  score: "Lead score",
  amount: "Requested amount",
  name: "Customer name",
  eligibility: "Eligibility",
};

const ELIGIBILITY_RANK: Record<string, number> = {
  "Loan-Eligible": 3,
  "Conditionally Eligible": 2,
  "Needs Review": 1,
};

const ELIGIBILITY_STYLE: Record<string, string> = {
  "Loan-Eligible": "border-emerald-200 bg-emerald-50 text-[#1F7A63]",
  "Conditionally Eligible": "border-amber-200 bg-amber-50 text-amber-700",
  "Needs Review": "border-slate-200 bg-slate-100 text-slate-600",
};

function eligibilityOf(lead: SalesDashboardLeadItem): keyof typeof ELIGIBILITY_RANK {
  if (lead.eligibility) return lead.eligibility;
  const s = lead.lead_score;
  if (s >= 78 || /HOT/i.test(lead.score_band)) return "Loan-Eligible";
  if (s >= 58 || /WARM/i.test(lead.score_band)) return "Conditionally Eligible";
  return "Needs Review";
}

export function LeadsTable({ leads, onSelectLead }: LeadsTableProps) {
  const [callLead, setCallLead] = useState<SalesDashboardLeadItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedScoreBand, setSelectedScoreBand] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");
  const [sortField, setSortField] = useState<SortField>("recent");
  const [sortAsc, setSortAsc] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(leads.map((l) => l.loan_category).filter(Boolean)))],
    [leads],
  );

  const filtersActive =
    searchTerm !== "" ||
    selectedCategory !== "All" ||
    selectedStatus !== "All" ||
    selectedScoreBand !== "All" ||
    selectedEligibility !== "All" ||
    sortField !== "recent" ||
    sortAsc;

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedStatus("All");
    setSelectedScoreBand("All");
    setSelectedEligibility("All");
    setSortField("recent");
    setSortAsc(false);
  };

  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const rows = leads
      .map((lead, i) => ({ lead, i }))
      .filter(({ lead }) => {
        const matchesSearch =
          !q ||
          lead.customer_name.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.includes(searchTerm) ||
          lead.id.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === "All" || lead.loan_category === selectedCategory;
        const matchesStatus = selectedStatus === "All" || lead.status === selectedStatus;
        const matchesScoreBand = selectedScoreBand === "All" || lead.score_band === selectedScoreBand;
        const matchesEligibility =
          selectedEligibility === "All" || eligibilityOf(lead) === selectedEligibility;
        return matchesSearch && matchesCategory && matchesStatus && matchesScoreBand && matchesEligibility;
      });

    rows.sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case "recent":
          diff = b.i - a.i; // leads arrive newest-first from the API
          break;
        case "score":
          diff = a.lead.lead_score - b.lead.lead_score;
          break;
        case "amount":
          diff = a.lead.requested_amount - b.lead.requested_amount;
          break;
        case "name":
          diff = a.lead.customer_name.localeCompare(b.lead.customer_name);
          break;
        case "eligibility":
          diff = ELIGIBILITY_RANK[eligibilityOf(a.lead)] - ELIGIBILITY_RANK[eligibilityOf(b.lead)];
          break;
      }
      return sortAsc ? diff : -diff;
    });

    return rows.map((r) => r.lead);
  }, [leads, searchTerm, selectedCategory, selectedStatus, selectedScoreBand, selectedEligibility, sortField, sortAsc]);

  const toggleColumnSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const selectClass =
    "rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#1F7A63]";

  return (
    <div className="rounded-xl border border-[#E6E9EF] bg-white p-5 shadow-sm space-y-5">
      {/* Header & search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-2">
            Inbound lead applications
            <span className="rounded-md bg-[#F5F7FA] px-2 py-0.5 text-xs tabular-nums text-slate-500 border border-[#E2E8F0]">
              {filteredLeads.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">Click any row to open the underwriting briefing</p>
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, lead ID…"
            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] pl-9 pr-4 py-2 text-xs text-[#1F2937] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none"
          />
        </div>
      </div>

      {/* Filter + sort row */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#EEF1F5] text-xs">
        <span className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide text-slate-400 mr-1">
          <Filter className="h-3 w-3" /> Filter
        </span>

        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectClass}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All categories" : c}
            </option>
          ))}
        </select>

        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectClass}>
          <option value="All">All statuses</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="In Review">In Review</option>
          <option value="Converted">Converted</option>
        </select>

        <select value={selectedScoreBand} onChange={(e) => setSelectedScoreBand(e.target.value)} className={selectClass}>
          <option value="All">All score bands</option>
          <option value="HOT LEAD">Hot (score 78+)</option>
          <option value="WARM LEAD">Warm (score 58–77)</option>
          <option value="NURTURE">Nurture (score &lt; 58)</option>
        </select>

        <select
          value={selectedEligibility}
          onChange={(e) => setSelectedEligibility(e.target.value)}
          className={selectClass}
        >
          <option value="All">All eligibility</option>
          <option value="Loan-Eligible">Loan-Eligible</option>
          <option value="Conditionally Eligible">Conditionally Eligible</option>
          <option value="Needs Review">Needs Review</option>
        </select>

        <span className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide text-slate-400 ml-2 mr-1">
          <ArrowUpDown className="h-3 w-3" /> Sort
        </span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className={selectClass}
        >
          {(Object.keys(SORT_LABELS) as SortField[]).map((f) => (
            <option key={f} value={f}>
              {SORT_LABELS[f]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSortAsc((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-[#1F7A63] hover:text-[#1F7A63]"
          title={sortAsc ? "Ascending" : "Descending"}
        >
          {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {sortAsc ? "Asc" : "Desc"}
        </button>

        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-[#1F7A63]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-slate-500 font-semibold">
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleColumnSort("name")}>
                <span className="inline-flex items-center gap-1">Customer <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="p-3">Product</th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleColumnSort("amount")}>
                <span className="inline-flex items-center gap-1">Amount <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleColumnSort("score")}>
                <span className="inline-flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="p-3 cursor-pointer select-none" onClick={() => toggleColumnSort("eligibility")}>
                <span className="inline-flex items-center gap-1">Eligibility <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F5] text-slate-700">
            {filteredLeads.map((lead) => {
              const isHot = /HOT/i.test(lead.score_band);
              const elig = eligibilityOf(lead);
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                >
                  <td className="p-3">
                    <div className="font-semibold text-[#1F2937] group-hover:text-[#1F7A63] transition-colors">
                      {lead.customer_name}
                    </div>
                    <div className="text-xs tabular-nums text-slate-400">{lead.phone}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-[#1F2937]">{lead.product_name}</div>
                    <div className="text-xs text-slate-400">{lead.loan_category}</div>
                  </td>
                  <td className="p-3 font-semibold tabular-nums text-[#1F2937]">
                    {formatINR(lead.requested_amount, true)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs tabular-nums font-semibold border ${
                        isHot
                          ? "border-emerald-200 bg-emerald-50 text-[#1F7A63]"
                          : "border-slate-200 bg-[#F5F7FA] text-slate-700"
                      }`}
                    >
                      {lead.lead_score}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ELIGIBILITY_STYLE[elig]}`}
                    >
                      {elig}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
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
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCallLead(lead);
                        }}
                        title="Start an AI voice call"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-[#1F7A63] hover:text-[#1F7A63] transition-all"
                      >
                        <PhoneCall className="h-3 w-3" />
                        Call
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-medium text-slate-600 group-hover:border-[#1F7A63] group-hover:text-[#1F7A63] transition-all">
                        Details
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
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

      {callLead && <CallWithAiModal lead={callLead} onClose={() => setCallLead(null)} />}
    </div>
  );
}
