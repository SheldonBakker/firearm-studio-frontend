import { Suspense, use, type ReactNode } from "react";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * Suspends on `resolve` (React 19 `use()`), showing `fallback` until it
 * settles, then renders `children(value)`. The promise must be stable across
 * renders (compose it in the route's clientLoader, not inline in JSX).
 */
export function Resolve<T>({
  resolve,
  fallback,
  children,
}: {
  resolve: Promise<T>;
  fallback: ReactNode;
  children: (value: T) => ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <Unwrap resolve={resolve}>{children}</Unwrap>
    </Suspense>
  );
}

function Unwrap<T>({
  resolve,
  children,
}: {
  resolve: Promise<T>;
  children: (value: T) => ReactNode;
}) {
  return <>{children(use(resolve))}</>;
}

// ---- shaped skeletons ----

/** Mirrors DataTable: header bar + N rows. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex gap-4 border-b border-border bg-secondary px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4 flex-1"
              style={{ opacity: 1 - r * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Pill filter row + table. */
export function ListSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <TableSkeleton cols={cols} />
    </div>
  );
}

/** Dashboard stat-card grid. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8 rounded-[9px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Two-column key/value detail panel. */
export function KeyValueSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** Card-wrapped key/value (detail tab / settings panel). */
export function CardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <KeyValueSkeleton rows={rows} />
    </div>
  );
}

/** Detail-page header (title + badge) followed by a tab strip. */
export function DetailSkeleton() {
  return (
    <div>
      <div className="mb-5 space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mb-6 flex gap-4 border-b border-border pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      <CardSkeleton />
    </div>
  );
}

/** Dashboard "needs attention" list of cards. */
export function AttentionListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3"
        >
          <Skeleton className="h-2 w-2 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Full app shell skeleton for the initial-load HydrateFallback. */
export function AppShellSkeleton() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <aside className="flex w-[248px] shrink-0 flex-col gap-2 border-r border-border bg-sidebar p-4">
        <Skeleton className="mb-4 h-9 w-40" />
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-border px-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="ml-auto h-9 w-[340px] rounded-[9px]" />
          <Skeleton className="h-9 w-28 rounded-[9px]" />
        </div>
        <div className="flex-1 p-7">
          <div className="mx-auto max-w-[1280px] space-y-6">
            <Skeleton className="h-7 w-56" />
            <StatGridSkeleton />
            <TableSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
