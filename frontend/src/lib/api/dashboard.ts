import { apiClient } from "./client";
import { DashboardKPIs, LeadSourceDatum, SalesDashboardLeadItem } from "../types/contracts";
import { useJourneyStore } from "../../store/journey-store";
import {
  MOCK_DASHBOARD_KPIS,
  MOCK_LEAD_TREND_DATA,
  MOCK_PRODUCT_DEMAND_DATA,
  MOCK_SCORE_DISTRIBUTION_DATA,
  MOCK_LEAD_SOURCE_DATA,
  MOCK_SALES_LEADS,
} from "../mocks/dashboard";

export async function fetchDashboardData(): Promise<{
  kpis: DashboardKPIs;
  trends: typeof MOCK_LEAD_TREND_DATA;
  productDemand: typeof MOCK_PRODUCT_DEMAND_DATA;
  scoreDistribution: typeof MOCK_SCORE_DISTRIBUTION_DATA;
  leadSourceBreakdown: LeadSourceDatum[];
  leads: SalesDashboardLeadItem[];
}> {
  return apiClient(
    "/api/v1/dashboard",
    { method: "GET", headers: { "X-Role": useJourneyStore.getState().role || "" } },
    () => ({
      kpis: MOCK_DASHBOARD_KPIS,
      trends: MOCK_LEAD_TREND_DATA,
      productDemand: MOCK_PRODUCT_DEMAND_DATA,
      scoreDistribution: MOCK_SCORE_DISTRIBUTION_DATA,
      leadSourceBreakdown: MOCK_LEAD_SOURCE_DATA,
      leads: MOCK_SALES_LEADS,
    })
  );
}
