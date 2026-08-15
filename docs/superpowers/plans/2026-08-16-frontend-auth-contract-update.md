# Frontend Auth Contract Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the frontend to consume the backend's new two-factor login, phone-management, and international-phone auth contract, with an app-wide international phone input and a Playwright e2e suite.

**Architecture:** A plain Vite + React Router v8 SPA on Cloudflare Workers, React 19, TypeScript strict, Tailwind v4, shadcn/ui, Zod v4. Auth state lives in a React Context backed by a localStorage session store; API calls go through a hand-written fetch wrapper. This plan replaces the hardcoded South-African phone input with a country-aware one (via `libphonenumber-js`), adds the two-step 2FA login flow and a Settings security panel, and stands up Playwright e2e that reads WhatsApp OTPs from the WAHA HTTP API.

**Tech Stack:** React 19, React Router v8, TypeScript 5.9 (strict), Vite 8, Tailwind v4, shadcn/ui (radix-ui unified package + cmdk), Zod v4, Sonner, `libphonenumber-js`, `@playwright/test`.

**Spec:** docs/superpowers/specs/2026-08-16-frontend-auth-contract-update-design.md

## Global Constraints

- NO comments in code, anywhere. Standing user rule. Rationale goes in commit messages.
- No em-dash characters in code, comments, or commit messages; plain hyphen `-` only.
- Commit messages authored as the developer; no AI/Claude attribution, no `Co-Authored-By`.
- The pre-auth token is NEVER persisted: React state in the login route only, never localStorage, never the session store, never a cookie.
- All phone values cross the API boundary as E.164 (e.g. `+27681501196`).
- TypeScript strict; the build must stay clean.
- Never hardcode the WAHA key, host, or session id in any file; env vars only.
- Playwright e2e requires a running backend and frontend. The two backend migrations are now APPLIED to production, so that prerequisite is met.
- JSON on the wire is camelCase; error bodies are RFC7807 ProblemDetails with a top-level `code` string.

## Testing approach

This repo has NO test infrastructure and the user chose Playwright e2e only, not unit or component tests. Therefore most tasks cannot follow a red-green unit cycle. For every non-Playwright task the verification is:
1. `npm run typecheck` -> expected: exits 0 with no errors. (This runs `react-router typegen && wrangler types && tsc && tsc -p tsconfig.cloudflare.json`. `npx tsc --noEmit` is a faster inner check but `npm run typecheck` is authoritative.)
2. `npm run build` -> expected: `react-router build` completes with no errors and writes `build/`.
3. A concrete manual check (exact clicks and expected result) stated in the task.

There is no lint script and no ESLint config in this repo, so there is no lint step. Only Tasks 8 and 9 add and run automated tests (`npm run test:e2e`).

## File Structure

Created:
- `app/components/ui/popover.tsx` - shadcn Popover primitive (generated).
- `app/components/ui/command.tsx` - shadcn Command primitive (generated, uses cmdk).
- `app/lib/utils/countries.ts` - country list (ISO code, name, calling code, flag emoji) for the picker.
- `app/components/common/phone-input.tsx` - country-aware phone input emitting E.164.
- `app/lib/api/auth-errors.ts` - backend-error-code to user-copy mapping.
- `playwright.config.ts` - Playwright config, reads env, testDir `./e2e`.
- `e2e/tsconfig.json` - isolated TS config for e2e specs.
- `e2e/fixtures/waha.ts` - WAHA OTP-polling fixture.
- `e2e/login-2fa.spec.ts` - 2FA login end-to-end.
- `e2e/phone-verify.spec.ts` - phone add-and-verify end-to-end.
- `e2e/phone-rejection.spec.ts` - client-side phone rejection.

Modified:
- `app/lib/utils/phone.ts` - rewrite on `libphonenumber-js`; add `formatPhoneForDisplay` (Task 2).
- `app/components/modals/form-dialog.tsx` - route `type: "tel"` to the new schemas and `PhoneInput`.
- `app/routes/onboarding.tsx` - use `PhoneInput` + new schema/helper.
- `app/routes/public-calendar.tsx` - use `requiredPhoneSchema`.
- `app/components/public-booking/details-step.tsx` - use `PhoneInput`.
- `app/components/common/south-african-phone-input.tsx` - DELETED.
- `app/routes/customers.tsx`, `app/routes/customer-detail.tsx`, `app/routes/invoice-detail.tsx`, `app/routes/licence-detail.tsx`, `app/routes/settings.tsx`, `app/routes/firearms.tsx`, `app/components/public-booking/review-step.tsx`, `app/components/public-booking/company-header.tsx`, `app/components/layout/topbar.tsx`, `app/components/modals/booking-form-dialog.tsx` - display formatting (Task 2).
- `app/lib/api/error.ts` - `ApiError.code` + surface `code`.
- `app/lib/api/http.ts` - pass `code` into `ApiError`.
- `app/lib/api/auth.ts` - `LoginResult` union, `loginVerify`, phone on `register`/`acceptInvite`, `code` in throw.
- `app/lib/api/users/types.ts` - `phoneNumber` on request/response.
- `app/lib/api/me/types.ts` - four new fields on `CurrentUserResponse`.
- `app/lib/api/me/me.ts` - `enableTwoFactor`/`disableTwoFactor`/`updatePhone`/`verifyPhone`.
- `app/context/auth-context.tsx` - `messageForApiError`, `signIn` challenge return, `verifyLoginCode`, phone params.
- `app/components/common/verify-code-form.tsx` - `allowResend` opt-out.
- `app/routes/login.tsx` - two-step 2FA flow.
- `app/routes/settings.tsx` - Security panel + loader `me` (Task 6).
- `app/routes/signup.tsx`, `app/routes/accept-invite.tsx`, `app/routes/team.tsx` - optional phone fields.
- `package.json` - add `libphonenumber-js`, `@playwright/test`, `dotenv`, e2e scripts.
- `tsconfig.json` - exclude `e2e`.
- `.env.example` - document e2e env vars.

---

### Task 1: App-wide international PhoneInput, phone.ts rewrite, FormDialog rewiring

**Files:**
- Create: `app/components/ui/popover.tsx`
- Create: `app/components/ui/command.tsx`
- Create: `app/lib/utils/countries.ts`
- Create: `app/components/common/phone-input.tsx`
- Modify: `app/lib/utils/phone.ts` (full rewrite)
- Modify: `app/components/modals/form-dialog.tsx:14,24-27,278-286,449-473`
- Modify: `app/routes/onboarding.tsx:16,21-24,93,175-196`
- Modify: `app/routes/public-calendar.tsx:19,59`
- Modify: `app/components/public-booking/details-step.tsx:3,53-57`
- Delete: `app/components/common/south-african-phone-input.tsx`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Produces `PhoneInput` (`app/components/common/phone-input.tsx`): props `Omit<React.ComponentProps<"input">, "inputMode" | "onChange" | "type" | "value"> & { value: string; onValueChange: (value: string) => void; defaultCountry?: CountryCode }`.
- Produces `app/lib/utils/phone.ts` exports: `optionalPhoneSchema` (Zod, transforms to E.164 or `""`), `requiredPhoneSchema` (Zod, transforms to E.164), `getPhoneError(value: string): string | null`.
- Produces `app/lib/utils/countries.ts` exports: `CountryOption` interface, `flagEmoji(code: string): string`, `COUNTRY_OPTIONS: CountryOption[]`.
- Consumes nothing from other tasks.

- [ ] **Step 1: Install `libphonenumber-js`.** Run:
  ```
  npm install libphonenumber-js
  ```
  Expected: `libphonenumber-js` appears under `dependencies` in `package.json` and `package-lock.json` updates, exit 0.

- [ ] **Step 2: Generate the shadcn Popover and Command primitives.** Run:
  ```
  npx shadcn@latest add popover command
  ```
  Expected: creates `app/components/ui/popover.tsx` and `app/components/ui/command.tsx`, installs `cmdk`. Confirm the generated exports exist (used later):
  ```
  grep -E "export .*(Popover|PopoverTrigger|PopoverContent)" app/components/ui/popover.tsx
  grep -E "export .*(Command|CommandInput|CommandList|CommandEmpty|CommandGroup|CommandItem)" app/components/ui/command.tsx
  ```
  Expected: both greps print matching export lines. If the CLI cannot reach the network, stop and report; do not hand-roll substitutes.

- [ ] **Step 3: Create `app/lib/utils/countries.ts`.** Write exactly:
  ```ts
  import {
    getCountries,
    getCountryCallingCode,
    type CountryCode,
  } from "libphonenumber-js";

  export interface CountryOption {
    code: CountryCode;
    name: string;
    callingCode: string;
    flag: string;
  }

  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  export function flagEmoji(code: string): string {
    return code
      .toUpperCase()
      .replace(/./g, (character) =>
        String.fromCodePoint(127397 + character.charCodeAt(0)),
      );
  }

  export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
    .map((code) => ({
      code,
      name: regionNames.of(code) ?? code,
      callingCode: getCountryCallingCode(code),
      flag: flagEmoji(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  ```

