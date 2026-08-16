export interface RegisterAccountingConnectionRequest {
  apiKey?: string | null;
  username?: string | null;
  password?: string | null;
  externalCompanyId: number;
}

export interface AccountingConnectionDetailsResponse {
  id: string;
  companyId: string;
  apiKey: boolean;
  username: boolean;
  password: boolean;
  externalCompanyId: number;
  externalCompanyName: string | null;
  lastValidatedAt: string;
  lastRegisteredByAuthUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AccountingConnectionResponse {
  connected: boolean;
  externalCompanyId: number;
  externalCompanyName: string | null;
  lastValidatedAt: string;
}
