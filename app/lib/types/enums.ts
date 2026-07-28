export const CustomerType = { Individual: 0, Company: 1 } as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const FirearmStatus = {
  InStorage: 0,
  Released: 1,
  PendingTransfer: 2,
  Inactive: 3,
} as const;
export type FirearmStatus = (typeof FirearmStatus)[keyof typeof FirearmStatus];

export const InvoiceStatus = {
  Draft: 0,
  Sent: 1,
  Paid: 2,
  Overdue: 3,
  Cancelled: 4,
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const LicenceStatus = {
  Valid: 0,
  RenewalDue: 1,
  Expired: 2,
  Unknown: 3,
} as const;
export type LicenceStatus = (typeof LicenceStatus)[keyof typeof LicenceStatus];

export const PaymentMethod = {
  Eft: 0,
  Cash: 1,
  Card: 2,
  DebitOrder: 3,
  Other: 4,
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const StorageStatus = { Active: 0, Released: 1, Cancelled: 2 } as const;
export type StorageStatus = (typeof StorageStatus)[keyof typeof StorageStatus];

export const AppRole = { Admin: 0, Manager: 1, Staff: 2, Viewer: 3 } as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const BookingStatus = {
  Pending: 0,
  Confirmed: 1,
  Completed: 2,
  Cancelled: 3,
  NoShow: 4,
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingSource = { Staff: 0, Online: 1 } as const;
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const DepositMode = { None: 0, FixedAmount: 1, Percentage: 2 } as const;
export type DepositMode = (typeof DepositMode)[keyof typeof DepositMode];

export const DayOfWeek = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export function enumNames(enumObj: Record<string, number>): string[] {
  return Object.keys(enumObj);
}

export function enumKey(
  enumObj: Record<string, number>,
  value: number | string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? Object.keys(enumObj)[value] : value;
}