- [ ] **Step 4: Rewrite `app/lib/utils/phone.ts`.** Replace the entire file contents with:
  ```ts
  import { z } from "zod";
  import {
    isValidPhoneNumber,
    parsePhoneNumber,
  } from "libphonenumber-js";

  function e164Error(value: string): string {
    try {
      const country = parsePhoneNumber(value)?.country;
      if (country) return `Enter a valid phone number for ${country}.`;
    } catch {
    }
    return "Enter a valid phone number, including the country code.";
  }

  function normalizeE164(value: string): string {
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed) return parsed.number;
    } catch {
    }
    return value;
  }

  export const optionalPhoneSchema = z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) return;
      if (!isValidPhoneNumber(value)) {
        ctx.addIssue({ code: "custom", message: e164Error(value) });
      }
    })
    .transform((value) => (value ? normalizeE164(value) : ""));

  export const requiredPhoneSchema = z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: "custom", message: "Phone number is required." });
        return;
      }
      if (!isValidPhoneNumber(value)) {
        ctx.addIssue({ code: "custom", message: e164Error(value) });
      }
    })
    .transform((value) => normalizeE164(value));

  export function getPhoneError(value: string): string | null {
    if (!value) return null;
    return isValidPhoneNumber(value) ? null : e164Error(value);
  }
  ```

- [ ] **Step 5: Create `app/components/common/phone-input.tsx`.** Write exactly:
  ```tsx
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
  ```

- [ ] **Step 6: Rewire `FormDialog` imports.** In `app/components/modals/form-dialog.tsx`, replace the `SouthAfricanPhoneInput` import line (`:14`):
  ```tsx
  import { PhoneInput } from "~/components/common/phone-input";
  ```
  and replace the phone-schema import block (`:24-27`):
  ```tsx
  import {
    optionalPhoneSchema,
    requiredPhoneSchema,
  } from "~/lib/utils/phone";
  ```

- [ ] **Step 7: Point `schemaForField` at the new schemas.** In `app/components/modals/form-dialog.tsx` (`:278-286`), replace the `tel` branch:
  ```tsx
    if (field.type === "tel") {
      return field.required ? requiredPhoneSchema : optionalPhoneSchema;
    }
  ```

- [ ] **Step 8: Render `PhoneInput` in `FormDialog`.** In `app/components/modals/form-dialog.tsx` (`:449-473`), replace the `<SouthAfricanPhoneInput ... />` element with:
  ```tsx
                  <PhoneInput
                    id={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={values[f.name]}
                    onValueChange={(value) => set(f.name, value)}
                    onBlur={() => {
                      const result = schemaForField(f).safeParse(
                        values[f.name] ?? "",
                      );
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        if (!result.success) {
                          next[f.name] = result.error.issues[0]?.message;
                        } else delete next[f.name];
                        return next;
                      });
                    }}
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors[f.name])}
                    aria-describedby={
                      fieldErrors[f.name] ? `${f.name}-error` : undefined
                    }
                  />
  ```

- [ ] **Step 9: Migrate `onboarding.tsx` imports.** In `app/routes/onboarding.tsx`, replace the input import (`:16`):
  ```tsx
  import { PhoneInput } from "~/components/common/phone-input";
  ```
  and replace the phone-util import block (`:21-24`):
  ```tsx
  import {
    getPhoneError,
    optionalPhoneSchema,
  } from "~/lib/utils/phone";
  ```

- [ ] **Step 10: Update the onboarding phone schema use.** In `app/routes/onboarding.tsx` (`:93`), replace:
  ```tsx
          phone: optionalPhoneSchema,
  ```

- [ ] **Step 11: Update the onboarding phone render block.** In `app/routes/onboarding.tsx` (`:175-196`), replace the `<SouthAfricanPhoneInput ... />` element with:
  ```tsx
                  <PhoneInput
                    id={f.key}
                    value={values.phone ?? ""}
                    onValueChange={(value) => set("phone", value)}
                    onBlur={() => {
                      const phoneError = getPhoneError(values.phone ?? "");
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        if (phoneError) next.phone = phoneError;
                        else delete next.phone;
                        return next;
                      });
                    }}
                    autoComplete="tel"
                    placeholder="68 150 1196"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? "onboarding-phone-error" : undefined
                    }
                  />
  ```

- [ ] **Step 12: Migrate `public-calendar.tsx`.** In `app/routes/public-calendar.tsx`, replace the schema import (`:19`):
  ```tsx
  import { requiredPhoneSchema } from "~/lib/utils/phone";
  ```
  and the schema use (`:59`):
  ```tsx
    phone: requiredPhoneSchema,
  ```

- [ ] **Step 13: Migrate `details-step.tsx`.** In `app/components/public-booking/details-step.tsx`, replace the import (`:3`):
  ```tsx
  import { PhoneInput } from "~/components/common/phone-input";
  ```
  and the render element (`:53-57`):
  ```tsx
          <PhoneInput
            id="pb-phone"
            value={phone}
            onValueChange={(v) => onChange("phone", v)}
            placeholder="68 150 1196"
          />
  ```

- [ ] **Step 14: Delete the old component.** Run:
  ```
  rm app/components/common/south-african-phone-input.tsx
  ```
  Then confirm nothing still imports it:
  ```
  grep -rn "south-african-phone-input\|SouthAfricanPhoneInput\|SouthAfrican\|getSouthAfrican" app
  ```
  Expected: no matches.

- [ ] **Step 15: Typecheck.** Run `npm run typecheck`. Expected: exits 0, no errors.

- [ ] **Step 16: Build.** Run `npm run build`. Expected: `react-router build` completes, writes `build/`, exit 0.

- [ ] **Step 17: Manual check.** Run `npm run dev`, open the public booking page `http://localhost:5173/book/<any-company-id>`, reach the details step. Expected: the phone field shows a country button with a flag and `+27`; clicking it opens a searchable country list; typing `South` filters to South Africa; picking a different country updates the dial code; typing `681501196` keeps digits in the field. In `/onboarding` (after signing in with a fresh account) the company phone field behaves the same.

---

### Task 2: Phone display formatting

**Files:**
- Modify: `app/lib/utils/phone.ts` (add `formatPhoneForDisplay`)
- Modify: `app/routes/customers.tsx:96`
- Modify: `app/routes/customer-detail.tsx:245`
- Modify: `app/routes/invoice-detail.tsx:244`
- Modify: `app/routes/licence-detail.tsx:148`
- Modify: `app/routes/settings.tsx:287`
- Modify: `app/routes/firearms.tsx:268`
- Modify: `app/components/public-booking/review-step.tsx:114`
- Modify: `app/components/public-booking/company-header.tsx:36-43`
- Modify: `app/components/layout/topbar.tsx:545`
- Modify: `app/components/modals/booking-form-dialog.tsx:49`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Consumes `parsePhoneNumber`, `CountryCode` from `libphonenumber-js` (added in Task 1).
- Produces `formatPhoneForDisplay(value: string | null | undefined, viewerCountry?: CountryCode): string` in `app/lib/utils/phone.ts`.
- The 10 display sites pass `"ZA"` as `viewerCountry` (SA-focused app: ZA numbers render nationally, others internationally).

- [ ] **Step 1: Add `formatPhoneForDisplay` to `app/lib/utils/phone.ts`.** Append these two things. First, extend the top import to also bring `CountryCode`:
  ```ts
  import {
    isValidPhoneNumber,
    parsePhoneNumber,
    type CountryCode,
  } from "libphonenumber-js";
  ```
  Then add at the end of the file:
  ```ts
  export function formatPhoneForDisplay(
    value: string | null | undefined,
    viewerCountry?: CountryCode,
  ): string {
    if (!value) return "—";
    try {
      const parsed = parsePhoneNumber(value);
      if (!parsed) return value;
      return viewerCountry && parsed.country === viewerCountry
        ? parsed.formatNational()
        : parsed.formatInternational();
    } catch {
      return value;
    }
  }
  ```

- [ ] **Step 2: Format the customers table cell.** In `app/routes/customers.tsx`, add the import near the other `~/lib/utils` imports:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the cell body (`:96`) `{r.phone ?? "—"}` with:
  ```tsx
            {formatPhoneForDisplay(r.phone, "ZA")}
  ```

- [ ] **Step 3: Format the customer-detail phone row.** In `app/routes/customer-detail.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone pair (`:245`):
  ```tsx
                { k: "Phone", v: formatPhoneForDisplay(customer.phone, "ZA") },
  ```

- [ ] **Step 4: Format the invoice-detail phone row.** In `app/routes/invoice-detail.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone pair (`:244`):
  ```tsx
                { k: "Phone", v: formatPhoneForDisplay(customer.phone, "ZA") },
  ```

- [ ] **Step 5: Format the licence-detail phone row.** In `app/routes/licence-detail.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone pair (`:148`):
  ```tsx
                { k: "Phone", v: formatPhoneForDisplay(customer.phone, "ZA") },
  ```

- [ ] **Step 6: Format the company-settings phone row.** In `app/routes/settings.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone pair (`:287`):
  ```tsx
              { k: "Phone", v: <Mono>{formatPhoneForDisplay(c.phone, "ZA")}</Mono> },
  ```

