import { ApiError } from "../http";

export type ProductErrorOutcome =
  | { kind: "sku-conflict"; message: string }
  | { kind: "image"; message: string; retryable: boolean }
  | { kind: "not-found"; message: string }
  | { kind: "generic"; message: string };

const SKU_CONFLICT = new Set([
  "CreateProductCommand.SkuConflict",
  "UpdateProductCommand.SkuConflict",
]);

const NOT_FOUND = new Set([
  "GetProductQuery.NotFound",
  "UpdateProductCommand.NotFound",
  "DeleteProductCommand.NotFound",
  "DeleteProductImageCommand.NotFound",
]);

export function mapProductError(err: unknown): ProductErrorOutcome {
  if (err instanceof ApiError) {
    const code = err.code;
    if (code && SKU_CONFLICT.has(code)) {
      return { kind: "sku-conflict", message: "This SKU is already in use." };
    }
    if (code === "UploadProductImageCommand.InvalidImage") {
      return {
        kind: "image",
        message: "That file is not a valid JPEG, PNG, or WEBP image.",
        retryable: false,
      };
    }
    if (code === "UploadProductImageCommand.TooLarge") {
      return {
        kind: "image",
        message: "Image must be 5 MB or smaller.",
        retryable: false,
      };
    }
    if (code === "UploadProductImageCommand.StorageUnavailable") {
      return {
        kind: "image",
        message: "Image storage is unavailable right now. Try again.",
        retryable: true,
      };
    }
    if (code && NOT_FOUND.has(code)) {
      return { kind: "not-found", message: "This product no longer exists." };
    }
    return { kind: "generic", message: err.message };
  }
  return { kind: "generic", message: "Something went wrong." };
}
