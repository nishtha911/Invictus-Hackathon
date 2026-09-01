"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/store/journey-store";
import {
  RefreshCw,
  Download,
  Phone,
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
  const router = useRouter();
  const { role } = useJourneyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && role !== "employee") {
      router.push("/login");
    }
  }, [mounted, role, router]);

  const [kpis, setKpis] = useState<DashboardKPIs>(MOCK_DASHBOARD_KPIS);
  const [trendData, setTrendData] = useState(MOCK_LEAD_TREND_DATA);
  const [productDemand, setProductDemand] = useState(MOCK_PRODUCT_DEMAND_DATA);
  const [scoreDistribution, setScoreDistribution] = useState(MOCK_SCORE_DISTRIBUTION_DATA);
  const [leads, setLeads] = useState<SalesDashboardLeadItem[]>(MOCK_SALES_LEADS);
  const [selectedLead, setSelectedLead] = useState<SalesDashboardLeadItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (role !== "employee") return;
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
  }, [role]);

  useEffect(() => {
    if (role === "employee") {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loadData, role]);

  if (!mounted || role !== "employee") {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-sm text-slate-500 font-medium">Checking authorization...</div>
      </main>
    );
  }

  const handleUpdateStatus = (leadId: string, newStatus: SalesDashboardLeadItem["status"]) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) {
      toast.error("No leads to export yet.", { id: "export" });
      return;
    }
    const headers = ["Lead ID", "Name", "Email", "Phone", "Product", "Category", "Requested Amount", "Score", "Band", "Status", "Created"];
    const rows = leads.map((l) => [
      l.id, l.customer_name, l.email, l.phone, l.product_name, l.loan_category,
      l.requested_amount, l.lead_score, l.score_band, l.status, l.created_at,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognis-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} lead${leads.length === 1 ? "" : "s"} to CSV.`, { id: "export" });
  };

  return (
    <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
              Sales Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#132443] tracking-tight">
              Inbound Lead Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Scored borrower applications from completed advisory sessions.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/voice-assistant")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1F7A63] bg-[#E8F5F1] px-3.5 py-2 text-xs font-semibold text-[#1F7A63] hover:bg-[#d7ece5] transition-colors cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call Log</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#132443] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
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
