export interface RegisterAccountingConnectionRequest {
  apiKey?: string | null;
  username?: string | null;
  password?: string | null;
  sageCompanyId: number;
}

export interface AccountingConnectionDetailsResponse {
  id: string;
  companyId: string;
  apiKey: boolean;
  username: boolean;
  password: boolean;
  sageCompanyId: number;
  sageCompanyName: string | null;
  lastValidatedAt: string;
  lastRegisteredByAuthUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AccountingConnectionResponse {
  connected: boolean;
  sageCompanyId: number;
  sageCompanyName: string | null;
  lastValidatedAt: string;
}
