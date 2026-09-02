import { apiClient } from "./client";
import {
  DashboardKPIs,
  DashboardSegment,
  LeadSourceDatum,
  SalesDashboardLeadItem,
} from "../types/contracts";
import { useJourneyStore } from "../../store/journey-store";
import {
  MOCK_DASHBOARD_KPIS,
  MOCK_LEAD_TREND_DATA,
  MOCK_PRODUCT_DEMAND_DATA,
  MOCK_SCORE_DISTRIBUTION_DATA,
  MOCK_LEAD_SOURCE_DATA,
  MOCK_ELIGIBILITY_DATA,
  MOCK_SALES_LEADS,
} from "../mocks/dashboard";

export interface DashboardData {
  meta: { is_live: boolean; source?: string; generated_at?: string };
  kpis: DashboardKPIs;
  trends: typeof MOCK_LEAD_TREND_DATA;
  productDemand: typeof MOCK_PRODUCT_DEMAND_DATA;
  scoreDistribution: typeof MOCK_SCORE_DISTRIBUTION_DATA;
  leadSourceBreakdown: LeadSourceDatum[];
  eligibilityBreakdown: DashboardSegment[];
  leads: SalesDashboardLeadItem[];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  return apiClient<DashboardData>(
    "/api/v1/dashboard",
    { method: "GET", headers: { "X-Role": useJourneyStore.getState().role || "" } },
    () => ({
      meta: { is_live: false, source: "sample" },
      kpis: MOCK_DASHBOARD_KPIS,
      trends: MOCK_LEAD_TREND_DATA,
      productDemand: MOCK_PRODUCT_DEMAND_DATA,
      scoreDistribution: MOCK_SCORE_DISTRIBUTION_DATA,
      leadSourceBreakdown: MOCK_LEAD_SOURCE_DATA,
      eligibilityBreakdown: MOCK_ELIGIBILITY_DATA,
      leads: MOCK_SALES_LEADS,
    })
  );
}
