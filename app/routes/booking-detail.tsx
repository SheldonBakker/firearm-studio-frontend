import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import type { Route } from "./+types/booking-detail";
import { ApiError } from "~/lib/api/http";
import { useConfirm, type ConfirmOptions } from "~/context/confirm-context";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import { invoicesApi } from "~/lib/api/invoices/invoices";
import { fmtDate, fmtDateTime, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap, BackLink, SectionTitle } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { StatusBadge } from "~/components/common/status-badge";
import { DataTable, type Column } from "~/components/common/data-table";
import { KeyValue, type KVPair } from "~/components/common/key-value";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { AttendeeFormDialog } from "~/components/modals/attendee-form-dialog";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import {
  BookingSource,
  BookingStatus,
  FirearmOrigin,
  enumKey,
} from "~/lib/types/enums";
import type { AttendeeResponse, BookingResponse } from "~/lib/api/bookings/types";
import type { InvoiceDetailDto } from "~/lib/api/invoices/types";

interface BookingDetailData {
  booking: BookingResponse;
  invoice: InvoiceDetailDto | null;
  attendees: AttendeeResponse[];
}

const bookingNumber = (booking: BookingResponse) =>
  booking.bookingNumber ?? booking.id.slice(0, 8);

const ORIGIN_LABELS: Record<FirearmOrigin, string> = {
  [FirearmOrigin.Own]: "Own",
  [FirearmOrigin.RangeRental]: "Range rental",
};

/** South Africa (Africa/Johannesburg) has no DST and is fixed at UTC+2. */
function todaySouthAfrica(): string {
  const saMs = Date.now() + 2 * 60 * 60 * 1000;
  return new Date(saMs).toISOString().slice(0, 10);
}

type DepositState = "DepositDue" | "DepositPaid" | "DepositExpired";

function depositState(invoice: InvoiceDetailDto): DepositState | null {
  if (invoice.depositAmount == null) return null;
  if (invoice.depositPaidAt) return "DepositPaid";
  if (invoice.depositDueAt && new Date(invoice.depositDueAt) < new Date()) {
    return "DepositExpired";
  }
  return "DepositDue";
}

async function loadBookingDetail(id: string): Promise<BookingDetailData> {
  const booking = await bookingsApi.get(id);
  const [invoice, attendees] = await Promise.all([
    booking.invoiceId
      ? invoicesApi.get(booking.invoiceId).catch(() => null)
      : Promise.resolve(null),
    bookingsApi.attendees.list(id).catch(() => [] as AttendeeResponse[]),
  ]);
  return { booking, invoice, attendees };
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: loadBookingDetail(params.id) };
}

export default function BookingDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink
        label="Back to bookings"
        onClick={() => navigate("/bookings")}
      />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(data) => <BookingView data={data} />}
      </Resolve>
    </PageWrap>
  );
}

