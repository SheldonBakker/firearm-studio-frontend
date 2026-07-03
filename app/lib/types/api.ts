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

export interface FirearmLicenceListItemDto {
  id: string;
  licenceNumber: string | null;
  issuedOn: string | null;
  expiresOn: string;
  renewalDueOn: string;
  status: LicenceStatus;
}

export interface FirearmDetailResponse {
  id: string;
  customer: CustomerResponse | null;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
  notes: string | null;
  licences: FirearmLicenceListItemDto[] | null;
}

export interface CustomerFirearmListItemDto {
  id: string;
  make: string | null;
  model: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
}

export interface CustomerInvoiceListItemDto {
  id: string;
  invoiceNumber: string | null;
  invoiceMonth: string;
  total: number;
  status: InvoiceStatus;
}

export interface CustomerStorageRecordDto {
  id: string;
  firearmId: string;
  monthlyRate: number;
  storageStatus: StorageStatus;
  storedFrom: string;
  storedUntil: string | null;
}

export interface CustomerDetailResponse {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  firearms: CustomerFirearmListItemDto[] | null;
  invoices: CustomerInvoiceListItemDto[] | null;
  storageRecords: CustomerStorageRecordDto[] | null;
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

export interface ContactFormRequest {
  fullName: string | null;
  email: string | null;
  company: string | null;
  message: string | null;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
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

interface InvoiceLineResponse {
  id: string;
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  [k: string]: unknown;
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
  lines?: InvoiceLineResponse[] | null;
  payments?: PaymentResponse[] | null;
  [k: string]: unknown;
}

interface PaymentResponse {
  amount?: number | null;
  paidOn?: string | null;
  method?: string | null;
  reference?: string | null;
  [k: string]: unknown;
}

export interface InvoiceLineDto {
  id: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoicePaymentDto {
  id: string;
  amount: number;
  paidOn: string;
  method: PaymentMethod;
  reference: string | null;
}

export interface InvoiceDetailDto {
  id: string;
  customerId: string;
  invoiceNumber: string | null;
  invoiceMonth: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  sentAt: string | null;
  dueOn: string | null;
  lines: InvoiceLineDto[] | null;
  payments: InvoicePaymentDto[] | null;
}

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

interface LicenceFirearmDto {
  id: string;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
}

interface LicenceCustomerDto {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
}

export interface LicenceDetailDto {
  id: string;
  firearmId: string;
  licenceNumber: string | null;
  issuedOn: string | null;
  expiresOn: string;
  renewalDueOn: string;
  status: LicenceStatus;
  documentUrl: string | null;
  firearm: LicenceFirearmDto | null;
  customer: LicenceCustomerDto | null;
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
