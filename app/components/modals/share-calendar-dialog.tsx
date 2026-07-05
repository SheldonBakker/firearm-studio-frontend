import { toast } from "sonner";
import { CopyIcon } from "lucide-react";
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

export function ShareCalendarDialog({
  open,
  onOpenChange,
  companyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = companyId ? `${origin}/book/${companyId}` : "";
  const embedSnippet = companyId
    ? `<iframe src="${origin}/book/${companyId}?embed=1" width="100%" height="760" style="border:0" title="Book a session" loading="lazy"></iframe>`
    : "";

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="gap-1 pr-12">
          <SheetTitle>Share booking calendar</SheetTitle>
          <SheetDescription>
            Share a public link or embed the calendar in your own website.
            Visitors can view availability and request bookings — no customer
            details are ever shown.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!companyId ? (
            <p className="text-[13px] text-muted-foreground">
              Your company couldn&apos;t be loaded. Please refresh and try
              again.
            </p>
          ) : (
            <div className="space-y-6 py-1">
              <div className="flex flex-col gap-2">
                <Label htmlFor="share-url">Public link</Label>
                <div className="flex gap-2">
                  <Input id="share-url" readOnly value={publicUrl} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copy(publicUrl, "Link")}
                  >
                    <CopyIcon />
                    Copy
                  </Button>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Anyone with this link can view availability and request a
                  booking.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="share-embed">Embed code</Label>
                <textarea
                  id="share-embed"
                  readOnly
                  value={embedSnippet}
                  rows={4}
                  className="rounded-md border border-input bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus-visible:border-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  onClick={() => copy(embedSnippet, "Embed code")}
                >
                  <CopyIcon />
                  Copy embed code
                </Button>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Paste this into your website to embed the calendar.
                </p>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-muted/50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
