import type {
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import type { Draft } from "~/lib/booking/cart";
import {
  PackageCard,
  RangeCard,
  SectionLabel,
  ShooterStepper,
} from "./cards";

export function SelectionStep({
  ranges,
  packages,
  draft,
  maxShooters,
  onPickRange,
  onPickPackage,
  onShooters,
}: {
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  draft: Draft;
  maxShooters: number;
  onPickRange: (id: string) => void;
  onPickPackage: (id: string) => void;
  onShooters: (value: number) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionLabel>Choose a facility</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ranges.map((r) => (
            <RangeCard
              key={r.id}
              range={r}
              active={r.id === draft.rangeId}
              onSelect={() => onPickRange(r.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Choose a package</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              active={p.id === draft.packageId}
              onSelect={() => onPickPackage(p.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <ShooterStepper
          value={draft.shooterCount}
          max={maxShooters}
          onChange={onShooters}
        />
      </section>
    </div>
  );
}
