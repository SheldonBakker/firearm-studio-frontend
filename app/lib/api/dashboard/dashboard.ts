import { request } from "../http";
import type { DashboardStatsResponse } from "./types";

async function getStats(): Promise<DashboardStatsResponse> {
  const response = await request<DashboardStatsResponse>(
    "/api/v1/dashboard/stats",
  );
  return {
    activeStorageCount: response?.activeStorageCount ?? 0,
    totalMonthlyRate: response?.totalMonthlyRate ?? 0,
    firearmsCount: response?.firearmsCount ?? 0,
    outstandingAmount: response?.outstandingAmount ?? 0,
    overdueCount: response?.overdueCount ?? 0,
    licenceAlerts: {
      renewalDue: response?.licenceAlerts?.renewalDue ?? 0,
      expired: response?.licenceAlerts?.expired ?? 0,
    },
  };
}

export const dashboardApi = {
  stats: getStats,
};
