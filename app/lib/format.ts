// Formatting + status presentation shared across pages.

/** South-African Rand, e.g. "R 1 234.50" (thin-space grouping like the design). */
export function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return (
    "R " +
    Number(n).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Compact money without cents for stat cards. */
export function fmtMoneyShort(n: number | null | undefined): string {
  return fmtMoney(n).replace(".00", "");
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const EMDASH = "—";

// status key -> [tailwind color token, label]
type StatusMeta = { color: string; label: string };

const STATUS: Record<string, StatusMeta> = {
  // firearm
  InStorage: { color: "var(--status-blue)", label: "In storage" },
  Released: { color: "var(--dim)", label: "Released" },
  PendingTransfer: { color: "var(--status-amber)", label: "Pending transfer" },
  Inactive: { color: "var(--dim)", label: "Inactive" },
  // licence
  Valid: { color: "var(--status-green)", label: "Valid" },
  RenewalDue: { color: "var(--status-amber)", label: "Renewal due" },
  Expired: { color: "var(--status-red)", label: "Expired" },
  Unknown: { color: "var(--dim)", label: "Unknown" },
  // invoice
  Paid: { color: "var(--status-green)", label: "Paid" },
  Sent: { color: "var(--status-blue)", label: "Sent" },
  Overdue: { color: "var(--status-red)", label: "Overdue" },
  Draft: { color: "var(--dim)", label: "Draft" },
  Cancelled: { color: "var(--dim)", label: "Cancelled" },
  // customer type
  Individual: { color: "var(--status-teal)", label: "Individual" },
  Company: { color: "var(--status-purple)", label: "Company" },
  // roles
  Owner: { color: "var(--brand)", label: "Owner" },
  Admin: { color: "var(--status-purple)", label: "Admin" },
  Clerk: { color: "var(--status-blue)", label: "Clerk" },
  Viewer: { color: "var(--dim)", label: "Viewer" },
};

export function statusMeta(key: string | null | undefined): StatusMeta {
  if (!key) return { color: "var(--dim)", label: EMDASH };
  return STATUS[key] ?? { color: "var(--dim)", label: key };
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
