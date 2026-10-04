import type { ProductFormValues } from "~/lib/products/schema";

export const FIELD_IDS: Record<keyof ProductFormValues, string> = {
  name: "product-name",
  sku: "product-sku",
  category: "product-category",
  description: "product-description",
  price: "product-price",
  costPrice: "product-cost",
  stockQuantity: "product-stock",
  isActive: "product-active",
};

export function focusFirstError(
  errors: Partial<Record<keyof ProductFormValues, string>>,
) {
  for (const key of Object.keys(FIELD_IDS) as (keyof ProductFormValues)[]) {
    if (errors[key]) {
      document.getElementById(FIELD_IDS[key])?.focus();
      return;
    }
  }
}