- [ ] **Step 7: Format the firearms customer-search description.** In `app/routes/firearms.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the description line (`:268`) so the phone part is formatted only when present:
  ```tsx
                        description: [
                          c.email,
                          c.phone ? formatPhoneForDisplay(c.phone, "ZA") : null,
                        ]
                          .filter(Boolean)
                          .join(" · "),
  ```

- [ ] **Step 8: Format the review-step phone row.** In `app/components/public-booking/review-step.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone row (`:114`):
  ```tsx
            <ReviewRow label="Phone" value={formatPhoneForDisplay(phone, "ZA")} />
  ```

- [ ] **Step 9: Format the company-header label, keep the tel href raw.** In `app/components/public-booking/company-header.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the phone anchor block (`:37-42`) so the href stays raw E.164 and only the visible label is formatted:
  ```tsx
          <a
            href={`tel:${company.phone}`}
            className="hover:text-foreground hover:underline"
          >
            {formatPhoneForDisplay(company.phone, "ZA")}
          </a>
  ```

- [ ] **Step 10: Format the topbar search sub-label.** In `app/components/layout/topbar.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the sub line (`:545`) so an absent phone stays empty (not `—`):
  ```tsx
                      sub: c.email || (c.phone ? formatPhoneForDisplay(c.phone, "ZA") : ""),
  ```

- [ ] **Step 11: Format the booking-form-dialog search description.** In `app/components/modals/booking-form-dialog.tsx`, add:
  ```tsx
  import { formatPhoneForDisplay } from "~/lib/utils/phone";
  ```
  and replace the description line (`:49`):
  ```tsx
      description: [
        c.email,
        c.phone ? formatPhoneForDisplay(c.phone, "ZA") : null,
      ]
        .filter(Boolean)
        .join(" · "),
  ```

- [ ] **Step 12: Typecheck.** Run `npm run typecheck`. Expected: exits 0.

- [ ] **Step 13: Build.** Run `npm run build`. Expected: completes, exit 0.

- [ ] **Step 14: Manual check.** With `npm run dev`, open a customer detail page whose phone is `+27681501196`. Expected: the Phone row reads `068 150 1196` (national ZA format), not `+27681501196`. On the public booking company header, the phone link text is formatted but its `href` is still `tel:+27681501196` (inspect the element).

---

### Task 3: API layer, error mapping, and auth context

This task changes `authApi.login`'s return type to a discriminated union and rewires its only consumer, the auth context, in the same task so the tree stays green. It bundles the error-code mapping and the auth-context changes because the context's `signIn` depends on both the new `login` union and the new `messageForApiError` helper. The final steps prove `npm run typecheck` and `npm run build` are both green.

