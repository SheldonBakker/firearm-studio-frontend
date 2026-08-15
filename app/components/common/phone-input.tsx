import * as React from "react";
import {
  getCountryCallingCode,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { COUNTRY_OPTIONS, flagEmoji } from "~/lib/utils/countries";
import { cn } from "~/lib/utils/cn";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "inputMode" | "onChange" | "type" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
  defaultCountry?: CountryCode;
};

function countryFromValue(value: string, fallback: CountryCode): CountryCode {
  if (!value) return fallback;
  try {
    const parsed = parsePhoneNumber(value);
    if (parsed?.country) return parsed.country;
  } catch {
  }
  return fallback;
}

function nationalDigitsOf(value: string, country: CountryCode): string {
  if (!value) return "";
  try {
    const parsed = parsePhoneNumber(value);
    if (parsed?.nationalNumber) return String(parsed.nationalNumber);
  } catch {
  }
  const callingCode = getCountryCallingCode(country);
  const digits = value.replace(/\D/g, "");
  return digits.startsWith(callingCode)
    ? digits.slice(callingCode.length)
    : digits;
}

function toE164(country: CountryCode, nationalDigits: string): string {
  if (!nationalDigits) return "";
  try {
    const parsed = parsePhoneNumber(nationalDigits, country);
    if (parsed) return parsed.number;
  } catch {
  }
  return `+${getCountryCallingCode(country)}${nationalDigits}`;
}

export function PhoneInput({
  className,
  value,
  onValueChange,
  defaultCountry = "ZA",
  ...props
}: PhoneInputProps) {
  const [country, setCountry] = React.useState<CountryCode>(() =>
    countryFromValue(value, defaultCountry),
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const derived = countryFromValue(value, country);
    if (value && derived !== country) setCountry(derived);
  }, [value, country]);

  const nationalDigits = nationalDigitsOf(value, country);
  const callingCode = getCountryCallingCode(country);
  const invalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <div
      data-slot="phone-input"
      className={cn(
        "flex h-8 w-full min-w-0 overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid &&
          "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Country: ${country} +${callingCode}`}
            className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-2.5 text-sm text-foreground outline-none focus-visible:bg-muted"
          >
            <span aria-hidden="true">{flagEmoji(country)}</span>
            <span className="font-medium">+{callingCode}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRY_OPTIONS.map((option) => (
                  <CommandItem
                    key={option.code}
                    value={`${option.name} ${option.code} +${option.callingCode}`}
                    onSelect={() => {
                      const digits = nationalDigitsOf(value, country);
                      setCountry(option.code);
                      onValueChange(toE164(option.code, digits));
                      setOpen(false);
                    }}
                  >
                    <span aria-hidden="true" className="mr-2">
                      {option.flag}
                    </span>
                    <span className="flex-1">{option.name}</span>
                    <span className="text-muted-foreground">
                      +{option.callingCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        {...props}
        type="tel"
        inputMode="tel"
        value={nationalDigits}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onValueChange(toE164(country, digits));
        }}
        className="h-full rounded-none border-0 bg-transparent px-2.5 shadow-none focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 dark:bg-transparent dark:aria-invalid:border-0 dark:aria-invalid:ring-0"
      />
    </div>
  );
}
