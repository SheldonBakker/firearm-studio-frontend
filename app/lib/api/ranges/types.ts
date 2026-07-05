import type { DayOfWeek } from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

/** Times are "HH:mm:ss" as serialised by the API. */
interface OperatingHoursDto {
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
}

export interface ShootingRangeListItemDto {
  id: string;
  name: string | null;
  laneCount: number;
  slotIntervalMinutes: number;
  isActive: boolean;
}

export interface ShootingRangeResponse {
  id: string;
  name: string | null;
  description: string | null;
  laneCount: number;
  slotIntervalMinutes: number;
  isActive: boolean;
  operatingHours: OperatingHoursDto[] | null;
}

export interface CreateRangeRequest {
  name: string;
  description?: string | null;
  laneCount: number;
  slotIntervalMinutes: number;
  operatingHours?: OperatingHoursDto[] | null;
}

export interface UpdateRangeRequest {
  name?: string;
  description?: string | null;
  laneCount?: number;
  slotIntervalMinutes?: number;
  isActive?: boolean;
  operatingHours?: OperatingHoursDto[];
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

export type ShootingRangeListItemDtoPaginatedResponse =
  PaginatedResponse<ShootingRangeListItemDto>;
