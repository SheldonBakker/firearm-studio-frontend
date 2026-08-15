import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/common/phone-input";

export function DetailsStep({
  fullName,
  email,
  phone,
  error,
  onChange,
}: {
  fullName: string;
  email: string;
  phone: string;
  error: string | null;
  onChange: (field: "fullName" | "email" | "phone", value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Your details</h3>
        <p className="text-[12.5px] text-muted-foreground">
          Used for every session in your cart.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pb-name">
          Full name<span className="text-destructive"> *</span>
        </Label>
        <Input
          id="pb-name"
          value={fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          placeholder="Jane Mokoena"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pb-email">
          Email<span className="text-destructive"> *</span>
        </Label>
        <Input
          id="pb-email"
          type="email"
          value={email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="jane@example.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pb-phone">
          Phone<span className="text-destructive"> *</span>
        </Label>
        <PhoneInput
          id="pb-phone"
          value={phone}
          onValueChange={(v) => onChange("phone", v)}
          placeholder="68 150 1196"
        />
      </div>
      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