**Files:**
- Modify: `app/lib/api/error.ts` (full rewrite)
- Modify: `app/lib/api/http.ts:60-63,111-114`
- Modify: `app/lib/api/auth.ts:1-8,96-99,148-200`
- Modify: `app/lib/api/users/types.ts:6-24`
- Modify: `app/lib/api/me/types.ts:1-5`
- Modify: `app/lib/api/me/me.ts`
- Create: `app/lib/api/auth-errors.ts`
- Modify: `app/context/auth-context.tsx`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Produces `ApiError` with a fourth constructor arg `code?: string` and public `code` field.
- Produces `extractErrorMessage(res): Promise<{ message: string; code?: string; body?: unknown }>`.
- Produces in `app/lib/api/auth.ts`: `interface TwoFactorChallenge { requiresTwoFactor: true; preAuthToken: string }`, `type LoginResult = { kind: "tokens"; tokens: AuthTokens } | { kind: "challenge"; preAuthToken: string }`, `authApi.login(email, password): Promise<LoginResult>`, `authApi.loginVerify(preAuthToken, code): Promise<AuthTokens>`, `authApi.register(email, password, phoneNumber?)`, `authApi.acceptInvite(email, code, password, phoneNumber?)`.
- Produces in `app/lib/api/me/me.ts`: `meApi.enableTwoFactor()`, `meApi.disableTwoFactor(password)`, `meApi.updatePhone(phoneNumber)`, `meApi.verifyPhone(code)`.
- Produces `CurrentUserResponse` with `twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, `pendingPhoneNumber`; `UserResponse`/`InviteUserRequest` with `phoneNumber`.
- Produces `messageForApiError(err: unknown): string` in `app/lib/api/auth-errors.ts`.
- Produces on the auth context: `signIn(email, password): Promise<{ error: string | null; preAuthToken: string | null }>`, `verifyLoginCode(preAuthToken, code): Promise<{ error: string | null }>`, `signUp(email, password, phoneNumber?)`, `acceptInvite(email, code, password, phoneNumber?)`.
- Consumes nothing from other tasks.

- [ ] **Step 1: Rewrite `app/lib/api/error.ts`.** Replace the whole file with:
  ```ts
  export class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public body?: unknown,
      public code?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }

  export async function extractErrorMessage(res: Response): Promise<{
    message: string;
    code?: string;
    body?: unknown;
  }> {
    let body: unknown;
    let message = `${res.status} ${res.statusText}`;
    let code: string | undefined;
    try {
      body = await res.json();
      if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        const m = record.detail ?? record.message ?? record.title;
        if (typeof m === "string") message = m;
        if (typeof record.code === "string") code = record.code;
      }
    } catch {
    }
    return { message, code, body };
  }
  ```

- [ ] **Step 2: Pass `code` in `http.ts` `request`.** In `app/lib/api/http.ts` (`:60-63`), replace:
  ```ts
    if (!res.ok) {
      const { message, code, body } = await extractErrorMessage(res);
      throw new ApiError(res.status, message, body, code);
    }
  ```

- [ ] **Step 3: Pass `code` in `http.ts` `requestBlob`.** In `app/lib/api/http.ts` (`:111-114`), replace:
  ```ts
    if (!res.ok) {
      const { message, code, body } = await extractErrorMessage(res);
      throw new ApiError(res.status, message, body, code);
    }
  ```

- [ ] **Step 4: Pass `code` in `auth.ts` `authRequest`.** In `app/lib/api/auth.ts` (`:96-99`), replace:
  ```ts
    if (!res.ok) {
      const { message, code, body: errBody } = await extractErrorMessage(res);
      throw new ApiError(res.status, message, errBody, code);
    }
  ```

- [ ] **Step 5: Add the login union types to `auth.ts`.** In `app/lib/api/auth.ts`, directly after the `AuthTokens` interface (after `:8`), insert:
  ```ts
  export interface TwoFactorChallenge {
    requiresTwoFactor: true;
    preAuthToken: string;
  }

  export type LoginResult =
    | { kind: "tokens"; tokens: AuthTokens }
    | { kind: "challenge"; preAuthToken: string };

  function isTwoFactorChallenge(body: unknown): body is TwoFactorChallenge {
    return (
      typeof body === "object" &&
      body !== null &&
      (body as Record<string, unknown>).requiresTwoFactor === true &&
      typeof (body as Record<string, unknown>).preAuthToken === "string"
    );
  }
  ```

- [ ] **Step 6: Replace `login`, add `loginVerify`, add phone to `register`/`acceptInvite`.** In `app/lib/api/auth.ts`, within the `authApi` object (`:148-200`), replace the `register`, `login`, and `acceptInvite` members and add `loginVerify` so the object reads:
  ```ts
  export const authApi = {
    register: (email: string, password: string, phoneNumber?: string | null) =>
      authRequest<void>("/api/v1/auth/register", {
        email,
        password,
        phoneNumber: phoneNumber ? phoneNumber : null,
      }),

    verifyEmail: async (email: string, code: string) => {
      const tokens = await authRequest<AuthTokens>("/api/v1/auth/verify-email", {
        email,
        code,
      });
      storeTokens(tokens);
      return tokens;
    },

    resendCode: (email: string, purpose: "EmailConfirmation" | "PasswordReset" | "Invite") =>
      authRequest<void>("/api/v1/auth/resend-code", { email, purpose }),

    login: async (email: string, password: string): Promise<LoginResult> => {
      const body = await authRequest<AuthTokens | TwoFactorChallenge>(
        "/api/v1/auth/login",
        { email, password },
      );
      if (isTwoFactorChallenge(body)) {
        return { kind: "challenge", preAuthToken: body.preAuthToken };
      }
      storeTokens(body);
      return { kind: "tokens", tokens: body };
    },

    loginVerify: async (preAuthToken: string, code: string): Promise<AuthTokens> => {
      const tokens = await authRequest<AuthTokens>("/api/v1/auth/login/verify", {
        preAuthToken,
        code,
      });
      storeTokens(tokens);
      return tokens;
    },

    logout: async () => {
      const current = readTokens();
      clearTokens();
      if (!current) return;
      try {
        await authRequest<void>("/api/v1/auth/logout", {
          refreshToken: current.refreshToken,
        });
      } catch {
      }
    },

    forgotPassword: (email: string) =>
      authRequest<void>("/api/v1/auth/forgot-password", { email }),

    resetPassword: (email: string, code: string, newPassword: string) =>
      authRequest<void>("/api/v1/auth/reset-password", { email, code, newPassword }),

    acceptInvite: async (
      email: string,
      code: string,
      password: string,
      phoneNumber?: string | null,
    ) => {
      const tokens = await authRequest<AuthTokens>("/api/v1/auth/accept-invite", {
        email,
        code,
        password,
        phoneNumber: phoneNumber ? phoneNumber : null,
      });
      storeTokens(tokens);
      return tokens;
    },
  };
  ```

- [ ] **Step 7: Add the four fields to `CurrentUserResponse`.** In `app/lib/api/me/types.ts` (`:1-5`), replace the `CurrentUserResponse` interface:
  ```ts
  export interface CurrentUserResponse {
    id: string;
    email: string | null;
    roles: string[] | null;
    twoFactorEnabled: boolean;
    phoneNumber: string | null;
    phoneNumberConfirmed: boolean;
    pendingPhoneNumber: string | null;
  }
  ```

- [ ] **Step 8: Add the authenticated 2FA and phone methods to `meApi`.** In `app/lib/api/me/me.ts`, replace the whole file with:
  ```ts
  import { request } from "../http";
  import type { AdminCheckResponse, CurrentUserResponse } from "./types";

  export const meApi = {
    me: () => request<CurrentUserResponse>("/api/v1/me"),
    adminCheck: () => request<AdminCheckResponse>("/api/v1/me/admin-check"),

    enableTwoFactor: () =>
      request<void>("/api/v1/auth/two-factor/enable", { method: "POST" }),

    disableTwoFactor: (password: string) =>
      request<void>("/api/v1/auth/two-factor/disable", {
        method: "POST",
        body: { password },
      }),

    updatePhone: (phoneNumber: string) =>
      request<void>("/api/v1/users/me/phone", {
        method: "POST",
        body: { phoneNumber },
      }),

    verifyPhone: (code: string) =>
      request<void>("/api/v1/users/me/phone/verify", {
        method: "POST",
        body: { code },
      }),
  };
  ```

- [ ] **Step 9: Add `phoneNumber` to the user types.** In `app/lib/api/users/types.ts` (`:6-24`), replace the `InviteUserRequest` and `UserResponse` interfaces:
  ```ts
  export interface InviteUserRequest {
    email?: string | null;
    fullName?: string | null;
    role?: AppRole | null;
    phoneNumber?: string | null;
  }

  export interface UpdateUserRoleRequest {
    role?: AppRole | null;
  }

  export interface UserResponse {
    id: string;
    email: string;
    fullName: string | null;
    role: AppRole | string;
    isActive: boolean;
    isLinked: boolean;
    phoneNumber: string | null;
    [k: string]: unknown;
  }
  ```

- [ ] **Step 10: Create `app/lib/api/auth-errors.ts`.** Write exactly:
  ```ts
  import { ApiError } from "./error";

  const CODE_COPY: Record<string, string> = {
    "Auth.InvalidCredentials": "Email address or password is incorrect.",
    "Auth.EmailNotConfirmed":
      "Confirm your email address first. Request a new code if yours has expired.",
    "Auth.LockedOut":
      "This account is temporarily locked after too many failed attempts. Try again later.",
    "Auth.RegistrationFailed":
      "We couldn't create that account. Check your details and try again.",
    "Auth.CodeInvalid": "That code isn't valid. Check it and try again.",
    "Auth.CodeExpired": "That code has expired. Request a new one.",
    "Auth.CodeAttemptsExceeded":
      "Too many incorrect attempts. Request a new code.",
    "Auth.RefreshInvalid": "Your session has expired. Sign in again.",
    "Auth.PasswordRejected":
      "That password was rejected. Choose a stronger one and try again.",
    "Auth.UnknownPurpose": "We couldn't process that request. Try again.",
    "Auth.PurposeNotResendable":
      "This code can't be resent. Start over to get a new one.",
    "Auth.ChallengeUnavailable":
      "Too many codes requested recently. Try again shortly.",
    "Auth.PreAuthInvalid":
      "Your sign-in attempt has expired. Enter your email and password again.",
    "Auth.TwoFactorNotEnabled":
      "Two-factor authentication isn't enabled on this account.",
    "Auth.PhoneMissing": "There's no phone change in progress.",
    "Auth.NoPendingPhoneChange":
      "There's no pending phone change to confirm. Start again.",
    "Auth.PhoneChannelUnavailable":
      "We couldn't send a code to that number right now. Try again shortly.",
  };

  export function messageForApiError(err: unknown): string {
    if (!(err instanceof ApiError)) {
      return err instanceof Error
        ? err.message
        : "Something went wrong. Try again.";
    }
    if (err.status === 429) {
      return "Too many codes requested recently. Try again shortly.";
    }
    if (err.status === 502) {
      return "We couldn't send a code to that number right now. Please try again.";
    }
    if (err.code && CODE_COPY[err.code]) {
      return CODE_COPY[err.code];
    }
    return err.message;
  }
  ```

- [ ] **Step 11: Swap the context error helper import.** In `app/context/auth-context.tsx`, remove the line `import { ApiError } from "~/lib/api/http";` and add:
  ```tsx
  import { messageForApiError } from "~/lib/api/auth-errors";
  ```

- [ ] **Step 12: Delete the local `messageFor` helper.** In `app/context/auth-context.tsx`, delete the function:
  ```tsx
  function messageFor(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    return err instanceof Error ? err.message : "Something went wrong. Try again.";
  }
  ```

- [ ] **Step 13: Extend the context type.** In `app/context/auth-context.tsx`, replace the `AuthContextValue` interface with:
  ```tsx
  interface AuthContextValue {
    status: AuthStatus;
    user: SessionUser | null;
    isLoggedIn: boolean;
    signIn: (
      email: string,
      password: string,
    ) => Promise<{ error: string | null; preAuthToken: string | null }>;
    verifyLoginCode: (
      preAuthToken: string,
      code: string,
    ) => Promise<Result>;
    signUp: (
      email: string,
      password: string,
      phoneNumber?: string | null,
    ) => Promise<Result>;
    verifyEmail: (email: string, code: string) => Promise<Result>;
    resendCode: (
      email: string,
      purpose: "EmailConfirmation" | "PasswordReset" | "Invite",
    ) => Promise<Result>;
    requestPasswordReset: (email: string) => Promise<Result>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<Result>;
    acceptInvite: (
      email: string,
      code: string,
      password: string,
      phoneNumber?: string | null,
    ) => Promise<Result>;
    signOut: () => Promise<void>;
  }
  ```

- [ ] **Step 14: Rewrite `signIn` and add `verifyLoginCode`.** In `app/context/auth-context.tsx`, replace the existing `signIn` `useCallback` with these two callbacks:
  ```tsx
    const signIn = useCallback(async (email: string, password: string) => {
      try {
        const result = await authApi.login(email, password);
        if (result.kind === "challenge") {
          return { error: null, preAuthToken: result.preAuthToken };
        }
        await adoptSession();
        return { error: null, preAuthToken: null };
      } catch (err) {
        return { error: messageForApiError(err), preAuthToken: null };
      }
    }, []);

    const verifyLoginCode = useCallback(
      async (preAuthToken: string, code: string) => {
        try {
          await authApi.loginVerify(preAuthToken, code);
          await adoptSession();
          return { error: null };
        } catch (err) {
          return { error: messageForApiError(err) };
        }
      },
      [],
    );
  ```

- [ ] **Step 15: Add the phone parameter to `signUp`.** In `app/context/auth-context.tsx`, replace the `signUp` `useCallback`:
  ```tsx
    const signUp = useCallback(
      async (email: string, password: string, phoneNumber?: string | null) => {
        try {
          await authApi.register(email, password, phoneNumber);
          return { error: null };
        } catch (err) {
          return { error: messageForApiError(err) };
        }
      },
      [],
    );
  ```

- [ ] **Step 16: Add the phone parameter to `acceptInvite`.** In `app/context/auth-context.tsx`, replace the `acceptInvite` `useCallback`:
  ```tsx
    const acceptInvite = useCallback(
      async (
        email: string,
        code: string,
        password: string,
        phoneNumber?: string | null,
      ) => {
        try {
          await authApi.acceptInvite(email, code, password, phoneNumber);
          await adoptSession();
          return { error: null };
        } catch (err) {
          return { error: messageForApiError(err) };
        }
      },
      [],
    );
  ```

- [ ] **Step 17: Replace remaining `messageFor` call sites.** In `app/context/auth-context.tsx`, in `verifyEmail`, `resendCode`, `requestPasswordReset`, and `resetPassword`, replace each `messageFor(err)` with `messageForApiError(err)`. Confirm none remain:
  ```
  grep -n "messageFor(" app/context/auth-context.tsx
  ```
  Expected: no matches (only `messageForApiError` remains).

- [ ] **Step 18: Expose `verifyLoginCode` from the provider value.** In `app/context/auth-context.tsx`, in the `useMemo<AuthContextValue>` object add `verifyLoginCode,` immediately after `signIn,`, and add `verifyLoginCode` to the `useMemo` dependency array (after `signIn`). The value object and deps must both list it.

- [ ] **Step 19: Typecheck.** Run `npm run typecheck`. Expected: exits 0. The only consumer of `signIn` is `app/routes/login.tsx`, which reads `const { error } = await signIn(...)`; destructuring `error` from the widened return type compiles cleanly, so the tree is green here. The two-step login UI is built in Task 5.

- [ ] **Step 20: Build.** Run `npm run build`. Expected: `react-router build` completes, writes `build/`, exit 0.

- [ ] **Step 21: Manual check.** With `npm run dev`, sign in with a normal (non-2FA) account. Expected: sign-in still works and lands on `/dashboard` (the tokens arm of `login` is unchanged in behaviour). A wrong password shows the mapped copy "Email address or password is incorrect."

---

### Task 4: VerifyCodeForm resend opt-out

**Files:**
- Modify: `app/components/common/verify-code-form.tsx`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Produces `VerifyCodeForm` props: `{ email: string; submitLabel?: string; onSubmit: (code: string) => Promise<{ error: string | null }>; onResend?: () => Promise<{ error: string | null }>; allowResend?: boolean; children?: React.ReactNode }`. `allowResend` defaults to `true`.
- Consumes nothing from other tasks.

- [ ] **Step 1: Update the props interface.** In `app/components/common/verify-code-form.tsx`, replace the `VerifyCodeFormProps` interface with:
  ```tsx
  interface VerifyCodeFormProps {
    email: string;
    submitLabel?: string;
    onSubmit: (code: string) => Promise<{ error: string | null }>;
    onResend?: () => Promise<{ error: string | null }>;
    allowResend?: boolean;
    children?: React.ReactNode;
  }
  ```

- [ ] **Step 2: Destructure the new prop and compute `resendEnabled`.** In `app/components/common/verify-code-form.tsx`, replace the component signature and the first state block down to `cooldown`:
  ```tsx
  export function VerifyCodeForm({
    email,
    submitLabel = "Verify",
    onSubmit,
    onResend,
    allowResend = true,
    children,
  }: VerifyCodeFormProps) {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const resendEnabled = allowResend && Boolean(onResend);
  ```

- [ ] **Step 3: Gate the cooldown timer.** In `app/components/common/verify-code-form.tsx`, replace the `useEffect`:
  ```tsx
    useEffect(() => {
      if (!resendEnabled || cooldown <= 0) return;
      const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(id);
    }, [cooldown, resendEnabled]);
  ```

- [ ] **Step 4: Guard `resend`.** In `app/components/common/verify-code-form.tsx`, replace the `resend` function:
  ```tsx
    async function resend() {
      if (!onResend) return;
      setError(null);
      setNotice(null);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const result = await onResend();
      setNotice(
        result.error
          ? null
          : "If that address can receive a code, a new one is on its way.",
      );
      if (result.error) setError(result.error);
    }
  ```

- [ ] **Step 5: Render the resend button only when enabled.** In `app/components/common/verify-code-form.tsx`, replace the trailing resend `<button>` element with a conditional:
  ```tsx
        {resendEnabled && (
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="text-[13px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        )}
  ```

- [ ] **Step 6: Typecheck.** Run `npm run typecheck`. Expected: exits 0.

- [ ] **Step 7: Build.** Run `npm run build`. Expected: completes, exit 0.

- [ ] **Step 8: Manual check.** With `npm run dev`, go to `/signup`, create an account with a fresh email; on the "Confirm your email" step the "Resend code in 60s" button still appears and counts down (existing caller unchanged, since `allowResend` defaults to true and `onResend` is passed).

---

### Task 5: Login two-step (2FA) route

**Files:**
- Modify: `app/routes/login.tsx`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Consumes `useAuth().signIn` (returns `{ error, preAuthToken }`) and `useAuth().verifyLoginCode` (Task 3); `VerifyCodeForm` with `allowResend` (Task 4).
- Produces the two-step login UI. The pre-auth token lives only in this component's `useState`.

- [ ] **Step 1: Import `VerifyCodeForm`.** In `app/routes/login.tsx`, add to the imports:
  ```tsx
  import { VerifyCodeForm } from "~/components/common/verify-code-form";
  ```

- [ ] **Step 2: Pull `verifyLoginCode` and add challenge state.** In `app/routes/login.tsx`, change the `useAuth` destructure and add state. Replace the line `const { signIn } = useAuth();` with:
  ```tsx
    const { signIn, verifyLoginCode } = useAuth();
  ```
  and add, next to the other `useState` calls:
  ```tsx
    const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  ```

- [ ] **Step 3: Handle the challenge in the credentials submit.** In `app/routes/login.tsx`, replace the tail of `onSubmit` (from `const { error } = await signIn(...)` to the end of the function) with:
  ```tsx
      const { error, preAuthToken: challenge } = await signIn(
        result.data.email,
        result.data.password,
      );
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      if (challenge) {
        setPreAuthToken(challenge);
        setLoading(false);
        return;
      }
      navigate(next ? decodeURIComponent(next) : "/dashboard", { replace: true });
    }
  ```

- [ ] **Step 4: Render the challenge step when a token is present.** In `app/routes/login.tsx`, immediately before the existing `return (` of the credentials view, add a separate return branch:
  ```tsx
    if (preAuthToken) {
      return (
        <AuthShell
          title="Enter your code"
          subtitle="Two-factor authentication is on for this account"
          footer={
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          }
        >
          <VerifyCodeForm
            email={email}
            submitLabel="Verify and sign in"
            allowResend={false}
            onSubmit={async (code) => {
              const { error } = await verifyLoginCode(preAuthToken, code);
              if (!error) {
                navigate(next ? decodeURIComponent(next) : "/dashboard", {
                  replace: true,
                });
              }
              return { error };
            }}
          />
          <button
            type="button"
            onClick={() => {
              setPreAuthToken(null);
              setPassword("");
              setError(null);
            }}
            className="mt-3 w-full text-center text-[13px] font-medium text-primary hover:underline"
          >
            Start over
          </button>
        </AuthShell>
      );
    }
  ```

- [ ] **Step 5: Confirm no persistence of the token.** Run:
  ```
  grep -rn "preAuthToken" app | grep -viE "login.tsx|auth.ts|auth-context.tsx"
  ```
  Expected: no matches. `preAuthToken` must appear only in `login.tsx` (state), `auth.ts` (API), and `auth-context.tsx` (pass-through). Also confirm it is never stored:
  ```
  grep -rn "preAuthToken" app/lib/auth/session-store.ts
  ```
  Expected: no matches.

- [ ] **Step 6: Typecheck.** Run `npm run typecheck`. Expected: exits 0.

- [ ] **Step 7: Build.** Run `npm run build`. Expected: completes, exit 0.

- [ ] **Step 8: Manual check.** With a backend account that has 2FA enabled and a confirmed phone: `npm run dev`, go to `/login`, enter its email and password, click "Sign in". Expected: the view switches to "Enter your code" with a six-digit input, a "Verify and sign in" button, a "Start over" button, and NO resend control. Refresh the page mid-challenge: expected the form returns to the email/password step (token lost by design). Click "Start over": expected the password field is cleared and the credentials form returns.

---

### Task 6: Settings security panel

**Files:**
- Modify: `app/routes/settings.tsx` (loader `:28-35`, right column `:76-89`, imports, new `SecurityPanel`)
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Consumes `meApi.me`, `meApi.enableTwoFactor`, `meApi.disableTwoFactor`, `meApi.updatePhone`, `meApi.verifyPhone` (Task 3); `CurrentUserResponse` (Task 3); `messageForApiError` (Task 3); `requiredPhoneSchema` (Task 1); `PhoneInput` (Task 1); `VerifyCodeForm` with `allowResend` (Task 4); existing `FormDialog`, `Badge`, `Button`, `SectionTitle`, `Resolve`, `KeyValueSkeleton`, `useRevalidator`, `toast`.
- Produces a `SecurityPanel` component rendered in Settings; reads live `/me` state, revalidates after each action.

- [ ] **Step 1: Add the Security-panel imports.** In `app/routes/settings.tsx`, add these imports near the existing ones:
  ```tsx
  import { meApi } from "~/lib/api/me/me";
  import type { CurrentUserResponse } from "~/lib/api/me/types";
  import { PhoneInput } from "~/components/common/phone-input";
  import { requiredPhoneSchema } from "~/lib/utils/phone";
  import { VerifyCodeForm } from "~/components/common/verify-code-form";
  import { messageForApiError } from "~/lib/api/auth-errors";
  ```

- [ ] **Step 2: Load `/me` in the loader.** In `app/routes/settings.tsx` (`:28-35`), replace the loader return so it also fetches the current user:
  ```tsx
  export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const user = await requireAuth(request);
    if (!canSeeNav(user, "settings")) throw redirect("/dashboard");
    return {
      company: companyApi.get().catch(() => null),
      sage: sageApi.connection().catch(() => null),
      me: meApi.me().catch(() => null),
    };
  }
  ```

- [ ] **Step 3: Wrap the right column and add the Security card.** In `app/routes/settings.tsx` (`:76-89`), replace the single "Your account" card `<div>` with a flex column holding the account card and the security card:
  ```tsx
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <SectionTitle>Your account</SectionTitle>
              <KeyValue
                pairs={[
                  { k: "Email", v: user.email ?? "—", full: true },
                  { k: "Role", v: primaryRole(user), strong: true },
                  {
                    k: "User ID",
                    v: <Mono className="text-xs">{user.id}</Mono>,
                    full: true,
                  },
                ]}
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <Resolve
                resolve={loaderData.me}
                fallback={<KeyValueSkeleton rows={3} />}
              >
                {(me) =>
                  me ? (
                    <SecurityPanel me={me} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Couldn't load your security settings.
                    </p>
                  )
                }
              </Resolve>
            </div>
          </div>
  ```

- [ ] **Step 4: Add the `SecurityPanel` component.** In `app/routes/settings.tsx`, add this component (place it near the other panel components such as `SagePanel`):
  ```tsx
  function SecurityPanel({ me }: { me: CurrentUserResponse }) {
    const revalidator = useRevalidator();
    const [twoFaBusy, setTwoFaBusy] = useState(false);
    const [disableOpen, setDisableOpen] = useState(false);
    const [phoneStep, setPhoneStep] = useState<"idle" | "entry" | "verify">("idle");
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [phoneBusy, setPhoneBusy] = useState(false);
    const [pendingNumber, setPendingNumber] = useState("");

    async function enableTwoFactor() {
      setTwoFaBusy(true);
      try {
        await meApi.enableTwoFactor();
        toast.success("Two-factor authentication enabled.");
        revalidator.revalidate();
      } catch (err) {
        toast.error(messageForApiError(err));
      } finally {
        setTwoFaBusy(false);
      }
    }

    async function sendPhoneCode() {
      const parsed = requiredPhoneSchema.safeParse(phoneInput);
      if (!parsed.success) {
        setPhoneError(
          parsed.error.issues[0]?.message ?? "Enter a valid phone number.",
        );
        return;
      }
      setPhoneError(null);
      setPhoneBusy(true);
      try {
        await meApi.updatePhone(parsed.data);
        toast.success("We sent a code to that number.");
        setPendingNumber(parsed.data);
        setPhoneStep("verify");
      } catch (err) {
        toast.error(messageForApiError(err));
      } finally {
        setPhoneBusy(false);
      }
    }

    return (
      <>
        <SectionTitle>Security</SectionTitle>

        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Two-factor authentication
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                A WhatsApp code on each sign-in.
              </div>
            </div>
            {me.twoFactorEnabled ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">On</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisableOpen(true)}
                >
                  Turn off
                </Button>
              </div>
            ) : (
              <Button size="sm" disabled={twoFaBusy} onClick={enableTwoFactor}>
                {twoFaBusy ? "Enabling…" : "Enable"}
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <div className="text-sm font-semibold text-foreground">Phone number</div>

          {phoneStep === "idle" && (
            <div className="mt-2 flex flex-col gap-2">
              {me.pendingPhoneNumber ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {me.pendingPhoneNumber}
                    </span>
                    <Badge variant="destructive">Awaiting confirmation</Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    You started changing your number to {me.pendingPhoneNumber} but
                    haven't confirmed it yet.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setPendingNumber(me.pendingPhoneNumber ?? "");
                        setPhoneStep("verify");
                      }}
                    >
                      Enter code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhoneInput("");
                        setPhoneStep("entry");
                      }}
                    >
                      Use a different number
                    </Button>
                  </div>
                </>
              ) : me.phoneNumber ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{me.phoneNumber}</span>
                    <Badge variant={me.phoneNumberConfirmed ? "secondary" : "destructive"}>
                      {me.phoneNumberConfirmed ? "Confirmed" : "Unconfirmed"}
                    </Badge>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhoneInput("");
                        setPhoneStep("entry");
                      }}
                    >
                      {me.phoneNumberConfirmed ? "Change number" : "Verify number"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-muted-foreground">
                    Add a WhatsApp number to receive verification codes.
                  </p>
                  <div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setPhoneInput("");
                        setPhoneStep("entry");
                      }}
                    >
                      Add a phone number
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {phoneStep === "entry" && (
            <div className="mt-2 flex flex-col gap-2">
              <Label htmlFor="security-phone">Phone number</Label>
              <PhoneInput
                id="security-phone"
                value={phoneInput}
                onValueChange={(value) => {
                  setPhoneInput(value);
                  setPhoneError(null);
                }}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? "security-phone-error" : undefined}
              />
              {phoneError && (
                <p id="security-phone-error" className="text-[12px] font-medium text-destructive">
                  {phoneError}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" disabled={phoneBusy} onClick={sendPhoneCode}>
                  {phoneBusy ? "Sending…" : "Send code"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhoneStep("idle");
                    setPhoneError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {phoneStep === "verify" && (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-[12px] text-muted-foreground">
                Enter the code we sent to {pendingNumber}.
              </p>
              <VerifyCodeForm
                email={me.email ?? ""}
                submitLabel="Confirm number"
                allowResend={false}
                onSubmit={async (code) => {
                  try {
                    await meApi.verifyPhone(code);
                  } catch (err) {
                    return { error: messageForApiError(err) };
                  }
                  toast.success("Phone number confirmed.");
                  setPhoneStep("idle");
                  revalidator.revalidate();
                  return { error: null };
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhoneInput("");
                  setPhoneStep("entry");
                }}
                className="text-[13px] font-medium text-primary hover:underline"
              >
                Use a different number
              </button>
            </div>
          )}
        </div>

        <FormDialog
          open={disableOpen}
          onOpenChange={setDisableOpen}
          title="Turn off two-factor authentication"
          description="Enter your account password to confirm."
          submitLabel="Turn off"
          confirmTitle="Turn off two-factor authentication?"
          fields={[
            {
              name: "password",
              label: "Password",
              type: "password",
              required: true,
              full: true,
            },
          ]}
          onSubmit={async (v) => {
            try {
              await meApi.disableTwoFactor(v.password);
            } catch (err) {
              throw new Error(messageForApiError(err));
            }
            toast.success("Two-factor authentication disabled.");
            setDisableOpen(false);
            revalidator.revalidate();
          }}
        />
      </>
    );
  }
  ```

- [ ] **Step 5: Confirm `Label` is imported.** In `app/routes/settings.tsx`, ensure `Label` from `~/components/ui/label` is imported (the `SecurityPanel` uses it). If it is not already imported, add:
  ```tsx
  import { Label } from "~/components/ui/label";
  ```
  Then run `grep -n "components/ui/label" app/routes/settings.tsx` and expect exactly one import line.

- [ ] **Step 6: Typecheck.** Run `npm run typecheck`. Expected: exits 0.

- [ ] **Step 7: Build.** Run `npm run build`. Expected: completes, exit 0.

- [ ] **Step 8: Manual check.** With `npm run dev`, sign in, open `/settings`. Expected: a "Security" card in the right column showing two-factor state (On badge + "Turn off", or an "Enable" button) and a phone block. Click "Enable" -> toast "Two-factor authentication enabled." and the row flips to "On". Click "Turn off" -> a dialog asks for the password; a wrong password shows mapped copy, the right one disables it. Click "Add a phone number"/"Change number", enter a WhatsApp number you control, "Send code" -> toast; enter the received code -> toast "Phone number confirmed." and the number shows a "Confirmed" badge. Trigger a 502 (unreachable channel) if possible: the toast reads "We couldn't send a code to that number right now."

---

### Task 7: Auth phone fields (signup, accept-invite, invite)

**Files:**
- Modify: `app/routes/signup.tsx`
- Modify: `app/routes/accept-invite.tsx`
- Modify: `app/routes/team.tsx`
- Test: manual + `npm run typecheck` + `npm run build`

**Interfaces:**
- Consumes `PhoneInput` and `optionalPhoneSchema` (Task 1); `useAuth().signUp(email, password, phoneNumber?)` and `useAuth().acceptInvite(email, code, password, phoneNumber?)` (Task 3); existing `FormDialog` `type: "tel"` path (Task 1).
- Produces optional phone inputs on the three forms; values sent as E.164 or `null`.

- [ ] **Step 1: Import `PhoneInput` and `optionalPhoneSchema` in signup.** In `app/routes/signup.tsx`, add:
  ```tsx
  import { PhoneInput } from "~/components/common/phone-input";
  import { optionalPhoneSchema } from "~/lib/utils/phone";
  ```

- [ ] **Step 2: Add phone state to signup.** In `app/routes/signup.tsx`, add next to the other `useState` calls:
  ```tsx
    const [phone, setPhone] = useState("");
  ```

- [ ] **Step 3: Validate and forward the signup phone.** In `app/routes/signup.tsx`, in `onSubmit`, add `phone: optionalPhoneSchema` to the `z.object({...})` and `phone` to the `safeParse({...})` argument, then change the `signUp` call. The `z.object` becomes:
  ```tsx
      const result = z
        .object({
          email: requiredEmailSchema,
          password: z.string().min(12, "Password must be at least 12 characters."),
          phone: optionalPhoneSchema,
        })
        .safeParse({ email, password, phone });
  ```
  and the sign-up call becomes:
  ```tsx
      const { error } = await signUp(
        result.data.email,
        result.data.password,
        result.data.phone || null,
      );
  ```

- [ ] **Step 4: Render the signup phone field.** In `app/routes/signup.tsx`, add this block after the password field's closing `</div>` (before the `{error && ...}` line):
  ```tsx
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-phone">Phone number (optional)</Label>
            <PhoneInput
              id="signup-phone"
              value={phone}
              onValueChange={(value) => {
                setPhone(value);
                setFieldErrors((previous) => {
                  if (!previous.phone) return previous;
                  const next = { ...previous };
                  delete next.phone;
                  return next;
                });
              }}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "signup-phone-error" : undefined}
            />
            {fieldErrors.phone && (
              <p id="signup-phone-error" className="text-[12px] font-medium text-destructive">
                {fieldErrors.phone}
              </p>
            )}
          </div>
  ```

- [ ] **Step 5: Import `PhoneInput` and `optionalPhoneSchema` in accept-invite.** In `app/routes/accept-invite.tsx`, add:
  ```tsx
  import { PhoneInput } from "~/components/common/phone-input";
  import { optionalPhoneSchema } from "~/lib/utils/phone";
  ```

- [ ] **Step 6: Add phone state to accept-invite.** In `app/routes/accept-invite.tsx`, add next to the other `useState` calls:
  ```tsx
    const [phone, setPhone] = useState("");
  ```

- [ ] **Step 7: Validate the accept-invite phone.** In `app/routes/accept-invite.tsx`, in `validate()`, add `phone: optionalPhoneSchema` to the `z.object({...})` and `phone` to the `safeParse({...})` argument. The object becomes:
  ```tsx
      const result = z
        .object({
          email: requiredEmailSchema,
          password: z.string().min(12, "Password must be at least 12 characters."),
          confirm: z.string().min(1, "Confirm your password."),
          phone: optionalPhoneSchema,
        })
        .refine((data) => data.password === data.confirm, {
          message: "Passwords do not match.",
          path: ["confirm"],
        })
        .safeParse({ email, password, confirm, phone });
  ```

- [ ] **Step 8: Forward the accept-invite phone.** In `app/routes/accept-invite.tsx`, in the `VerifyCodeForm` `onSubmit`, replace the `acceptInvite` call:
  ```tsx
            const result = await acceptInvite(email, code, password, phone || null);
  ```

- [ ] **Step 9: Render the accept-invite phone field.** In `app/routes/accept-invite.tsx`, add this block inside the `VerifyCodeForm` children, after the "Confirm password" `</div>`:
  ```tsx
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-phone">Phone number (optional)</Label>
            <PhoneInput
              id="invite-phone"
              value={phone}
              onValueChange={setPhone}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldErrors.phone && (
              <p className="text-[12px] font-medium text-destructive">
                {fieldErrors.phone}
              </p>
            )}
          </div>
  ```

- [ ] **Step 10: Add the invite dialog phone field.** In `app/routes/team.tsx`, in the invite `FormDialog` `fields` array, add this entry after the `email` field:
  ```tsx
          {
            name: "phoneNumber",
            label: "Phone number (optional)",
            type: "tel",
            full: true,
          },
  ```

- [ ] **Step 11: Forward the invite phone.** In `app/routes/team.tsx`, in the invite `FormDialog` `onSubmit`, change the `usersApi.invite` call to include the phone:
  ```tsx
          onSubmit={async (v) => {
            await usersApi.invite({
              email: v.email,
              fullName: v.fullName || null,
              role: AppRole[v.role as keyof typeof AppRole],
              phoneNumber: v.phoneNumber || null,
            });
            toast.success("Invitation sent");
            revalidator.revalidate();
          }}
  ```

- [ ] **Step 12: Typecheck.** Run `npm run typecheck`. Expected: exits 0.

- [ ] **Step 13: Build.** Run `npm run build`. Expected: completes, exit 0.

- [ ] **Step 14: Manual check.** With `npm run dev`: on `/signup` the optional phone field is present, defaults to `+27`, and typing an invalid ZA number then submitting shows a "valid phone number" error and blocks submission; a valid number submits. On `/team` (as an admin), the invite dialog shows an optional "Phone number (optional)" field with the country picker.

---

### Task 8: Playwright setup

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `e2e/tsconfig.json`
- Modify: `tsconfig.json`
- Create: `e2e/fixtures/waha.ts`
- Modify: `.env.example`
- Test: `npx playwright --version` + `npm run typecheck`

**Interfaces:**
- Produces `chatIdFor(phoneE164: string): string` and `waitForOtp(opts): Promise<string>` in `e2e/fixtures/waha.ts`.
- Produces npm scripts `test:e2e` and `test:e2e:ui`.
- Consumes env vars (never hardcoded): `E2E_BASE_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `E2E_TEST_PHONE_E164`, `WAHA_BASE_URL`, `WAHA_SESSION_ID`, `WAHA_API_KEY`.

