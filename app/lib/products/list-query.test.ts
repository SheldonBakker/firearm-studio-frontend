import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_LIST_STATE,
  nextProductListState,
  parseProductListParams,
  productListStateToApiParams,
  productListStateToSearch,
  type ProductListState,
} from "./list-query";
import { PRODUCT_CATEGORIES } from "./categories";

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
      category: PRODUCT_CATEGORIES[0],
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

  it("reports no change when the draft already matches the URL", () => {
    const sp = new URLSearchParams("q=glock&minPrice=10&sort=price");
    expect(
      nextProductListState(sp, { q: "glock", minPrice: "10", maxPrice: "" }),
    ).toBeNull();
    expect(
      nextProductListState(new URLSearchParams(), {
        q: "",
        minPrice: "",
        maxPrice: "",
      }),
    ).toBeNull();
  });

  it("returns the next state with the page reset when the draft differs", () => {
    const sp = new URLSearchParams("q=glock&page=3");
    const next = nextProductListState(sp, {
      q: "ammo",
      minPrice: "",
      maxPrice: "",
    });
    expect(next).not.toBeNull();
    expect(next?.q).toBe("ammo");
    expect(next?.page).toBe(1);
  });

  it("keeps a valid category from the URL", () => {
    const sp = new URLSearchParams(
      `category=${encodeURIComponent(PRODUCT_CATEGORIES[1])}`,
    );
    const parsed = parseProductListParams(sp);
    expect(parsed.category).toBe(PRODUCT_CATEGORIES[1]);
  });

  it("drops an unknown category from the URL, falling back to empty", () => {
    const sp = new URLSearchParams("category=NotReal");
    const parsed = parseProductListParams(sp);
    expect(parsed.category).toBe("");
  });

  it("omits an unknown category from serialization and api params", () => {
    const state = parseProductListParams(
      new URLSearchParams("category=NotReal"),
    );
    expect(productListStateToSearch(state).has("category")).toBe(false);
    expect("category" in productListStateToApiParams(state)).toBe(false);
  });

  it("keeps the current price when the draft price is invalid", () => {
    const sp = new URLSearchParams("minPrice=10");
    expect(
      nextProductListState(sp, { q: "", minPrice: "abc", maxPrice: "" }),
    ).toBeNull();
  });
});
