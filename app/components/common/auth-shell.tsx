import { BrandMark } from "./brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-100 animate-fade-up">
          <div className="mb-7 flex flex-col items-center text-center">
            <BrandMark size={46} />
            <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {children}
          </div>
          {footer && (
            <div className="mt-5 text-center text-[13px] text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
