import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Icon } from "~/components/common/icon";
import { customersApi } from "~/lib/api/customers/customers";
import { firearmsApi } from "~/lib/api/firearms/firearms";
import { storageApi } from "~/lib/api/storage/storage";
import { CustomerType } from "~/lib/types/enums";
import { formatPhoneForDisplay } from "~/lib/utils/phone";
import { PageActionsSlot } from "~/context/page-actions";
import type { CustomerListItemDto } from "~/lib/api/customers/types";
import type { FirearmResponse } from "~/lib/api/firearms/types";
import type { StorageRecordResponse } from "~/lib/api/storage/types";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/customers", title: "Customers" },
  { prefix: "/firearms", title: "Firearms" },
  { prefix: "/storage", title: "Storage Records" },
  { prefix: "/licences", title: "Licences" },
  { prefix: "/invoices", title: "Invoices" },
  { prefix: "/bookings/calendar", title: "Booking Calendar" },
  { prefix: "/bookings", title: "Bookings" },
  { prefix: "/facilities", title: "Facilities" },
  { prefix: "/packages", title: "Packages" },
  { prefix: "/register", title: "Range Register" },
  { prefix: "/team", title: "Team" },
  { prefix: "/audit", title: "Audit Log" },
  { prefix: "/settings", title: "Settings" },
];

function customerName(c: CustomerListItemDto) {
  if (c.customerType === CustomerType.Company) {
    return c.companyName || c.fullName || "Unnamed";
  }
  return c.fullName || c.companyName || "Unnamed";
}

type CustomerSearchType = "name" | "email" | "phone";
type FirearmSearchType = "serialNumber" | "customerName";
type StorageSearchType = "serialNumber" | "customerName";
type AuditSearchType = "fullName" | "action" | "entityType" | "createdOn";
type InvoiceSearchType = "customerName" | "invoiceNumber";

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

const AUDIT_SEARCH_TYPES: {
  value: AuditSearchType;
  label: string;
  placeholder: string;
}[] = [
  { value: "fullName", label: "User", placeholder: "Search audit by user name…" },
  { value: "action", label: "Action", placeholder: "Search audit by action…" },
  { value: "entityType", label: "Entity", placeholder: "Search audit by entity type…" },
  { value: "createdOn", label: "Date", placeholder: "Filter audit by date…" },
];

