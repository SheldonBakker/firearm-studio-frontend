import type { Role } from "../api/users/types";

export interface SessionUser {
  id: string;
  email: string | null;
  roles: Role[];
}

const ROLE_ALIASES: Record<string, Role> = {
  owner: "Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  clerk: "Staff",
  viewer: "Viewer",
};

const ROLE_RANK: Record<Role, number> = {
  Admin: 4,
  Manager: 3,
  Staff: 2,
  Viewer: 1,
};

export function canonicalRole(role: string | null | undefined): Role | null {
  if (!role) return null;
  return ROLE_ALIASES[role.toLowerCase()] ?? null;
}

/** Highest-privilege role the user holds (defaults to Viewer). */
export function primaryRole(user: SessionUser): Role {
  return (
    user.roles.slice().sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0] ?? "Viewer"
  );
}

function isAtLeast(user: SessionUser, role: Role): boolean {
  return ROLE_RANK[primaryRole(user)] >= ROLE_RANK[role];
}

// Navigation sections keyed to routes.
export type NavKey =
  | "dashboard"
  | "customers"
  | "firearms"
  | "storage"
  | "licences"
  | "invoices"
  | "bookings"
  | "ranges"
  | "packages"
  | "team"
  | "audit"
  | "settings";

// Discrete write/action capabilities consulted by every mutating control.
export type Action =
  | "registry:write" // create/edit customers, firearms, storage, licences
  | "invoices:write" // generate, record payment, send, cancel
  | "bookings:write" // ranges, packages, bookings + status actions
  | "bookings:delete-attendee"
  | "team:manage" // invite / role / deactivate users
  | "settings:write"; // company settings

const ADMIN_ONLY_NAV: NavKey[] = ["team", "audit", "settings"];

/** Whether a nav section is visible for this user. */
export function canSeeNav(user: SessionUser, key: NavKey): boolean {
  if (ADMIN_ONLY_NAV.includes(key)) return isAtLeast(user, "Admin");
  return true;
}

/** Whether the user may perform a mutating action. Viewer can do none. */
export function can(user: SessionUser, action: Action): boolean {
  switch (action) {
    case "registry:write":
    case "invoices:write":
    case "bookings:write":
      return isAtLeast(user, "Staff");
    case "bookings:delete-attendee":
      return isAtLeast(user, "Manager");
    case "team:manage":
    case "settings:write":
      return isAtLeast(user, "Admin");
    default:
      return false;
  }
}

/** Coerce arbitrary role strings from the API into known Role values. */
export function normalizeRoles(roles: string[] | null | undefined): Role[] {
  const out = (roles ?? [])
    .map((r) => canonicalRole(r))
    .filter((r): r is Role => Boolean(r));
  return out.length ? out : ["Viewer"];
}
