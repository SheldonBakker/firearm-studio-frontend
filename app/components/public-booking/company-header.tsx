import type { PublicCompanyResponse } from "~/lib/api/public/types";
import { formatPhoneForDisplay } from "~/lib/utils/phone";

export function CompanyHeader({
  company,
  embed,
}: {
  company: PublicCompanyResponse | null | undefined;
  embed: boolean;
}) {
  if (!company) return null;
  const addressLines = [
    company.addressLine1,
    company.addressLine2,
    [company.city, company.province].filter(Boolean).join(", ") || null,
    company.postalCode,
  ].filter(Boolean);
  return (
    <header className="space-y-2 border-b border-border pb-4">
      {!embed && (
        <h1 className="font-heading text-xl font-medium">
          {company.name ?? "Book a session"}
        </h1>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
        {embed && company.name && (
          <span className="font-medium text-foreground">{company.name}</span>
        )}
        {company.email && (
          <a
            href={`mailto:${company.email}`}
            className="hover:text-foreground hover:underline"
          >
            {company.email}
          </a>
        )}
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            className="hover:text-foreground hover:underline"
          >
            {formatPhoneForDisplay(company.phone, "ZA")}
          </a>
        )}
        {addressLines.length > 0 && <span>{addressLines.join(", ")}</span>}
      </div>
    </header>
  );
}
