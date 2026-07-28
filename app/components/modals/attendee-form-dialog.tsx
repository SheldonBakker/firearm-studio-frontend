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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SectionHeading } from "~/components/modals/form-dialog";
import { ApiError } from "~/lib/api/http";
import { useConfirm } from "~/context/confirm-context";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import type { AttendeeResponse } from "~/lib/api/bookings/types";
import { isSouthAfricanIdFormat, isValidIdNumber } from "~/lib/utils/sa-id";
import { FirearmOrigin } from "~/lib/types/enums";

const ORIGIN_OPTIONS: { value: string; label: string }[] = [
  { value: String(FirearmOrigin.Own), label: "Own firearm" },
  { value: String(FirearmOrigin.RangeRental), label: "Range rental" },
];

export function AttendeeFormDialog({
  open,
  onOpenChange,
  bookingId,
  attendee,
  checkIn = false,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  attendee?: AttendeeResponse | null;
  checkIn?: boolean;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [firearmMakeModel, setFirearmMakeModel] = useState("");
  const [firearmSerialNumber, setFirearmSerialNumber] = useState("");
  const [calibre, setCalibre] = useState("");
  const [firearmOrigin, setFirearmOrigin] = useState(
    String(FirearmOrigin.Own),
  );
  const [signedIndemnity, setSignedIndemnity] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    setFullName(attendee?.fullName ?? "");
    setIdNumber(attendee?.idNumber ?? "");
    setLicenceNumber(attendee?.licenceNumber ?? "");
    setFirearmMakeModel(attendee?.firearmMakeModel ?? "");
    setFirearmSerialNumber(attendee?.firearmSerialNumber ?? "");
    setCalibre(attendee?.calibre ?? "");
    setFirearmOrigin(String(attendee?.firearmOrigin ?? FirearmOrigin.Own));
    setSignedIndemnity(attendee?.signedIndemnity ?? false);
    setNotes(attendee?.notes ?? "");
    setError(null);
    setIdError(null);
  }, [open, attendee]);

  const title = checkIn
    ? "Check in booking"
    : attendee
      ? "Edit attendee"
      : "Add attendee";
  const description = checkIn
    ? "Record the first shooter to check in this booking for its booking date."
    : attendee
      ? "Update this attendee's details."
      : "Add a shooter to this booking's attendance register.";
  const submitLabel = checkIn
    ? "Check in"
    : attendee
      ? "Save changes"
      : "Add attendee";

  function validateId(value: string): string | null {
    if (!value.trim()) return "ID number is required.";
    if (value.trim().length > 20) return "ID number must be 20 characters or fewer.";
    if (!isValidIdNumber(value.trim())) {
      return "Enter a valid 13-digit South African ID number or a passport number.";
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (fullName.trim().length > 200) {
      setError("Full name must be 200 characters or fewer.");
      return;
    }
    const idValidationError = validateId(idNumber);
    if (idValidationError) {
      setIdError(idValidationError);
      setError(idValidationError);
      return;
    }
    if (licenceNumber.trim().length > 50) {
      setError("Licence number must be 50 characters or fewer.");
      return;
    }
    if (firearmMakeModel.trim().length > 200) {
      setError("Firearm make/model must be 200 characters or fewer.");
      return;
    }
    if (firearmSerialNumber.trim().length > 100) {
      setError("Firearm serial number must be 100 characters or fewer.");
      return;
    }
    if (calibre.trim().length > 50) {
      setError("Calibre must be 50 characters or fewer.");
      return;
    }
    if (notes.trim().length > 500) {
      setError("Notes must be 500 characters or fewer.");
      return;
    }

    const confirmed = await confirm({
      title: checkIn ? "Check in booking?" : `${title}?`,
      description: checkIn
        ? `This will check in the booking and record "${fullName.trim()}" as an attendee.`
        : attendee
          ? `Update "${fullName.trim()}"'s details.`
          : `Add "${fullName.trim()}" to this booking's register.`,
      confirmLabel: submitLabel,
    });
    if (!confirmed) return;

    const payload = {
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
      licenceNumber: licenceNumber.trim() || null,
      firearmMakeModel: firearmMakeModel.trim() || null,
      firearmSerialNumber: firearmSerialNumber.trim() || null,
      calibre: calibre.trim() || null,
      firearmOrigin: Number(firearmOrigin) as FirearmOrigin,
      signedIndemnity,
      notes: notes.trim() || null,
    };

    setLoading(true);
    try {
      if (attendee) {
        await bookingsApi.attendees.update(attendee.id, payload);
      } else if (checkIn) {
        await bookingsApi.checkIn(bookingId, { attendees: [payload] });
      } else {
        await bookingsApi.attendees.add(bookingId, payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const showLuhnWarning =
    isSouthAfricanIdFormat(idNumber.trim()) && !isValidIdNumber(idNumber.trim());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="gap-1 pr-12">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="attendee-full-name">
                Full name<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="attendee-full-name"
                value={fullName}
                maxLength={200}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="attendee-id-number">
                ID number<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="attendee-id-number"
                value={idNumber}
                maxLength={20}
                placeholder="13-digit SA ID or passport number"
                onChange={(e) => {
                  setIdNumber(e.target.value);
                  setIdError(null);
                }}
                onBlur={() => setIdError(validateId(idNumber))}
                aria-invalid={Boolean(idError)}
              />
              {idError ? (
                <p className="text-[12px] font-medium text-destructive">
                  {idError}
                </p>
              ) : (
                showLuhnWarning && (
                  <p className="text-[12px] font-medium text-destructive">
                    This 13-digit number fails the SA ID checksum.
                  </p>
                )
              )}
            </div>

            <SectionHeading>Firearm</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-licence">Licence number</Label>
                <Input
                  id="attendee-licence"
                  value={licenceNumber}
                  maxLength={50}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-origin">Firearm origin</Label>
                <Select value={firearmOrigin} onValueChange={setFirearmOrigin}>
                  <SelectTrigger id="attendee-origin" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGIN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-make-model">Make/model</Label>
                <Input
                  id="attendee-make-model"
                  value={firearmMakeModel}
                  maxLength={200}
                  onChange={(e) => setFirearmMakeModel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-serial">Serial number</Label>
                <Input
                  id="attendee-serial"
                  value={firearmSerialNumber}
                  maxLength={100}
                  onChange={(e) => setFirearmSerialNumber(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-calibre">Calibre</Label>
                <Input
                  id="attendee-calibre"
                  value={calibre}
                  maxLength={50}
                  onChange={(e) => setCalibre(e.target.value)}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-input p-3 text-sm transition-colors hover:bg-accent/50">
              <input
                type="checkbox"
                className="accent-primary"
                checked={signedIndemnity}
                onChange={(e) => setSignedIndemnity(e.target.checked)}
              />
              <span>
                Signed indemnity
                <span className="block text-[12.5px] text-muted-foreground">
                  Confirms this attendee signed the range's indemnity form.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <Label htmlFor="attendee-notes">Notes</Label>
              <textarea
                id="attendee-notes"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
              />
            </div>

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
              {loading ? "Saving…" : submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
