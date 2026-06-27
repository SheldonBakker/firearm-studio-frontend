import type { Role } from "./api-types";

export interface SessionUser {
  id: string;
  email: string | null;
  roles: Role[];
}

export const ROLE_RANK: Record<Role, number> = {
  Owner: 4,
  Admin: 3,
  Clerk: 2,
  Viewer: 1,
};

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
  | "team"
  | "audit"
  | "settings";

// Discrete write/action capabilities consulted by every mutating control.
export type Action =
  | "registry:write" // create/edit customers, firearms, storage, licences
  | "invoices:write" // generate, record payment, send, cancel
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
      return isAtLeast(user, "Clerk");
    case "team:manage":
    case "settings:write":
      return isAtLeast(user, "Admin");
    default:
      return false;
  }
}

/** Coerce arbitrary role strings from the API into known Role values. */
export function normalizeRoles(roles: string[] | null | undefined): Role[] {
  const known: Role[] = ["Owner", "Admin", "Clerk", "Viewer"];
  const out = (roles ?? [])
    .map((r) => known.find((k) => k.toLowerCase() === r.toLowerCase()))
    .filter((r): r is Role => Boolean(r));
  return out.length ? out : ["Viewer"];
}
