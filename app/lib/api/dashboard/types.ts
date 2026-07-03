interface LicenceAlertsDto {
  renewalDue: number;
  expired: number;
}

export interface DashboardStatsResponse {
  activeStorageCount: number;
  totalMonthlyRate: number;
  firearmsCount: number;
  outstandingAmount: number;
  overdueCount: number;
  licenceAlerts: LicenceAlertsDto;
}
