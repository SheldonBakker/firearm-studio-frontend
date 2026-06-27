/** List/detail page header: title + optional subtitle + right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[21px] font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1.5 text-[13px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </div>
  );
}