- [ ] **Step 1: Install Playwright and dotenv.** Run:
  ```
  npm install -D @playwright/test dotenv
  npx playwright install chromium
  ```
  Expected: `@playwright/test` and `dotenv` under `devDependencies`; Chromium downloads. Confirm `npx playwright --version` prints a version.

- [ ] **Step 2: Add e2e scripts to `package.json`.** In `package.json`, add to `"scripts"`:
  ```json
      "test:e2e": "playwright test",
      "test:e2e:ui": "playwright test --ui"
  ```

- [ ] **Step 3: Create `playwright.config.ts`.** Write exactly:
  ```ts
  import { defineConfig, devices } from "@playwright/test";
  import dotenv from "dotenv";
  import path from "node:path";

  dotenv.config({ path: path.resolve(process.cwd(), ".env") });

  export default defineConfig({
    testDir: "./e2e",
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: "list",
    use: {
      baseURL: process.env.E2E_BASE_URL,
      trace: "on-first-retry",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  });
  ```

- [ ] **Step 4: Create `e2e/tsconfig.json`.** Write exactly:
  ```json
  {
    "extends": "../tsconfig.json",
    "include": ["**/*.ts"],
    "compilerOptions": {
      "types": ["@playwright/test", "node"]
    }
  }
  ```