function BookingView({ data }: { data: BookingDetailData }) {
  const { booking, invoice, attendees } = data;
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const confirm = useConfirm();
  const user = useSessionUser();
  const writable = can(user, "bookings:write");
  const canDeleteAttendee = can(user, "bookings:delete-attendee");
  const status = enumKey(BookingStatus, booking.status) ?? "Pending";
  const isPending = booking.status === BookingStatus.Pending;
  const isConfirmed = booking.status === BookingStatus.Confirmed;
  const canCheckIn =
    writable &&
    isConfirmed &&
    booking.bookingDate === todaySouthAfrica() &&
    !booking.checkedInAt;

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [attendeeDialogOpen, setAttendeeDialogOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] =
    useState<AttendeeResponse | null>(null);

  const deposit = invoice ? depositState(invoice) : null;

  async function run(
    action: (id: string) => Promise<void>,
    success: string,
    failure: string,
    confirmOpts: ConfirmOptions,
  ) {
    if (!(await confirm(confirmOpts))) return;
    try {
      await action(booking.id);
      toast.success(success);
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : failure);
    }
  }

  async function removeAttendee(attendee: AttendeeResponse) {
    const ok = await confirm({
      title: "Remove attendee?",
      description: `"${attendee.fullName}" will be permanently removed from this booking's register.`,
      confirmLabel: "Remove",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (!ok) return;
    try {
      await bookingsApi.attendees.remove(attendee.id);
      toast.success("Attendee removed");
      revalidator.revalidate();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not remove attendee",
      );
    }
  }

  const attendeeColumns: Column<AttendeeResponse>[] = [
    {
      key: "name",
      header: "Full name",
      cell: (a) => (
        <span className="text-[12.5px] font-semibold text-foreground">
          {a.fullName}
        </span>
      ),
    },
    {
      key: "id",
      header: "ID number",
      cell: (a) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {a.idNumber}
        </Mono>
      ),
    },
    {
      key: "licence",
      header: "Licence",
      cell: (a) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {a.licenceNumber ?? "—"}
        </Mono>
      ),
    },
    {
      key: "firearm",
      header: "Firearm",
      cell: (a) => (
        <span className="text-[12.5px] text-muted-foreground">
          {[a.firearmMakeModel, a.calibre].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origin",
      cell: (a) => (
        <span className="text-[12.5px] text-muted-foreground">
          {ORIGIN_LABELS[a.firearmOrigin]}
        </span>
      ),
    },
    {
      key: "indemnity",
      header: "Indemnity",
      cell: (a) => (
        <span className="text-[12.5px] text-muted-foreground">
          {a.signedIndemnity ? "Signed" : "Not signed"}
        </span>
      ),
    },
  ];

  if (canDeleteAttendee) {
    attendeeColumns.push({
      key: "actions",
      header: "",
      align: "right",
      width: "48px",
      cell: (a) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${a.fullName}`}
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeAttendee(a);
          }}
        >
          <Trash2Icon />
        </Button>
      ),
    });
  }

  const billingPairs: KVPair[] = [
    { k: "Package", v: booking.packageName ?? "—", strong: true },
    { k: "Price", v: fmtMoney(booking.packagePrice) },
    { k: "Invoice", v: booking.invoiceId ? "Linked" : "Not linked" },
  ];
  if (deposit) {
    billingPairs.push({
      k: "Deposit",
      v: (
        <span className="flex items-center gap-2">
          <StatusBadge status={deposit} />
          <span className="text-muted-foreground">
            {fmtMoney(invoice?.depositAmount)}
          </span>
        </span>
      ),
    });
  }

  return (
    <>
      <PageHeader
        title={bookingNumber(booking)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={status} />
            {booking.checkedInAt && (
              <span className="text-[12px] font-semibold text-muted-foreground">
                · Checked in {fmtDateTime(booking.checkedInAt)}
              </span>
            )}
            {booking.customerName && (
              <button
                onClick={() => navigate(`/customers/${booking.customerId}`)}
                className="hover:text-foreground"
              >
                · {booking.customerName}
              </button>
            )}
          </span>
        }
        actions={
          writable &&
          (isPending || isConfirmed) && (
            <>
              {isPending && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    run(
                      bookingsApi.confirm,
                      "Booking confirmed",
                      "Could not confirm",
                      {
                        title: "Confirm booking?",
                        description: "This will confirm the booking.",
                        confirmLabel: "Confirm booking",
                      },
                    )
                  }
                >
                  <Icon name="check" size={16} />
                  Confirm
                </Button>
              )}
              {isConfirmed && (
                <>
                  {canCheckIn && (
                    <Button variant="ghost" onClick={() => setCheckInOpen(true)}>
                      <Icon name="check" size={16} />
                      Check in
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      run(
                        bookingsApi.complete,
                        "Booking completed",
                        "Could not complete",
                        {
                          title: "Mark booking complete?",
                          description: "This marks the booking as completed.",
                          confirmLabel: "Complete",
                        },
                      )
                    }
                  >
                    <Icon name="check" size={16} />
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      run(
                        bookingsApi.noShow,
                        "Booking marked as no-show",
                        "Could not mark as no-show",
                        {
                          title: "Mark as no-show?",
                          description: "This marks the booking as a no-show.",
                          confirmLabel: "Mark no-show",
                          destructive: true,
                        },
                      )
                    }
                  >
                    No-show
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                onClick={() =>
                  run(
                    bookingsApi.cancel,
                    "Booking cancelled",
                    "Could not cancel",
                    {
                      title: "Cancel booking?",
                      description: "This will cancel the booking.",
                      confirmLabel: "Cancel booking",
                      cancelLabel: "Keep booking",
                      destructive: true,
                    },
                  )
                }
              >
                Cancel booking
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <SectionTitle>Booking</SectionTitle>
          <KeyValue
            pairs={[
              {
                k: "Booking",
                v: <Mono>{bookingNumber(booking)}</Mono>,
                strong: true,
              },
              { k: "Date", v: fmtDate(booking.bookingDate) },
              {
                k: "Time",
                v: (
                  <Mono>
                    {booking.startTime.slice(0, 5)}–
                    {booking.endTime.slice(0, 5)}
                  </Mono>
                ),
              },
              { k: "Facility", v: booking.rangeName ?? "—" },
              { k: "People", v: booking.shooterCount },
              {
                k: "Source",
                v: enumKey(BookingSource, booking.source) ?? "—",
              },
              { k: "Notes", v: booking.notes || "—", full: true },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <SectionTitle
            right={
              booking.invoiceId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/invoices/${booking.invoiceId}`)}
                >
                  View invoice
                  <Icon name="arrow" size={14} />
                </Button>
              )
            }
          >
            Package & billing
          </SectionTitle>
          <KeyValue pairs={billingPairs} />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <SectionTitle
            right={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/customers/${booking.customerId}`)}
              >
                View customer
                <Icon name="arrow" size={14} />
              </Button>
            }
          >
            History
          </SectionTitle>
          <KeyValue
            pairs={[
              { k: "Customer", v: booking.customerName ?? "—", strong: true },
              { k: "Created", v: fmtDate(booking.createdAt) },
              { k: "Confirmed", v: fmtDate(booking.confirmedAt) },
              { k: "Cancelled", v: fmtDate(booking.cancelledAt) },
              {
                k: "Checked in",
                v: booking.checkedInAt
                  ? fmtDateTime(booking.checkedInAt)
                  : "Not yet",
              },
            ]}
          />
        </div>

        {writable && (
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <SectionTitle
              right={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAttendee(null);
                    setAttendeeDialogOpen(true);
                  }}
                >
                  <Icon name="plus" size={14} />
                  Add attendee
                </Button>
              }
            >
              Attendees
            </SectionTitle>
            <DataTable<AttendeeResponse>
              columns={attendeeColumns}
              rows={attendees}
              onRowClick={(a) => {
                setEditingAttendee(a);
                setAttendeeDialogOpen(true);
              }}
              empty="No attendees checked in yet."
            />
          </div>
        )}
      </div>

      {canCheckIn && (
        <AttendeeFormDialog
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          bookingId={booking.id}
          checkIn
          onSaved={() => {
            toast.success("Booking checked in");
            revalidator.revalidate();
          }}
        />
      )}

      {writable && (
        <AttendeeFormDialog
          open={attendeeDialogOpen}
          onOpenChange={setAttendeeDialogOpen}
          bookingId={booking.id}
          attendee={editingAttendee}
          onSaved={() => {
            toast.success(editingAttendee ? "Attendee updated" : "Attendee added");
            revalidator.revalidate();
          }}
        />
      )}
    </>
  );
}
