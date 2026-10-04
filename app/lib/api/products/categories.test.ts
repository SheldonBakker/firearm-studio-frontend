import { describe, expect, it } from "vitest";
import { normalizeCategories } from "./products";

describe("normalizeCategories", () => {
  it("drops null and blank values", () => {
    expect(normalizeCategories([null, "", "   "])).toEqual([]);
  });

  it("dedupes case-insensitively keeping first-seen casing and sorts", () => {
    expect(
      normalizeCategories(["Ammo", "ammo", null, "  ", "Optics", "optics"]),
    ).toEqual(["Ammo", "Optics"]);
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeCategories(["  Rifles  ", "pistols"])).toEqual([
      "pistols",
      "Rifles",
    ]);
  });
});