- [ ] **Step 5: Exclude `e2e` from the app tsconfig.** In `tsconfig.json`, change the `exclude` array to:
  ```json
    "exclude": ["workers", "worker-configuration.d.ts", "build", "node_modules", "e2e"],
  ```

- [ ] **Step 6: Create `e2e/fixtures/waha.ts`.** Write exactly:
  ```ts
  const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? "";
  const WAHA_SESSION_ID = process.env.WAHA_SESSION_ID ?? "";
  const WAHA_API_KEY = process.env.WAHA_API_KEY ?? "";

  export function chatIdFor(phoneE164: string): string {
    return `${phoneE164.replace(/^\+/, "")}@c.us`;
  }

  interface WahaMessage {
    body?: string;
    timestamp?: number;
  }

  async function fetchMessages(chatId: string): Promise<WahaMessage[]> {
    const headers = { "X-API-Key": WAHA_API_KEY, Accept: "application/json" };
    const encoded = encodeURIComponent(chatId);
    const primary = `${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION_ID}/chats/${encoded}/messages?limit=10&downloadMedia=false`;
    let res = await fetch(primary, { headers });
    if (res.status === 404) {
      const fallback = `${WAHA_BASE_URL}/api/messages?session=${WAHA_SESSION_ID}&chatId=${encoded}&limit=10&downloadMedia=false`;
      res = await fetch(fallback, { headers });
    }
    if (!res.ok) {
      throw new Error(`WAHA message read failed with status ${res.status}.`);
    }
    const data = (await res.json()) as WahaMessage[];
    return Array.isArray(data) ? data : [];
  }

  export async function waitForOtp(opts: {
    phoneE164: string;
    match: RegExp;
    since: number;
    timeoutMs?: number;
    pollMs?: number;
  }): Promise<string> {
    const chatId = chatIdFor(opts.phoneE164);
    const timeoutMs = opts.timeoutMs ?? 45_000;
    const pollMs = opts.pollMs ?? 2_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const messages = await fetchMessages(chatId);
      const candidates = messages
        .filter((m) => typeof m.body === "string")
        .filter((m) => (m.timestamp ?? 0) * 1000 >= opts.since - 1000)
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
      for (const message of candidates) {
        const found = opts.match.exec(message.body ?? "");
        if (found?.[1]) return found[1];
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
    throw new Error(
      `No OTP matching ${opts.match} arrived for chat ${chatId} within ${timeoutMs}ms.`,
    );
  }
  ```
  The WAHA read route uses the same shape as the backend sender (`/api/sessions/{session}/...`, header `X-API-Key`); the `/api/messages?...` branch is the documented fallback if the primary returns 404. No key, host, or session id is written here; all three come from `process.env`.

