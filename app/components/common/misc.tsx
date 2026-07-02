import { Icon } from "./icon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils/cn";

export function BackLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon name="back" size={15} />
      {label}
    </button>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="text-sm font-bold tracking-tight text-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}

function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-dim">
      {label}
    </div>
  );
}

export function ErrorState({
  message = "An unexpected error occurred.",
  onBack,
}: {
  message?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-16 text-center">
      <span style={{ color: "var(--status-red)" }}>
        <Icon name="alert" size={22} />
      </span>
      <div className="text-sm font-semibold text-foreground">
        Something went wrong
      </div>
      <div className="max-w-md text-xs text-muted-foreground">{message}</div>
      {onBack && (
        <Button variant="outline" size="lg" onClick={onBack} className="mt-3">
          <Icon name="back" size={15} />
          Go back
        </Button>
      )}
    </div>
  );
}

export function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl animate-fade-up px-4 pb-12 pt-5 sm:px-6 sm:pt-6 lg:px-7 lg:pb-16">
      {children}
    </div>
  );
}

export function StatDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", className)}
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
