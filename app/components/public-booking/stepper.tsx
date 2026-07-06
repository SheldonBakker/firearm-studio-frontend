import { CheckIcon } from "lucide-react";
import type { Step } from "~/lib/booking/cart";
import { cn } from "~/lib/utils/cn";

const STEP_LABELS = ["Selection", "Date & time", "Your details", "Review"];

export function Stepper({
  step,
  onGoto,
}: {
  step: Step;
  onGoto: (s: Step) => void;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                disabled={!done}
                onClick={() => done && onGoto(n)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-1",
                  done && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : n}
                </span>
                <span
                  className={cn(
                    "hidden text-[12.5px] font-medium sm:inline",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <span
                  className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
