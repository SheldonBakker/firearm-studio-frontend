import { describe, expect, it } from "vitest";
import { buildProductPatch, type NormalizedProductForm } from "./schema";
import type { ProductResponse } from "~/lib/api/products/types";

function original(overrides: Partial<ProductResponse>): ProductResponse {
  return {
    id: "p1",
    name: "Widget",
    description: null,
    sku: "ABC",
    price: 10,
    costPrice: 6,
    category: "Ammo",
    stockQuantity: 4,
    imageUrl: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function form(overrides: Partial<NormalizedProductForm>): NormalizedProductForm {
  return {
    name: "Widget",
    sku: "ABC",
    category: "Ammo",
    description: null,
    price: 10,
    costPrice: 6,
    stockQuantity: 4,
    isActive: true,
    ...overrides,
  };
}

describe("buildProductPatch", () => {
  it("returns an empty object when nothing changed", () => {
    expect(buildProductPatch(original({}), form({}))).toEqual({});
  });

  it("includes only a changed name", () => {
    expect(buildProductPatch(original({}), form({ name: "New" }))).toEqual({
      name: "New",
    });
  });

  it("sends explicit null when clearing a set sku", () => {
    expect(buildProductPatch(original({}), form({ sku: null }))).toEqual({
      sku: null,
    });
  });

  it("omits a both-null sku", () => {
    expect(
      buildProductPatch(original({ sku: null }), form({ sku: null })),
    ).toEqual({});
  });

  it("treats 10 and 10.00 as unchanged", () => {
    expect(buildProductPatch(original({ price: 10 }), form({ price: 10 }))).toEqual(
      {},
    );
  });

  it("clears a cost from a number to null", () => {
    expect(
      buildProductPatch(original({ costPrice: 0 }), form({ costPrice: null })),
    ).toEqual({ costPrice: null });
  });

  it("sets a cost from null to zero", () => {
    expect(
      buildProductPatch(original({ costPrice: null }), form({ costPrice: 0 })),
    ).toEqual({ costPrice: 0 });
  });
});
