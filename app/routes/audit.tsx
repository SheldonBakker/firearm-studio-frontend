import { redirect, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/audit";
import { api } from "~/lib/api/client";
import { requireAuth } from "~/lib/api/auth";
import { canSeeNav } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { Mono } from "~/components/common/mono";
import { Button } from "~/components/ui/button";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import {
  AppRole,
  CustomerType,
  FirearmStatus,
  LicenceStatus,
  StorageStatus,
  enumKey,
} from "~/lib/types/enums";
import type {
  AuditLogListItemDtoPaginatedResponse,
  AuditLogResponse,
} from "~/lib/types/api";

const PAGE_SIZE = 20;
const MAX_DETAIL_FIELDS = 4;
const HIDDEN_FIELDS = new Set([
  "Id",
  "CompanyId",
  "CustomerId",
  "EntityId",
  "FirearmId",
  "CreatedAt",
  "UpdatedAt",
]);

const ENTITY_ENUMS: Record<string, Record<string, Record<string, number>>> = {
  Customer: { CustomerType },
  Firearm: { Status: FirearmStatus },
  Licence: { Status: LicenceStatus },
  StorageRecord: { StorageStatus },
  User: { Role: AppRole },
  AppUser: { Role: AppRole },
};

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "audit")) throw redirect("/dashboard");

  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const fullName = searchParams.get("fullName")?.trim() || undefined;
  const action = searchParams.get("action")?.trim() || undefined;
  const entityType = searchParams.get("entityType")?.trim() || undefined;
  const createdOn = searchParams.get("createdOn")?.trim() || undefined;

  return {
    logs: api
      .auditLogs({
        pageNumber,
        pageSize: PAGE_SIZE,
        fullName,
        action,
        entityType,
        createdOn,
      })
      .catch(
        () =>
          ({
            items: [],
            pageNumber,
            pageSize: PAGE_SIZE,
            totalCount: 0,
          }) satisfies AuditLogListItemDtoPaginatedResponse,
      ),
  };
}

export default function Audit({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { search } = useLocation();

  const navigatePage = (pageNumber: number) => {
    const next = new URLSearchParams(search);
    if (pageNumber <= 1) next.delete("page");
    else next.set("page", String(pageNumber));
    navigate(`/audit${next.toString() ? `?${next.toString()}` : ""}`);
  };

  return (
    <PageWrap>
      <PageHeader title="Audit Log" />
      <Resolve resolve={loaderData.logs} fallback={<TableSkeleton cols={4} />}>
        {(page) => (
          <>
            <DataTable<AuditLogResponse>
              rows={page.items ?? []}
              empty="No audit entries."
              columns={[
                {
                  key: "when",
                  header: "When",
                  width: "165px",
                  cell: (r) => (
                    <Mono className="text-[12px] text-muted-foreground">
                      {fmtAuditDateTime(r.createdAt)}
                    </Mono>
                  ),
                },
                {
                  key: "actor",
                  header: "Actor",
                  width: "220px",
                  cell: (r) => (
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-foreground">
                        {actorLabel(r)}
                      </div>
                      {r.user?.email && r.user.fullName && (
                        <div className="truncate text-[11.5px] text-dim">
                          {r.user.email}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "event",
                  header: "Event",
                  width: "180px",
                  cell: (r) => (
                    <div>
                      <div className="text-[12.5px] font-semibold text-foreground">
                        {[r.action, entityLabel(r.entityType)]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                      <Mono className="text-[11px] text-dim">
                        {shortId(r.entityId)}
                      </Mono>
                    </div>
                  ),
                },
                {
                  key: "details",
                  header: "Details",
                  cell: (r) => (
                    <div className="max-w-185 text-[12.5px] text-muted-foreground">
                      {auditDetails(r)}
                    </div>
                  ),
                },
              ]}
            />

            {page.totalCount > page.pageSize && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12.5px] text-muted-foreground">
                  Showing {(page.pageNumber - 1) * page.pageSize + 1}-
                  {Math.min(page.pageNumber * page.pageSize, page.totalCount)}{" "}
                  of {page.totalCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page.pageNumber <= 1}
                    onClick={() => navigatePage(page.pageNumber - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page.pageNumber * page.pageSize >= page.totalCount}
                    onClick={() => navigatePage(page.pageNumber + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Resolve>
    </PageWrap>
  );
}

function actorLabel(log: AuditLogResponse) {
  return log.user?.fullName || log.user?.email || "System";
}

function auditDetails(log: AuditLogResponse) {
  const oldValue = parseAuditValue(log.oldValue);
  const newValue = parseAuditValue(log.newValue);
  const action = log.action?.toLowerCase();
  const fields =
    action === "updated" && oldValue && newValue
      ? changedFields(log.entityType, oldValue, newValue)
      : newValue
        ? createdFields(log.entityType, newValue)
        : [];

  if (!fields.length) return "No displayable field changes";

  const visible = fields.slice(0, MAX_DETAIL_FIELDS);
  const suffix =
    fields.length > MAX_DETAIL_FIELDS
      ? `, +${fields.length - MAX_DETAIL_FIELDS} more`
      : "";
  return visible.join(", ") + suffix;
}

function changedFields(
  entityType: string | null | undefined,
  oldValue: AuditValue,
  newValue: AuditValue,
) {
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  return [...keys]
    .filter(isUsefulAuditField)
    .filter((key) => !valuesEqual(oldValue[key], newValue[key]))
    .map(
      (key) =>
        `${fieldLabel(key)}: ${formatAuditValue(
          entityType,
          key,
          oldValue[key],
        )} -> ${formatAuditValue(entityType, key, newValue[key])}`,
    );
}

function createdFields(
  entityType: string | null | undefined,
  newValue: AuditValue,
) {
  return Object.keys(newValue)
    .filter(isUsefulAuditField)
    .filter((key) => hasDisplayValue(newValue[key]))
    .map(
      (key) =>
        `${fieldLabel(key)}: ${formatAuditValue(entityType, key, newValue[key])}`,
    );
}

type AuditPrimitive = string | number | boolean | null;
type AuditValue = Record<string, AuditPrimitive | AuditPrimitive[] | object>;

function parseAuditValue(value: string | null | undefined): AuditValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as AuditValue;
  } catch {
    return null;
  }
}

function isUsefulAuditField(key: string) {
  return !HIDDEN_FIELDS.has(key) && !key.includes("Ciphertext");
}

function valuesEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasDisplayValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function fieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function formatAuditValue(
  entityType: string | null | undefined,
  key: string,
  value: unknown,
) {
  if (!hasDisplayValue(value)) return "empty";
  const enumName = enumAuditValue(entityType, key, value);
  if (enumName) return fieldLabel(enumName);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return fmtAuditDateTime(value);
  }
  if (typeof value === "object") return "object";
  return String(value);
}

function enumAuditValue(
  entityType: string | null | undefined,
  key: string,
  value: unknown,
) {
  if (typeof value !== "number" || !entityType) return null;
  const enumObj = ENTITY_ENUMS[entityType]?.[key];
  return enumObj ? enumKey(enumObj, value) : null;
}

function entityLabel(entityType: string | null | undefined) {
  return entityType ? fieldLabel(entityType) : "Record";
}

function shortId(id: string | null | undefined) {
  return id ? id.slice(0, 8) : "-";
}

function fmtAuditDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