- [ ] **Step 7: Document the e2e env vars in `.env.example`.** Append to `.env.example` (names and placeholders only, no secrets):
  ```
  E2E_BASE_URL=http://localhost:5173
  E2E_TEST_EMAIL=
  E2E_TEST_PASSWORD=
  E2E_TEST_PHONE_E164=
  WAHA_BASE_URL=
  WAHA_SESSION_ID=
  WAHA_API_KEY=
  ```

- [ ] **Step 8: Typecheck the app (e2e now excluded).** Run `npm run typecheck`. Expected: exits 0 (the `e2e` directory is excluded from the app project).

- [ ] **Step 9: Typecheck the e2e project.** Run:
  ```
  npx tsc -p e2e/tsconfig.json --noEmit
  ```
  Expected: exits 0.

- [ ] **Step 10: Build.** Run `npm run build`. Expected: `react-router build` completes, exit 0 (the e2e additions are excluded from the app build and do not affect it).

---

### Task 9: Playwright specs

**Files:**
- Create: `e2e/login-2fa.spec.ts`
- Create: `e2e/phone-verify.spec.ts`
- Create: `e2e/phone-rejection.spec.ts`
- Test: `npm run test:e2e`

**Interfaces:**
- Consumes `waitForOtp` from `./fixtures/waha` (Task 8); the login two-step UI (Task 5); the Settings phone flow (Task 6); the signup phone field (Task 7).
- Env preconditions: `E2E_TEST_EMAIL` has 2FA enabled and a confirmed ZA phone equal to `E2E_TEST_PHONE_E164`; a running backend and frontend at `E2E_BASE_URL`; the two backend migrations applied.

