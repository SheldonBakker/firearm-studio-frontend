import { describe, expect, it } from "vitest";
import { ApiError } from "../http";
import { mapProductError } from "./errors";

describe("mapProductError", () => {
  it("maps create and update sku conflicts", () => {
    for (const code of [
      "CreateProductCommand.SkuConflict",
      "UpdateProductCommand.SkuConflict",
    ]) {
      const outcome = mapProductError(new ApiError(409, "x", undefined, code));
      expect(outcome).toEqual({
        kind: "sku-conflict",
        message: "This SKU is already in use.",
      });
    }
  });

  it("maps image errors with retryable flags", () => {
    expect(
      mapProductError(
        new ApiError(400, "x", undefined, "UploadProductImageCommand.InvalidImage"),
      ),
    ).toEqual({
      kind: "image",
      message: "That file is not a valid JPEG, PNG, or WEBP image.",
      retryable: false,
    });
    expect(
      mapProductError(
        new ApiError(400, "x", undefined, "UploadProductImageCommand.TooLarge"),
      ),
    ).toEqual({
      kind: "image",
      message: "Image must be 5 MB or smaller.",
      retryable: false,
    });
    expect(
      mapProductError(
        new ApiError(
          502,
          "x",
          undefined,
          "UploadProductImageCommand.StorageUnavailable",
        ),
      ),
    ).toEqual({
      kind: "image",
      message: "Image storage is unavailable right now. Try again.",
      retryable: true,
    });
  });

  it("maps all not-found codes", () => {
    for (const code of [
      "GetProductQuery.NotFound",
      "UpdateProductCommand.NotFound",
      "DeleteProductCommand.NotFound",
      "DeleteProductImageCommand.NotFound",
    ]) {
      expect(mapProductError(new ApiError(404, "x", undefined, code))).toEqual({
        kind: "not-found",
        message: "This product no longer exists.",
      });
    }
  });

  it("falls back to the ApiError message for an unknown code", () => {
    expect(
      mapProductError(new ApiError(500, "boom", undefined, "Other.Code")),
    ).toEqual({ kind: "generic", message: "boom" });
  });

  it("falls back to a generic message for a non-ApiError", () => {
    expect(mapProductError(new Error("nope"))).toEqual({
      kind: "generic",
      message: "Something went wrong.",
    });
  });
});
