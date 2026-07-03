export interface CreateCompanyRequest {
  name?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

export type UpdateCompanyRequest = CreateCompanyRequest;

export interface CompanyDetailsResponse {
  id: string;
  name: string | null;
  registrationNumber: string | null;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
