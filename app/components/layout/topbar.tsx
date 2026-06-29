import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Icon } from "~/components/common/icon";
import { api } from "~/lib/api";
import { can, type SessionUser } from "~/lib/rbac";
import { Button } from "~/components/ui/button";
import type {
  CustomerListItemDto,
  FirearmResponse,
  StorageRecordResponse,
} from "~/lib/api-types";

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

function customerName(c: CustomerListItemDto) {
  return c.fullName || c.companyName || "Unnamed";
}

type CustomerSearchType = "name" | "email" | "phone";
type FirearmSearchType = "serialNumber" | "customerName";
type StorageSearchType = "serialNumber" | "customerName";

const CUSTOMER_SEARCH_TYPES: {
  value: CustomerSearchType;
  label: string;
  placeholder: string;
}[] = [
  { value: "name", label: "Name", placeholder: "Search customers by name…" },
  { value: "email", label: "Email", placeholder: "Search customers by email…" },
  { value: "phone", label: "Phone", placeholder: "Search customers by phone…" },
];

const FIREARM_SEARCH_TYPES: {
  value: FirearmSearchType;
  label: string;
  placeholder: string;
}[] = [
  { value: "serialNumber", label: "Serial", placeholder: "Search firearms by serial number…" },
  { value: "customerName", label: "Customer", placeholder: "Search firearms by customer name…" },
];

