import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { Icon } from "~/components/common/icon";
import { SectionHeading } from "~/components/modals/form-dialog";
import { ApiError } from "~/lib/api/http";
import { useConfirm } from "~/context/confirm-context";
import { packagesApi } from "~/lib/api/packages/packages";
import type { PackageResponse } from "~/lib/api/packages/types";

interface ItemRow {
  key: string;
  description: string;
  quantity: string;
}

function initialItems(pkg?: PackageResponse | null): ItemRow[] {
  return (pkg?.items ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: crypto.randomUUID(),
      description: item.description ?? "",
      quantity: String(item.quantity),
    }));
}

export function PackageFormDialog({
  open,
  onOpenChange,
  pkg,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pkg?: PackageResponse | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxShooters, setMaxShooters] = useState("1");
  const [active, setActive] = useState("true");
  const [items, setItems] = useState<ItemRow[]>(() => initialItems(pkg));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    setName(pkg?.name ?? "");
    setDescription(pkg?.description ?? "");
    setPrice(pkg ? String(pkg.price) : "");
    setDuration(String(pkg?.durationMinutes ?? 60));
    setMaxShooters(String(pkg?.maxShooters ?? 1));
    setActive(String(pkg?.isActive ?? true));
    setItems(initialItems(pkg));
    setError(null);
  }, [open, pkg]);

  function setItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  }

  function moveItem(index: number, delta: number) {
    setItems((prev) => {
      const next = prev.slice();
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const priceValue = Number(price);
    if (!price.trim() || Number.isNaN(priceValue) || priceValue < 0) {
      setError("Enter a valid price.");
      return;
    }
    const durationValue = Number(duration);
    if (!Number.isInteger(durationValue) || durationValue < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }
    const shootersValue = Number(maxShooters);
    if (!Number.isInteger(shootersValue) || shootersValue < 1) {
      setError("Max shooters must be at least 1.");
      return;
    }
    const rows = items.filter(
      (it) => it.description.trim() || it.quantity.trim(),
    );
    if (rows.some((it) => !it.description.trim())) {
      setError("Every item needs a description.");
      return;
    }

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      price: priceValue,
      durationMinutes: durationValue,
      maxShooters: shootersValue,
      items: rows.map((it, i) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        sortOrder: i,
      })),
    };

    const confirmed = await confirm({
      title: pkg ? "Save changes?" : "Add package?",
      description: pkg
        ? `Update "${name.trim()}" with these details.`
        : `Create the package "${name.trim()}".`,
      confirmLabel: pkg ? "Save changes" : "Add package",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      if (pkg) {
        await packagesApi.update(pkg.id, {
          ...body,
          isActive: active === "true",
        });
      } else {
        await packagesApi.create(body);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="gap-1 pr-12">
          <SheetTitle>{pkg ? "Edit package" : "Add package"}</SheetTitle>
          <SheetDescription>
            {pkg
              ? "Update the package details and included items."
              : "Create a bookable package with its included items."}
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <section className="space-y-3">
              <SectionHeading>Details</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="package-name">
                  Name<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="package-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Range Session"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="package-description">Description</Label>
                <textarea
                  id="package-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <SectionHeading>Pricing &amp; capacity</SectionHeading>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="package-price">
                    Price (R)<span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    id="package-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="package-duration">Duration (minutes)</Label>
                  <Input
                    id="package-duration"
                    type="number"
                    min={1}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="package-shooters">Max shooters</Label>
                  <Input
                    id="package-shooters"
                    type="number"
                    min={1}
                    value={maxShooters}
                    onChange={(e) => setMaxShooters(e.target.value)}
                  />
                </div>
                {pkg && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="package-active">Status</Label>
                    <Select value={active} onValueChange={setActive}>
                      <SelectTrigger id="package-active">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <SectionHeading>Included items</SectionHeading>
              {items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {items.map((it, index) => (
                    <div key={it.key} className="flex items-center gap-2">
                      <Input
                        aria-label={`Item ${index + 1} description`}
                        placeholder="e.g. 9mm rounds"
                        value={it.description}
                        onChange={(e) =>
                          setItem(it.key, { description: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Input
                        aria-label={`Item ${index + 1} quantity`}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) =>
                          setItem(it.key, { quantity: e.target.value })
                        }
                        className="w-20 shrink-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Move item ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Move item ${index + 1} down`}
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ChevronDownIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove item ${index + 1}`}
                        onClick={() =>
                          setItems((prev) =>
                            prev.filter((row) => row.key !== it.key),
                          )
                        }
                      >
                        <XIcon />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      key: crypto.randomUUID(),
                      description: "",
                      quantity: "1",
                    },
                  ])
                }
              >
                <Icon name="plus" size={14} />
                Add item
              </Button>
            </section>

            {error && (
              <p className="text-[13px] font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter className="border-t bg-muted/50 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : pkg ? "Save changes" : "Add package"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
