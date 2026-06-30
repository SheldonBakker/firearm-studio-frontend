import * as React from "react";
import { Input } from "~/components/ui/input";
import { getSouthAfricanNationalDigits } from "~/lib/utils/phone";
import { cn } from "~/lib/utils/cn";

type SouthAfricanPhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "inputMode" | "onChange" | "type" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function SouthAfricanPhoneInput({
  className,
  onValueChange,
  value,
  ...props
}: SouthAfricanPhoneInputProps) {
  const invalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const nationalDigits = getSouthAfricanNationalDigits(value);

  return (
    <div
      data-slot="south-african-phone-input"
      className={cn(
        "flex h-8 w-full min-w-0 overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid &&
          "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-2.5 text-sm text-foreground">
        <span aria-hidden="true">🇿🇦</span>
        <span className="font-medium">+27</span>
      </span>
      <Input
        {...props}
        type="tel"
        inputMode="tel"
        value={nationalDigits}
        onChange={(event) => {
          const digits = getSouthAfricanNationalDigits(event.target.value);
          onValueChange(digits ? `+27${digits}` : "");
        }}
        className="h-full rounded-none border-0 bg-transparent px-2.5 shadow-none focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 dark:bg-transparent dark:aria-invalid:border-0 dark:aria-invalid:ring-0"
      />
    </div>
  );
}