const STORAGE_SEARCH_TYPES: {
  value: StorageSearchType;
  label: string;
  placeholder: string;
}[] = [
  { value: "serialNumber", label: "Serial", placeholder: "Search storage by serial number…" },
  { value: "customerName", label: "Customer", placeholder: "Search storage by customer name…" },
];

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

  const isCustomers = pathname.startsWith("/customers");
  const isFirearms = pathname.startsWith("/firearms");
  const isStorage = pathname.startsWith("/storage");

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customerSearchType, setCustomerSearchType] = useState<CustomerSearchType>("name");
  const [firearmSearchType, setFirearmSearchType] = useState<FirearmSearchType>("serialNumber");
  const [storageSearchType, setStorageSearchType] = useState<StorageSearchType>("serialNumber");

  // Cached registry for global (non-context) pages
  const [cachedCustomers, setCachedCustomers] = useState<CustomerListItemDto[]>([]);
  const [cachedFirearms, setCachedFirearms] = useState<FirearmResponse[]>([]);
  const cacheLoaded = useRef(false);

  // Live search results
  const [liveCustomers, setLiveCustomers] = useState<CustomerListItemDto[]>([]);
  const [liveFirearms, setLiveFirearms] = useState<FirearmResponse[]>([]);
  const [liveStorage, setLiveStorage] = useState<StorageRecordResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on page navigation
  useEffect(() => {
    setQuery("");
    setOpen(false);
    setLiveCustomers([]);
    setLiveFirearms([]);
    setLiveStorage([]);
    setSearching(false);
    cacheLoaded.current = false;
  }, [pathname]);

  // Live search — active on contextual list/detail sections
  useEffect(() => {
    if (!isCustomers && !isFirearms && !isStorage) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setLiveCustomers([]);
      setLiveFirearms([]);
      setLiveStorage([]);
      setSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (isCustomers) {
          const result = await api.customers({ [customerSearchType]: trimmed, pageSize: 6 });
          setLiveCustomers(result.items ?? []);
        } else if (isFirearms) {
          const results = await api.firearms({ [firearmSearchType]: trimmed });
          setLiveFirearms((results ?? []).slice(0, 6));
        } else {
          const results = await api.storageActive({ [storageSearchType]: trimmed });
          setLiveStorage((results ?? []).slice(0, 6));
        }
      } catch {
        setLiveCustomers([]);
        setLiveFirearms([]);
        setLiveStorage([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    query,
    customerSearchType,
    firearmSearchType,
    storageSearchType,
    isCustomers,
    isFirearms,
    isStorage,
  ]);

  // Lazy-load cache for global (non-context) pages
  async function ensureCache() {
    if (isCustomers || isFirearms || isStorage) return;
    if (cacheLoaded.current) return;
    cacheLoaded.current = true;
    try {
      const [cs, fs] = await Promise.all([api.allCustomers(), api.firearms()]);
      setCachedCustomers(cs ?? []);
      setCachedFirearms(fs ?? []);
    } catch {
      /* best-effort */
    }
  }

  const q = query.trim().toLowerCase();

  const custMatches = isCustomers
    ? liveCustomers
    : !isFirearms && !isStorage && q
      ? cachedCustomers
          .filter((c) =>
            (customerName(c) + " " + (c.email ?? "")).toLowerCase().includes(q),
          )
          .slice(0, 4)
      : [];

  const fireMatches = isFirearms
    ? liveFirearms
    : !isCustomers && !isStorage && q
      ? cachedFirearms
          .filter((f) =>
            `${f.make ?? ""} ${f.model ?? ""} ${f.serialNumber ?? ""}`
              .toLowerCase()
              .includes(q),
          )
          .slice(0, 4)
      : [];

  const storageMatches = isStorage ? liveStorage : [];

  const showDropdown =
    open && (!!query.trim() || isCustomers || isFirearms || isStorage);
  const empty =
    custMatches.length + fireMatches.length + storageMatches.length === 0;

  const activePlaceholder = isCustomers
    ? (CUSTOMER_SEARCH_TYPES.find((s) => s.value === customerSearchType)?.placeholder ??
        "Search customers…")
    : isFirearms
      ? (FIREARM_SEARCH_TYPES.find((s) => s.value === firearmSearchType)?.placeholder ??
          "Search firearms…")
      : isStorage
        ? (STORAGE_SEARCH_TYPES.find((s) => s.value === storageSearchType)?.placeholder ??
            "Search storage…")
      : "Search customers, firearms, serials…";

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
          placeholder={activePlaceholder}
          onFocus={() => {
            setOpen(true);
            ensureCache();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          className="h-9.5 w-full rounded-[9px] border border-border2 bg-background px-3 pl-9 text-[13px] text-foreground outline-none focus:border-primary"
        />
        {showDropdown && (
          <div className="absolute left-0 right-0 top-11.5 z-50 max-h-105 animate-fade-in overflow-y-auto rounded-xl border border-border2 bg-card shadow-2xl">
            {isCustomers && (
              <div className="flex gap-1 border-b border-border2 px-2.5 py-2">
                {CUSTOMER_SEARCH_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (customerSearchType === t.value) return;
                      setCustomerSearchType(t.value);
                      setQuery("");
                      setLiveCustomers([]);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      customerSearchType === t.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {isFirearms && (
              <div className="flex gap-1 border-b border-border2 px-2.5 py-2">
                {FIREARM_SEARCH_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (firearmSearchType === t.value) return;
                      setFirearmSearchType(t.value);
                      setQuery("");
                      setLiveFirearms([]);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      firearmSearchType === t.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {isStorage && (
              <div className="flex gap-1 border-b border-border2 px-2.5 py-2">
                {STORAGE_SEARCH_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (storageSearchType === t.value) return;
                      setStorageSearchType(t.value);
                      setQuery("");
                      setLiveStorage([]);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      storageSearchType === t.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {query.trim() ? (
              searching ? (
                <div className="px-3.5 py-5 text-center text-[13px] text-dim">
                  Searching…
                </div>
              ) : empty ? (
                <div className="px-3.5 py-5 text-center text-[13px] text-dim">
                  No matches for "{query}"
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
                  <SearchSection
                    label="Storage Records"
                    items={storageMatches.map((record) => ({
                      icon: "box" as const,
                      color: "var(--status-purple)",
                      title: record.serialNumber || "Storage record",
                      sub: [record.customerName, record.storageLocation]
                        .filter(Boolean)
                        .join(" · "),
                      onClick: () => goto(`/storage/${record.id}`),
                    }))}
                  />
                </>
              )
            ) : null}
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
    icon: "users" | "target" | "box";
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
