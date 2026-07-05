import type { PaginatedResponse } from "../shared/pagination";

interface PackageItemDto {
  id: string;
  description: string | null;
  quantity: number;
  sortOrder: number;
}

interface PackageItemInput {
  description: string;
  quantity: number;
  sortOrder: number;
}

export interface PackageListItemDto {
  id: string;
  name: string | null;
  price: number;
  durationMinutes: number;
  maxShooters: number;
  isActive: boolean;
  itemCount: number;
}

export interface PackageResponse {
  id: string;
  name: string | null;
  description: string | null;
  price: number;
  durationMinutes: number;
  maxShooters: number;
  isActive: boolean;
  items: PackageItemDto[] | null;
}

export interface CreatePackageRequest {
  name: string;
  description?: string | null;
  price: number;
  durationMinutes: number;
  maxShooters: number;
  items?: PackageItemInput[] | null;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string | null;
  price?: number;
  durationMinutes?: number;
  maxShooters?: number;
  isActive?: boolean;
  items?: PackageItemInput[];
}

export type PackageListItemDtoPaginatedResponse =
  PaginatedResponse<PackageListItemDto>;
