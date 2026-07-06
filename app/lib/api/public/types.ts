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

export interface CreatePublicBookingRequest {
  shootingRangeId: string;
  packageId: string;
  bookingDate: string;
  startTime: string;
  shooterCount: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface PublicBookingConfirmationResponse {
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
