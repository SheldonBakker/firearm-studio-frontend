import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/booking-detail";
import { ApiError } from "~/lib/api/http";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap, BackLink, SectionTitle } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { StatusBadge } from "~/components/common/status-badge";
import { KeyValue } from "~/components/common/key-value";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import { BookingSource, BookingStatus, enumKey } from "~/lib/types/enums";
import type { BookingResponse } from "~/lib/api/bookings/types";

const bookingNumber = (booking: BookingResponse) =>
  booking.bookingNumber ?? booking.id.slice(0, 8);

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: bookingsApi.get(params.id) };
}

export default function BookingDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to bookings" onClick={() => navigate("/bookings")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(booking) => <BookingView booking={booking} />}
      </Resolve>
    </PageWrap>
  );
}

function BookingView({ booking }: { booking: BookingResponse }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "bookings:write");
  const status = enumKey(BookingStatus, booking.status) ?? "Pending";
  const isPending = booking.status === BookingStatus.Pending;
  const isConfirmed = booking.status === BookingStatus.Confirmed;

  async function run(
    action: (id: string) => Promise<void>,
    success: string,
    failure: string,
  ) {
    try {
      await action(booking.id);
      toast.success(success);
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : failure);
    }
  }

  return (
    <>
      <PageHeader
        title={bookingNumber(booking)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={status} />
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
                    run(bookingsApi.confirm, "Booking confirmed", "Could not confirm")
                  }
                >
                  <Icon name="check" size={16} />
                  Confirm
                </Button>
              )}
              {isConfirmed && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      run(
                        bookingsApi.complete,
                        "Booking completed",
                        "Could not complete",
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
                  run(bookingsApi.cancel, "Booking cancelled", "Could not cancel")
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
                    {booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}
                  </Mono>
                ),
              },
              { k: "Range", v: booking.rangeName ?? "—" },
              { k: "Shooters", v: booking.shooterCount },
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
          <KeyValue
            pairs={[
              { k: "Package", v: booking.packageName ?? "—", strong: true },
              { k: "Price", v: fmtMoney(booking.packagePrice) },
              {
                k: "Invoice",
                v: booking.invoiceId ? "Linked" : "Not linked",
              },
            ]}
          />
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
            ]}
          />
        </div>
      </div>
    </>
  );
}