const INVOICE_SEARCH_TYPES: {
  value: InvoiceSearchType;
  label: string;
  placeholder: string;
}[] = [
  { value: "customerName", label: "Customer", placeholder: "Search invoices by customer name…" },
  { value: "invoiceNumber", label: "Invoice #", placeholder: "Search invoices by number…" },
];

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const title =
    TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "Firearm Studio";

  const isDashboard = pathname.startsWith("/dashboard");
  const isCustomers = pathname.startsWith("/customers");
  const isFirearms = pathname.startsWith("/firearms");
  const isStorage = pathname.startsWith("/storage");
  const isLicences = pathname.startsWith("/licences");
  const isAudit = pathname.startsWith("/audit");
  const isInvoices = pathname.startsWith("/invoices");

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customerSearchType, setCustomerSearchType] = useState<CustomerSearchType>("name");
  const [firearmSearchType, setFirearmSearchType] = useState<FirearmSearchType>("serialNumber");
  const [storageSearchType, setStorageSearchType] = useState<StorageSearchType>("serialNumber");
  const [auditSearchType, setAuditSearchType] = useState<AuditSearchType>("fullName");
  const [invoiceSearchType, setInvoiceSearchType] =
    useState<InvoiceSearchType>("customerName");

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
  const licenceNumberSearch =
    new URLSearchParams(search).get("licenceNumber") ?? "";
  const auditSearchParams = new URLSearchParams(search);
  const activeAuditSearchType =
    AUDIT_SEARCH_TYPES.find((type) => auditSearchParams.has(type.value))
      ?.value ?? auditSearchType;
  const auditSearchValue = auditSearchParams.get(activeAuditSearchType) ?? "";
  const invoiceSearchParams = new URLSearchParams(search);
  const activeInvoiceSearchType =
    INVOICE_SEARCH_TYPES.find((type) => invoiceSearchParams.has(type.value))
      ?.value ?? invoiceSearchType;
  const invoiceSearchValue =
    invoiceSearchParams.get(activeInvoiceSearchType) ?? "";

  // Reset on page navigation
  useEffect(() => {
    if (isLicences || isAudit || isInvoices) {
      if (isAudit) setAuditSearchType(activeAuditSearchType);
      if (isInvoices) setInvoiceSearchType(activeInvoiceSearchType);
      setQuery(
        isAudit
          ? auditSearchValue
          : isInvoices
            ? invoiceSearchValue
            : licenceNumberSearch,
      );
      setOpen(false);
      setLiveCustomers([]);
      setLiveFirearms([]);
      setLiveStorage([]);
      setSearching(false);
      cacheLoaded.current = false;
      return;
    }
    setQuery("");
    setOpen(false);
    setLiveCustomers([]);
    setLiveFirearms([]);
    setLiveStorage([]);
    setSearching(false);
    cacheLoaded.current = false;
  }, [
    pathname,
    isLicences,
    isAudit,
    isInvoices,
    licenceNumberSearch,
    activeAuditSearchType,
    auditSearchValue,
    activeInvoiceSearchType,
    invoiceSearchValue,
  ]);

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
          const result = await customersApi.list({ [customerSearchType]: trimmed, pageSize: 6 });
          setLiveCustomers(result.items ?? []);
        } else if (isFirearms) {
          const results = await firearmsApi.list({ [firearmSearchType]: trimmed });
          setLiveFirearms((results?.items ?? []).slice(0, 6));
        } else {
          const results = await storageApi.listActive({ [storageSearchType]: trimmed });
          setLiveStorage((results?.items ?? []).slice(0, 6));
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
    if (
      isCustomers ||
      isFirearms ||
      isStorage ||
      isLicences ||
      isAudit ||
      isInvoices
    )
      return;
    if (cacheLoaded.current) return;
    cacheLoaded.current = true;
    try {
      const [cs, fs] = await Promise.all([customersApi.all(), firearmsApi.all()]);
      setCachedCustomers(cs ?? []);
      setCachedFirearms(fs ?? []);
    } catch {
      /* best-effort */
    }
  }

  const q = query.trim().toLowerCase();

  const custMatches = isCustomers
    ? liveCustomers
    : !isFirearms && !isStorage && !isLicences && !isAudit && q
      ? cachedCustomers
          .filter((c) =>
            (customerName(c) + " " + (c.email ?? "")).toLowerCase().includes(q),
          )
          .slice(0, 4)
      : [];

  const fireMatches = isFirearms
    ? liveFirearms
    : !isCustomers && !isStorage && !isLicences && !isAudit && q
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
    open &&
    !isLicences &&
    (!!query.trim() ||
      isCustomers ||
      isFirearms ||
      isStorage ||
      isAudit ||
      isInvoices);
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
        : isLicences
          ? "Search licences by number…"
          : isAudit
            ? (AUDIT_SEARCH_TYPES.find((s) => s.value === auditSearchType)
                ?.placeholder ?? "Search audit logs…")
            : isInvoices
              ? (INVOICE_SEARCH_TYPES.find((s) => s.value === invoiceSearchType)
                  ?.placeholder ?? "Search invoices…")
              : "Search customers, firearms, serials…";

  function updateLicenceSearch(value: string) {
    setQuery(value);
    setOpen(false);
    const next = new URLSearchParams(search);
    next.delete("page");
    const licenceNumber = value.trim();
    if (licenceNumber) next.set("licenceNumber", licenceNumber);
    else next.delete("licenceNumber");
    navigate(
      {
        pathname,
        search: next.toString() ? `?${next.toString()}` : "",
      },
      { replace: true },
    );
  }

  function updateAuditSearch(value: string, searchType = auditSearchType) {
    setQuery(value);
    const next = new URLSearchParams(search);
    for (const type of AUDIT_SEARCH_TYPES) next.delete(type.value);
    next.delete("page");
    const auditQuery = value.trim();
    if (auditQuery) next.set(searchType, auditQuery);
    navigate(
      {
        pathname,
        search: next.toString() ? `?${next.toString()}` : "",
      },
      { replace: true },
    );
  }

  function updateInvoiceSearch(value: string, searchType = invoiceSearchType) {
    setQuery(value);
    const next = new URLSearchParams(search);
    for (const type of INVOICE_SEARCH_TYPES) next.delete(type.value);
    next.delete("page");
    const invoiceQuery = value.trim();
    if (invoiceQuery) next.set(searchType, invoiceQuery);
    navigate(
      {
        pathname,
        search: next.toString() ? `?${next.toString()}` : "",
      },
      { replace: true },
    );
  }

  function goto(to: string) {
    setOpen(false);
    setQuery("");
    navigate(to);
  }

  return (
    <header className="relative z-50 flex min-h-16 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-2.5 border-b border-border bg-card/70 px-4 py-2.5 backdrop-blur sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border2 bg-secondary text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Icon name="list" size={18} />
      </button>
      <div className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-foreground sm:flex-none sm:text-[17px]">
        {title}
      </div>

      {!isDashboard && (
      <div className="relative order-last w-full min-w-0 sm:order-none sm:ml-auto sm:w-85">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
          <Icon name="search" size={16} />
        </span>
        <input
          value={query}
          type={isAudit && auditSearchType === "createdOn" ? "date" : "search"}
          placeholder={activePlaceholder}
          onFocus={() => {
            if (isLicences) return;
            setOpen(true);
            ensureCache();
          }}
          onChange={(e) => {
            if (isLicences) {
              updateLicenceSearch(e.target.value);
              return;
            }
            if (isAudit) {
              updateAuditSearch(e.target.value);
              setOpen(true);
              return;
            }
            if (isInvoices) {
              updateInvoiceSearch(e.target.value);
              setOpen(true);
              return;
            }
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          className="h-10 w-full rounded-[9px] border border-border2 bg-background px-3 pl-9 text-[16px] text-foreground outline-none focus:border-primary sm:h-9.5 sm:text-[13px]"
        />
        {showDropdown && (
          <div className="absolute left-0 right-0 top-11.5 z-50 max-h-105 animate-fade-in overflow-y-auto rounded-xl border border-border2 bg-card shadow-2xl">
            {isCustomers && (
              <div className="flex flex-wrap gap-1 border-b border-border2 px-2.5 py-2">
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
              <div className="flex flex-wrap gap-1 border-b border-border2 px-2.5 py-2">
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
              <div className="flex flex-wrap gap-1 border-b border-border2 px-2.5 py-2">
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
            {isAudit && (
              <div className="flex flex-wrap gap-1 border-b border-border2 px-2.5 py-2">
                {AUDIT_SEARCH_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (auditSearchType === t.value) return;
                      setAuditSearchType(t.value);
                      updateAuditSearch("", t.value);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      auditSearchType === t.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {isInvoices && (
              <div className="flex flex-wrap gap-1 border-b border-border2 px-2.5 py-2">
                {INVOICE_SEARCH_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (invoiceSearchType === t.value) return;
                      setInvoiceSearchType(t.value);
                      updateInvoiceSearch("", t.value);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      invoiceSearchType === t.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {!isAudit && !isInvoices && query.trim() ? (
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
                      sub: c.email || (c.phone ? formatPhoneForDisplay(c.phone, "ZA") : ""),
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
      )}

      <PageActionsSlot
        className={`ml-auto flex shrink-0 items-center gap-2.5${
          isDashboard ? "" : " sm:ml-0"
        }`}
      />
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
