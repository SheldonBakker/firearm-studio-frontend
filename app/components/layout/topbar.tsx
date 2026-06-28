import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Icon } from "~/components/common/icon";
import { api } from "~/lib/api";
import { can, type SessionUser } from "~/lib/rbac";
import { Button } from "~/components/ui/button";
import type { CustomerResponse, FirearmResponse } from "~/lib/api-types";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/customers", title: "Customers" },
  { prefix: "/firearms", title: "Firearms" },
  { prefix: "/storage", title: "Storage Records" },
  { prefix: "/licences", title: "Licences" },
  { prefix: "/invoices", title: "Invoices" },
  { prefix: "/team", title: "Team" },
  { prefix: "/audit", title: "Audit Log" },
  { prefix: "/settings", title: "Settings" },
];

function customerName(c: CustomerResponse) {
  return c.fullName || c.companyName || "Unnamed";
}

export function Topbar({
  user,
  onMenuClick,
}: {
  user: SessionUser;
  onMenuClick: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title =
    TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "Firearm Studio";

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [firearms, setFirearms] = useState<FirearmResponse[]>([]);
  const loaded = useRef(false);

  // Lazy-load the searchable registry on first focus.
  async function ensureData() {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const [cs, fs] = await Promise.all([api.customers(), api.firearms()]);
      setCustomers(cs ?? []);
      setFirearms(fs ?? []);
    } catch {
      /* search is best-effort */
    }
  }

  const q = query.trim().toLowerCase();
  const custMatches = q
    ? customers
        .filter((c) =>
          (customerName(c) + " " + (c.email ?? "")).toLowerCase().includes(q),
        )
        .slice(0, 4)
    : [];
  const fireMatches = q
    ? firearms
        .filter((f) =>
          `${f.make ?? ""} ${f.model ?? ""} ${f.serialNumber ?? ""}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 4)
    : [];
  const showResults = open && q.length > 0;
  const empty = custMatches.length + fireMatches.length === 0;

  function goto(to: string) {
    setOpen(false);
    setQuery("");
    navigate(to);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border bg-card/70 px-4 backdrop-blur sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border2 bg-secondary text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Icon name="list" size={18} />
      </button>
      <div className="hidden truncate text-[17px] font-bold tracking-tight text-foreground md:block">
        {title}
      </div>

      <div className="relative ml-auto w-full min-w-0 sm:w-85">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
          <Icon name="search" size={16} />
        </span>
        <input
          value={query}
          placeholder="Search customers, firearms, serials…"
          onFocus={() => {
            setOpen(true);
            ensureData();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          className="h-9.5 w-full rounded-[9px] border border-border2 bg-background px-3 pl-9 text-[13px] text-foreground outline-none focus:border-primary"
        />
        {showResults && (
          <div className="absolute left-0 right-0 top-11.5 z-50 max-h-105 animate-fade-in overflow-y-auto rounded-xl border border-border2 bg-card shadow-2xl">
            {empty ? (
              <div className="px-3.5 py-5 text-center text-[13px] text-dim">
                No matches for “{query}”
              </div>
            ) : (
              <>
                <SearchSection
                  label="Customers"
                  items={custMatches.map((c) => ({
                    icon: "users" as const,
                    color: "var(--status-teal)",
                    title: customerName(c),
                    sub: c.email || c.phone || "",
                    onClick: () => goto(`/customers/${c.id}`),
                  }))}
                />
                <SearchSection
                  label="Firearms"
                  items={fireMatches.map((f) => ({
                    icon: "target" as const,
                    color: "var(--status-blue)",
                    title: `${f.make ?? ""} ${f.model ?? ""}`.trim(),
                    sub: `${f.serialNumber ?? ""} · ${f.calibre ?? ""}`,
                    onClick: () => goto(`/firearms/${f.id}`),
                  }))}
                />
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/licences")}
        title="Alerts"
        className="relative flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[9px] border border-border2 bg-secondary text-muted-foreground hover:text-foreground"
      >
        <Icon name="bell" size={17} />
        <span
          className="absolute right-2.5 top-2 h-1.75 w-1.75 rounded-full"
          style={{ background: "var(--status-red)", border: "2px solid var(--secondary)" }}
        />
      </button>

      {can(user, "team:manage") && (
        <Button
          onClick={() => navigate("/team")}
          className="hidden shrink-0 sm:inline-flex"
        >
          <Icon name="plus" size={16} />
          Invite user
        </Button>
      )}
    </header>
  );
}

function SearchSection({
  label,
  items,
}: {
  label: string;
  items: {
    icon: "users" | "target";
    color: string;
    title: string;
    sub: string;
    onClick: () => void;
  }[];
}) {
  if (!items.length) return null;
  return (
    <div className="py-1.5">
      <div className="px-3.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wide text-dim">
        {label}
      </div>
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={it.onClick}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-secondary"
        >
          <span style={{ color: it.color }}>
            <Icon name={it.icon} size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-foreground">
              {it.title}
            </div>
            <div className="truncate font-mono text-[11.5px] text-muted-foreground">
              {it.sub}
            </div>
          </span>
        </button>
      ))}
    </div>
  );
}
