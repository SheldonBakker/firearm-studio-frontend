import { describe, expect, it } from "vitest";
import { parseProductForm, type ProductFormValues } from "./schema";
import { PRODUCT_CATEGORIES } from "./categories";

function values(overrides: Partial<ProductFormValues>): ProductFormValues {
  return {
    name: "Widget",
    sku: "",
    category: PRODUCT_CATEGORIES[0],
    description: "",
    price: "10",
    costPrice: "",
    stockQuantity: "0",
    isActive: true,
    ...overrides,
  };
}

describe("parseProductForm", () => {
  it("requires a name and caps it at 200", () => {
    expect(parseProductForm(values({ name: "  " })).ok).toBe(false);
    const long = parseProductForm(values({ name: "a".repeat(201) }));
    expect(long.ok).toBe(false);
  });

  it("caps sku at 64 and normalizes whitespace-only to null", () => {
    const over = parseProductForm(values({ sku: "a".repeat(65) }));
    expect(over.ok).toBe(false);
    const blank = parseProductForm(values({ sku: "   " }));
    expect(blank.ok).toBe(true);
    if (blank.ok) expect(blank.data.sku).toBeNull();
  });

  it("accepts valid prices", () => {
    for (const price of ["0", "10", "10.50", "9999999999.99", " 10 "]) {
      expect(parseProductForm(values({ price })).ok).toBe(true);
    }
  });

  it("rejects invalid prices", () => {
    for (const price of ["", "-1", "10.123", "1e10", ".5", "10."]) {
      expect(parseProductForm(values({ price })).ok).toBe(false);
    }
  });

  it("rejects non-integer or negative stock", () => {
    expect(parseProductForm(values({ stockQuantity: "1.5" })).ok).toBe(false);
    expect(parseProductForm(values({ stockQuantity: "-1" })).ok).toBe(false);
    expect(parseProductForm(values({ stockQuantity: "3" })).ok).toBe(true);
  });

  it("accepts a valid PRODUCT_CATEGORIES value for category", () => {
    const result = parseProductForm(
      values({ category: PRODUCT_CATEGORIES[0] }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.category).toBe(PRODUCT_CATEGORIES[0]);
  });

  it("rejects empty category with required message", () => {
    const result = parseProductForm(values({ category: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.category).toBe("Category is required.");
    }
  });

  it("rejects an unknown category with the fixed message", () => {
    const result = parseProductForm(
      values({ category: "Not A Real Category" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.category).toBe(
        "Choose a category from the list.",
      );
    }
  });

  it("normalizes empty optional fields to null", () => {
    const parsed = parseProductForm(
      values({ category: PRODUCT_CATEGORIES[0] }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.sku).toBeNull();
      expect(parsed.data.description).toBeNull();
      expect(parsed.data.costPrice).toBeNull();
      expect(parsed.data.price).toBe(10);
      expect(parsed.data.stockQuantity).toBe(0);
    }
  });
});
