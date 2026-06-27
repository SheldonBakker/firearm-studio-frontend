import { cn } from "~/lib/utils";

/** Monospace inline text for serials, references, numbers. */
export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("font-mono", className)}>{children}</span>;
}
