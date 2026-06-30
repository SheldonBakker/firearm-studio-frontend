import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  cell: (row: T) => React.ReactNode;
}

/** Config-driven table styled to match the Firearm Studio prototype. */
export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  empty = "No records.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
}) {
  const alignCls = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                style={{ width: c.width }}
                className={cn(
                  "h-auto whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-wide text-dim",
                  alignCls(c.align),
                )}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, ri) => (
              <TableRow
                key={ri}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-line last:border-0",
                  onRowClick && "cursor-pointer hover:bg-secondary",
                )}
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      "px-4 py-3.5 align-middle text-foreground",
                      alignCls(c.align),
                    )}
                  >
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-dim"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
