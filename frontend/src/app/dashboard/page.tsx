"use client";

import { useState } from "react";
import {
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { DashboardKPIsSection } from "@/components/dashboard/DashboardKPIsSection";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { LeadDetailDrawer } from "@/components/dashboard/LeadDetailDrawer";
import { fetchDashboardData } from "@/lib/api/dashboard";
import { SalesDashboardLeadItem, DashboardKPIs } from "@/lib/types/contracts";
import {
  MOCK_DASHBOARD_KPIS,
  MOCK_LEAD_TREND_DATA,
  MOCK_PRODUCT_DEMAND_DATA,
  MOCK_SCORE_DISTRIBUTION_DATA,
  MOCK_SALES_LEADS,
} from "@/lib/mocks/dashboard";
import { toast } from "sonner";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs>(MOCK_DASHBOARD_KPIS);
  const [trendData, setTrendData] = useState(MOCK_LEAD_TREND_DATA);
  const [productDemand, setProductDemand] = useState(MOCK_PRODUCT_DEMAND_DATA);
  const [scoreDistribution, setScoreDistribution] = useState(MOCK_SCORE_DISTRIBUTION_DATA);
  const [leads, setLeads] = useState<SalesDashboardLeadItem[]>(MOCK_SALES_LEADS);
  const [selectedLead, setSelectedLead] = useState<SalesDashboardLeadItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDashboardData();
      setKpis(data.kpis);
      setTrendData(data.trends);
      setProductDemand(data.productDemand);
      setScoreDistribution(data.scoreDistribution);
      setLeads(data.leads);
      toast.success("Dashboard data refreshed from underwriting API.", { id: "refresh" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh dashboard data", { id: "refresh" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (leadId: string, newStatus: SalesDashboardLeadItem["status"]) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleExportCSV = () => {
    toast.success("Exported 142 leads to encrypted CSV queue.", { id: "export" });
  };

  return (
    <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#E8F5F1] px-2 py-0.5 text-[11px] font-bold text-[#1F7A63] border border-emerald-100">
                RETAIL LENDING INTELLIGENCE
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#1F7A63] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#1F7A63]" />
                Live Underwriting Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight">
              Retail Lending Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Scored inbound borrower applications prioritized for retail loan sanction officers.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-[#1F7A63]" />
              <span>Last 7 Days</span>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#081C2D] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 1. KPIs & Pipeline Section */}
        <DashboardKPIsSection kpis={kpis} />

        {/* 2. Visualizations Section */}
        <DashboardCharts
          trendData={trendData}
          productDemandData={productDemand}
          scoreDistributionData={scoreDistribution}
        />

        {/* 3. Inbound Leads Table */}
        <LeadsTable leads={leads} onSelectLead={(lead) => setSelectedLead(lead)} />
      </div>

      {/* Lead Intelligence Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </main>
  );
}
