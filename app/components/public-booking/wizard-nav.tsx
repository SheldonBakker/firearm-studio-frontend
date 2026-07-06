import type { Step } from "~/lib/booking/cart";
import { Button } from "~/components/ui/button";

export function WizardNav({
  step,
  canNext,
  submitting,
  submitLabel,
  onBack,
  onNext,
  onSubmit,
}: {
  step: Step;
  canNext: boolean;
  submitting: boolean;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={step === 1}
      >
        Back
      </Button>
      {step === 4 ? (
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Booking…" : submitLabel}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} disabled={!canNext}>
          Next
        </Button>
      )}
    </div>
  );
}
