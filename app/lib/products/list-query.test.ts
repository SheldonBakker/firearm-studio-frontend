import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_LIST_STATE,
  parseProductListParams,
  productListStateToApiParams,
  productListStateToSearch,
  type ProductListState,
} from "./list-query";

function roundTrip(state: ProductListState): ProductListState {
  return parseProductListParams(productListStateToSearch(state));
}

describe("list-query", () => {
  it("round-trips a default state with an empty search string", () => {
    const state = DEFAULT_PRODUCT_LIST_STATE;
    expect(productListStateToSearch(state).toString()).toBe("");
    expect(roundTrip(state)).toEqual(state);
  });

  it("round-trips a fully populated state", () => {
    const state: ProductListState = {
      q: "glock",
      category: "Ammo",
      status: "inactive",
      stock: "low",
      minPrice: "10",
      maxPrice: "999.99",
      sort: "price",
      dir: "desc",
      page: 3,
      size: 50,
    };
    expect(roundTrip(state)).toEqual(state);
  });

  it("clamps bad page and size to defaults", () => {
    const sp = new URLSearchParams("page=0&size=17");
    const parsed = parseProductListParams(sp);
    expect(parsed.page).toBe(1);
    expect(parsed.size).toBe(20);
  });

  it("falls back to default sort and dir on invalid values", () => {
    const sp = new URLSearchParams("sort=bogus&dir=sideways");
    const parsed = parseProductListParams(sp);
    expect(parsed.sort).toBe("name");
    expect(parsed.dir).toBe("asc");
  });

  it("maps stock and status to api params", () => {
    expect(
      productListStateToApiParams({
        ...DEFAULT_PRODUCT_LIST_STATE,
        stock: "low",
      }).maxStock,
    ).toBe(4);
    expect(
      productListStateToApiParams({
        ...DEFAULT_PRODUCT_LIST_STATE,
        stock: "out",
      }).maxStock,
    ).toBe(0);
    expect(
      productListStateToApiParams({
        ...DEFAULT_PRODUCT_LIST_STATE,
        stock: "in",
      }).minStock,
    ).toBe(1);
    expect(
      productListStateToApiParams({
        ...DEFAULT_PRODUCT_LIST_STATE,
        status: "inactive",
      }).isActive,
    ).toBe(false);
  });

  it("omits every filter key for a default state", () => {
    const params = productListStateToApiParams(DEFAULT_PRODUCT_LIST_STATE);
    expect(params).toEqual({
      sortBy: "name",
      sortDir: "asc",
      pageNumber: 1,
      pageSize: 20,
    });
    expect("search" in params).toBe(false);
    expect("category" in params).toBe(false);
    expect("isActive" in params).toBe(false);
    expect("minPrice" in params).toBe(false);
    expect("maxPrice" in params).toBe(false);
    expect("minStock" in params).toBe(false);
    expect("maxStock" in params).toBe(false);
  });
});
