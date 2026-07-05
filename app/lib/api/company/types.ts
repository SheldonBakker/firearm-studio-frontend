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

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  bankName?: string | null;
  bankAccountHolder?: string | null;
  bankAccountNumber?: string | null;
  bankBranchCode?: string | null;
  bankAccountType?: string | null;
  bankSwiftCode?: string | null;
}

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
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  bankAccountType: string | null;
  bankSwiftCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