- [ ] **Step 1: Create `e2e/login-2fa.spec.ts`.** Write exactly:
  ```ts
  import { test, expect } from "@playwright/test";
  import { waitForOtp } from "./fixtures/waha";

  test("login with two-factor completes end to end", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL ?? "";
    const password = process.env.E2E_TEST_PASSWORD ?? "";
    const phone = process.env.E2E_TEST_PHONE_E164 ?? "";

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);

    const since = Date.now();
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("heading", { name: "Enter your code" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /resend/i })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Start over" }),
    ).toBeVisible();

    const code = await waitForOtp({
      phoneE164: phone,
      match: /login code is (\d{6})/,
      since,
    });

    await page.getByLabel("Verification code").fill(code);
    await page.getByRole("button", { name: "Verify and sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
  ```

- [ ] **Step 2: Create `e2e/phone-verify.spec.ts`.** Write exactly:
  ```ts
  import { test, expect } from "@playwright/test";
  import { waitForOtp } from "./fixtures/waha";

  test("add and verify a phone number end to end", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL ?? "";
    const password = process.env.E2E_TEST_PASSWORD ?? "";
    const phone = process.env.E2E_TEST_PHONE_E164 ?? "";
    const national = phone.replace(/^\+27/, "");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const loginSince = Date.now();
    await page.getByRole("button", { name: "Sign in" }).click();
    const loginCode = await waitForOtp({
      phoneE164: phone,
      match: /login code is (\d{6})/,
      since: loginSince,
    });
    await page.getByLabel("Verification code").fill(loginCode);
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/settings");
    await page
      .getByRole("button", { name: /Change number|Add a phone number|Verify number/ })
      .click();
    await page.getByLabel("Phone number").fill(national);

    const phoneSince = Date.now();
    await page.getByRole("button", { name: "Send code" }).click();
    const phoneCode = await waitForOtp({
      phoneE164: phone,
      match: /phone verification code is (\d{6})/,
      since: phoneSince,
    });

    await page.getByLabel("Verification code").fill(phoneCode);
    await page.getByRole("button", { name: "Confirm number" }).click();

    await expect(page.getByText("Confirmed")).toBeVisible();
  });
  ```

- [ ] **Step 3: Create `e2e/phone-rejection.spec.ts`.** Write exactly:
  ```ts
  import { test, expect } from "@playwright/test";

  test("rejects a phone number invalid for the selected country", async ({ page }) => {
    let registerCalled = false;
    await page.route("**/api/v1/auth/register", async (route) => {
      registerCalled = true;
      await route.abort();
    });

    await page.goto("/signup");
    await page.getByLabel("Email").fill("e2e-reject@example.com");
    await page.getByLabel("Password", { exact: true }).fill("correcthorsebattery");
    await page.getByLabel("Phone number (optional)").fill("12345");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/valid phone number/i)).toBeVisible();
    expect(registerCalled).toBe(false);
  });
  ```

- [ ] **Step 4: Run the suite.** Ensure the backend and the frontend (`npm run dev`) are running and `.env` holds the seven e2e vars, then run:
  ```
  npm run test:e2e
  ```
  Expected: 3 passed. If `login-2fa` or `phone-verify` fail at `waitForOtp`, confirm the WAHA env vars are correct and the backend can reach WAHA; if `phone-verify` cannot find the phone field label, confirm the account's Settings phone flow opened (button label depends on the account's current phone state).

- [ ] **Step 5: Typecheck the e2e project once more.** Run:
  ```
  npx tsc -p e2e/tsconfig.json --noEmit
  ```
  Expected: exits 0.

- [ ] **Step 6: Typecheck the app.** Run `npm run typecheck`. Expected: exits 0 (the spec files live under the excluded `e2e` directory and do not affect the app project).

- [ ] **Step 7: Build.** Run `npm run build`. Expected: `react-router build` completes, exit 0.

---

## Self-review

**1. Spec coverage.**
- Spec §1 (contract): consumed across Task 3 (endpoints/types/error codes/context) and Tasks 5/6/7 (flows). Covered.
- Spec §2 (prerequisites: migrations applied): stated in Global Constraints; gates Task 9. Covered.
- Spec §3 (API layer): Task 3. Covered.
- Spec §4 (error handling, `code`, mapping, 429/502): Task 3 (`ApiError.code` + `auth-errors.ts`). Covered.
- Spec §5 (pre-auth token never persisted): Task 5 Step 4-5, plus Global Constraint and grep check. Covered.
- Spec §6 (two-step login, `allowResend`): Tasks 4 + 5. Covered.
- Spec §7 (Settings security panel, reads `/me`, interrupted change): Task 6. Covered.
- Spec §8 (international PhoneInput, phone.ts, FormDialog, call sites, display formatting): Tasks 1 + 2. Covered.
- Spec §9 (Playwright, WAHA fixture, env, specs): Tasks 8 + 9. Covered.
- Spec §11/§12 (acceptance criteria, subtasks): reflected in task ordering and manual checks. Covered.

**2. Placeholder scan.** No "TBD", "TODO", "implement later", "add appropriate error handling", "handle edge cases", "same as Task N", or "similar to above" appear in the task steps. Empty `catch {}` blocks are intentional best-effort parses (spec-sanctioned) and are not placeholders.

**3. Type consistency.**
- `PhoneInput` prop shape (`value`, `onValueChange`, `defaultCountry?`, spread input props) defined in Task 1 and consumed identically in Tasks 1 (FormDialog/onboarding/details-step), 6 (settings), 7 (signup/accept-invite). Match.
- `optionalPhoneSchema` / `requiredPhoneSchema` / `getPhoneError` defined in Task 1; consumed in Tasks 1, 6 (`requiredPhoneSchema.safeParse`), 7. Match.
- `formatPhoneForDisplay(value, viewerCountry?)` defined in Task 2, used only within Task 2. Match.
- `ApiError` 4-arg constructor and `code` field (Task 3) consumed by `messageForApiError` (Task 3, same task). Match.
- `LoginResult` union and `authApi.login`/`loginVerify` (Task 3) consumed by the auth context (Task 3, same task). Match.
- Auth context `signIn` returning `{ error, preAuthToken }` and `verifyLoginCode` (Task 3) consumed by the login route (Task 5). Match.
- `signUp`/`acceptInvite` optional `phoneNumber` (Task 3) consumed by Task 7. Match.
- `CurrentUserResponse` four new fields (Task 3) consumed by `SecurityPanel` (Task 6). Match.
- `meApi.enableTwoFactor/disableTwoFactor/updatePhone/verifyPhone` (Task 3) consumed by Task 6. Match.
- `VerifyCodeForm` `allowResend` + optional `onResend` (Task 4) consumed by Tasks 5 and 6. Match.
- `waitForOtp(opts)` signature (Task 8) consumed by Task 9. Match.

**4. Green gate (every task ends green).** Each task's final steps run `npm run typecheck` and `npm run build` (Tasks 8 and 9 additionally run `npx tsc -p e2e/tsconfig.json --noEmit`, and Task 9 runs `npm run test:e2e`), and each expects success. No task ends on an expected failure. The API contract change (`authApi.login` -> `LoginResult`) and its only consumer (the auth context) live in the same merged Task 3, so the tree never goes red between tasks. There is no lint script in this repo, so no task references one.
