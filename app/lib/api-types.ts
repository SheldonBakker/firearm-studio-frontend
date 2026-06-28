// Hand-written types mirroring swagger.json (#/components/schemas).
// Endpoints that declare only `200 OK` with no schema are typed loosely.

export type CustomerType = "Individual" | "Company";
export type FirearmStatus =
  | "InStorage"
  | "Released"
  | "PendingTransfer"
  | "Inactive";
type LicenceStatus = "Valid" | "RenewalDue" | "Expired" | "Unknown";
export type PaymentMethod = "Eft" | "Cash" | "Card" | "DebitOrder" | "Other";
export type Role = "Admin" | "Manager" | "Staff" | "Viewer";

export interface CurrentUserResponse {
  id: string;
  email: string | null;
  roles: string[] | null;
}

export interface AdminCheckResponse {
  isAdmin: boolean;
  id: string;
}

export interface CustomerResponse {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface CustomerListItemDto {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerListItemDtoPaginatedResponse {
  items: CustomerListItemDto[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateCustomerRequest {
  customerType: CustomerType;
  fullName?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerRequest {
  fullName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
}

export interface FirearmResponse {
  id: string;
  customerId: string;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
  notes: string | null;
}

export interface CreateFirearmRequest {
  customerId: string;
  make?: string | null;
  model?: string | null;
  calibre?: string | null;
  firearmType?: string | null;
  serialNumber?: string | null;
  internalReference?: string | null;
  notes?: string | null;
}

export interface UpdateFirearmRequest {
  model?: string | null;
  calibre?: string | null;
  firearmType?: string | null;
  notes?: string | null;
  status?: FirearmStatus;
}

export interface CreateLicenceRequest {
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn: string;
  documentUrl?: string | null;
}

export interface UpdateLicenceRequest {
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  status?: LicenceStatus;
  documentUrl?: string | null;
}

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

// PATCH /api/v1/company shares the same shape as CreateCompanyRequest.
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

export interface GenerateMonthlyInvoicesRequest {
  invoiceMonth: string; // date
  vatRate: number;
  dueDays: number;
}

export interface RecordPaymentRequest {
  amount: number;
  paidOn?: string | null;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export interface StartStorageRequest {
  storedFrom: string;
  monthlyRate: number;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  notes?: string | null;
}

export interface ReleaseStorageRequest {
  storedUntil?: string | null;
}

export interface InviteUserRequest {
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
}

export interface UpdateUserRoleRequest {
  role?: string | null;
}

// ---- Loosely-typed responses (no schema in swagger) ----
// The UI reads these defensively; shapes reflect the design prototype.

export interface InvoiceResponse {
  id: string;
  number?: string | null;
  customerId?: string | null;
  invoiceMonth?: string | null;
  subtotal?: number | null;
  vatAmount?: number | null;
  total?: number | null;
  status?: string | null;
  dueOn?: string | null;
  issuedOn?: string | null;
  payments?: PaymentResponse[] | null;
  [k: string]: unknown;
}

export interface PaymentResponse {
  amount?: number | null;
  paidOn?: string | null;
  method?: string | null;
  reference?: string | null;
  [k: string]: unknown;
}

export interface StorageRecordResponse {
  id: string;
  firearmId?: string | null;
  storedFrom?: string | null;
  storedUntil?: string | null;
  monthlyRate?: number | null;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  isActive?: boolean | null;
  [k: string]: unknown;
}

export interface LicenceResponse {
  id: string;
  firearmId?: string | null;
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  status?: LicenceStatus | string | null;
  documentUrl?: string | null;
  [k: string]: unknown;
}

export interface UserResponse {
  id: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  lastSignInAt?: string | null;
  [k: string]: unknown;
}

export interface AuditLogResponse {
  id: string;
  appUserId: string | null;
  entityType: string | null;
  entityId: string;
  action: string | null;
  createdAt: string;
}
