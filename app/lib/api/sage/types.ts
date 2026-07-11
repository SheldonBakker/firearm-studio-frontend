export interface RegisterSageConnectionRequest {
  apiKey?: string | null;
  username?: string | null;
  password?: string | null;
  sageCompanyId: number;
}

export interface SageConnectionDetailsResponse {
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

export interface SageConnectionResponse {
  connected: boolean;
  sageCompanyId: number;
  sageCompanyName: string | null;
  lastValidatedAt: string;
}
