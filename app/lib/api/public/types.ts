export interface PublicCompanyResponse {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
}

interface PublicPackageItemDto {
  description: string | null;
  quantity: number;
}

export interface PublicPackageResponse {
  id: string;
  name: string | null;
  description: string | null;
  price: number;
  durationMinutes: number;
  maxShooters: number;
  items: PublicPackageItemDto[] | null;
}

interface PublicOperatingHoursDto {
  day: number;
  openTime: string;
  closeTime: string;
}

export interface PublicRangeResponse {
  id: string;
  name: string | null;
  description: string | null;
  operatingHours: PublicOperatingHoursDto[] | null;
}

export interface PublicBookingOptionsResponse {
  company: PublicCompanyResponse;
  packages: PublicPackageResponse[] | null;
  ranges: PublicRangeResponse[] | null;
}

export interface AvailabilitySlotDto {
  startTime: string;
  endTime: string;
  remainingLanes: number;
}

export interface DayAvailabilityResponse {
  date: string;
  slots: AvailabilitySlotDto[] | null;
}

interface MonthAvailabilityDayDto {
  date: string;
  hasAvailability: boolean;
}

export interface MonthAvailabilityResponse {
  days: MonthAvailabilityDayDto[] | null;
}

interface PublicBookingSessionRequest {
  shootingRangeId: string;
  packageId: string;
  bookingDate: string;
  startTime: string;
  shooterCount: number;
  notes?: string | null;
}

export interface CreatePublicBookingRequest {
  sessions: PublicBookingSessionRequest[];
  fullName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface PublicBookingConfirmationResponse {
  id: string;
  bookingNumber: string | null;
  status: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  rangeName: string | null;
  packageName: string | null;
  packagePrice: number;
}

export interface PublicInvoiceBankingResponse {
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  bankAccountType: string | null;
  bankSwiftCode: string | null;
}

export interface PublicBookingResponse {
  invoiceId: string;
  invoiceNumber: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  bookings: PublicBookingConfirmationResponse[] | null;
  banking: PublicInvoiceBankingResponse | null;
}
