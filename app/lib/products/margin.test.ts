import { describe, expect, it } from "vitest";
import { fmtMarginPercent, marginAmount, marginPercent } from "./margin";

describe("margin", () => {
  it("returns null when cost is null", () => {
    expect(marginAmount(100, null)).toBeNull();
    expect(marginPercent(100, null)).toBeNull();
    expect(fmtMarginPercent(100, null)).toBe("");
  });

  it("returns null percent when price is zero", () => {
    expect(marginPercent(0, 0)).toBeNull();
    expect(fmtMarginPercent(0, 0)).toBe("");
  });

  it("computes amount and percent for the normal case", () => {
    expect(marginAmount(100, 60)).toBe(40);
    expect(marginPercent(100, 60)).toBe(40);
    expect(fmtMarginPercent(100, 60)).toBe("40.0%");
  });
});
