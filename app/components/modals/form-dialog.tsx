import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SouthAfricanPhoneInput } from "~/components/common/south-african-phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ApiError } from "~/lib/api";
import {
  optionalSouthAfricanPhoneSchema,
  requiredSouthAfricanPhoneSchema,
} from "~/lib/phone";
import {
  optionalEmailSchema,
  requiredEmailSchema,
  requiredTextSchema,
} from "~/lib/validation";

export interface FormField {
  name: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "email"
    | "tel"
    | "select"
    | "search-select"
    | "textarea";
  options?: {
    value: string;
    label: string;
    description?: string;
    searchText?: string;
  }[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
  defaultValue?: string;
  searchDebounceMs?: number;
  searchMinChars?: number;
}

function SearchSelectField({
  id,
  value,
  options,
  placeholder,
  debounceMs = 600,
  minChars = 3,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  value: string;
  options: NonNullable<FormField["options"]>;
  placeholder?: string;
  debounceMs?: number;
  minChars?: number;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const isSelected =
      selectedOption && trimmedQuery === selectedOption.label.trim();

    if (trimmedQuery.length < minChars || isSelected) {
      setDebouncedQuery("");
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
      setIsDebouncing(false);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, minChars, query, selectedOption]);

  const matches = useMemo(() => {
    const normalizedQuery = debouncedQuery.toLocaleLowerCase();
    if (!normalizedQuery) return [];

    return options.filter((option) =>
      (option.searchText ?? option.label)
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [debouncedQuery, options]);

  const hasSearchQuery = query.trim().length >= minChars && !selectedOption;
  const showResults = focused && hasSearchQuery;
  const listboxId = `${id}-results`;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <Input
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        placeholder={placeholder ?? `Type at least ${minChars} characters…`}
        value={query}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
        }}
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={listboxId}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-input bg-popover p-1 text-popover-foreground shadow-md"
        >
          {isDebouncing || !debouncedQuery ? (
            <p className="px-2.5 py-2 text-[12px] text-muted-foreground">
              Searching…
            </p>
          ) : matches.length > 0 ? (
            matches.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className="flex w-full flex-col rounded-md px-2.5 py-2 text-left hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onClick={() => {
                  setQuery(option.label);
                  setDebouncedQuery("");
                  setFocused(false);
                  onChange(option.value);
                }}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-[11.5px] text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </button>
            ))
          ) : (
            <p className="px-2.5 py-2 text-[12px] text-muted-foreground">
              No customers found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function schemaForField(field: FormField): z.ZodType {
  if (field.type === "email") {
    return field.required ? requiredEmailSchema : optionalEmailSchema;
  }
  if (field.type === "tel") {
    return field.required
      ? requiredSouthAfricanPhoneSchema
      : optionalSouthAfricanPhoneSchema;
  }
  if (field.required) return requiredTextSchema(field.label);
  return z.string();
}

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = issue.path[0];
    if (typeof fieldName === "string" && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }
  return errors;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  submitLabel = "Save",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])),
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formSchema = z.object(
      Object.fromEntries(
        fields.map((field) => [field.name, schemaForField(field)]),
      ),
    );
    const result = formSchema.safeParse(values);

    if (!result.success) {
      setFieldErrors(fieldErrorsFromZod(result.error));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data as Record<string, string>);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-140 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          noValidate
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2"
        >
          {fields.map((f) => (
            <div
              key={f.name}
              className={`flex flex-col gap-2 ${
                f.full || f.type === "email" || f.type === "tel"
                  ? "sm:col-span-2"
                  : ""
              }`}
            >
              <Label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "select" ? (
                <Select
                  value={values[f.name]}
                  onValueChange={(v) => set(f.name, v)}
                >
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder={f.placeholder ?? "Select…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "search-select" ? (
                <SearchSelectField
                  id={f.name}
                  value={values[f.name]}
                  options={f.options ?? []}
                  placeholder={f.placeholder}
                  debounceMs={f.searchDebounceMs}
                  minChars={f.searchMinChars}
                  invalid={Boolean(fieldErrors[f.name])}
                  describedBy={
                    fieldErrors[f.name] ? `${f.name}-error` : undefined
                  }
                  onChange={(value) => set(f.name, value)}
                />
              ) : f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                />
              ) : f.type === "tel" ? (
                <SouthAfricanPhoneInput
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
                  autoComplete="tel-national"
                  aria-invalid={Boolean(fieldErrors[f.name])}
                  aria-describedby={
                    fieldErrors[f.name] ? `${f.name}-error` : undefined
                  }
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                  onBlur={() => {
                    if (f.type !== "email") return;
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
                  aria-invalid={Boolean(fieldErrors[f.name])}
                  aria-describedby={
                    fieldErrors[f.name] ? `${f.name}-error` : undefined
                  }
                />
              )}
              {fieldErrors[f.name] && (
                <p
                  id={`${f.name}-error`}
                  className="text-[12px] font-medium text-destructive"
                >
                  {fieldErrors[f.name]}
                </p>
              )}
            </div>
          ))}
          {error && (
            <p className="text-[13px] font-medium text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
