import type {
  AppRole,
  CustomerType,
  FirearmStatus,
  InvoiceStatus,
  LicenceStatus,
  PaymentMethod,
  StorageStatus,
} from "./enums";

export * from "./enums";

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

export interface UpdateStorageRecordRequest {
  storedFrom?: string | null;
  storedUntil?: string | null;
  monthlyRate?: number | null;
  storageStatus?: StorageStatus;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  notes?: string | null;
}

export interface InviteUserRequest {
  email?: string | null;
  fullName?: string | null;
  role?: AppRole | null;
}

export interface UpdateUserRoleRequest {
  role?: AppRole | null;
}

export interface InvoiceResponse {
  id: string;
  number?: string | null;
  customerId?: string | null;
  invoiceMonth?: string | null;
  subtotal?: number | null;
  vatAmount?: number | null;
  total?: number | null;
  status?: InvoiceStatus | null;
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

// Mirrors swagger StorageRecordDto (GET /api/v1/storage). The customer variant
// (GET /api/v1/storage/customer/{id}, CustomerStorageRecordDto) returns a subset,
// so all fields stay optional and the index signature is retained.
export interface StorageRecordResponse {
  id: string;
  firearmId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  serialNumber?: string | null;
  storageStatus?: StorageStatus | null;
  monthlyRate?: number | null;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  storedFrom?: string | null;
  storedUntil?: string | null;
  isActive?: boolean | null;
  [k: string]: unknown;
}

export interface LicenceResponse {
  id: string;
  firearmId?: string | null;
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  renewalDueOn?: string | null;
  status?: LicenceStatus | string | null;
  documentUrl?: string | null;
  [k: string]: unknown;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole | string;
  isActive: boolean;
  isLinked: boolean;
  [k: string]: unknown;
}

export interface AuditLogResponse {
  id: string;
  entityType: string | null;
  entityId: string;
  action: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: AuditLogUserDto | null;
}

interface AuditLogUserDto {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: AppRole | string | null;
}

export interface AuditLogListItemDtoPaginatedResponse {
  items: AuditLogResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface FirearmResponsePaginatedResponse {
  items: FirearmResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface InvoiceListItemDtoPaginatedResponse {
  items: InvoiceResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface LicenceListItemDtoPaginatedResponse {
  items: LicenceResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface StorageRecordDtoPaginatedResponse {
  items: StorageRecordResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface AppUserResponsePaginatedResponse {
  items: UserResponse[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

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
