import { z } from "zod";
import type {
  ProductResponse,
  UpdateProductRequest,
} from "~/lib/api/products/types";

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  costPrice: string;
  stockQuantity: string;
  isActive: boolean;
}

export interface NormalizedProductForm {
  name: string;
  sku: string | null;
  category: string | null;
  description: string | null;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

const PRICE_MAX = 9999999999.99;
const NUMBER_RE = /^\d+(\.\d+)?$/;

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length ? value : null));
}

function requiredNumber(label: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value.length === 0 || !NUMBER_RE.test(value)) {
        ctx.addIssue({ code: "custom", message: `Enter a valid ${label}.` });
        return;
      }
      const decimals = value.split(".")[1];
      if (decimals && decimals.length > 2) {
        ctx.addIssue({
          code: "custom",
          message: `${capitalize(label)} can have at most 2 decimal places.`,
        });
        return;
      }
      const n = Number(value);
      if (!(n >= 0 && n <= PRICE_MAX)) {
        ctx.addIssue({
          code: "custom",
          message: `${capitalize(label)} must be between 0 and 9 999 999 999.99.`,
        });
      }
    })
    .transform((value) => Number(value));
}

function optionalNumber(label: string) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value.length === 0) return;
      if (!NUMBER_RE.test(value)) {
        ctx.addIssue({ code: "custom", message: `Enter a valid ${label}.` });
        return;
      }
      const decimals = value.split(".")[1];
      if (decimals && decimals.length > 2) {
        ctx.addIssue({
          code: "custom",
          message: `${capitalize(label)} can have at most 2 decimal places.`,
        });
        return;
      }
      const n = Number(value);
      if (!(n >= 0 && n <= PRICE_MAX)) {
        ctx.addIssue({
          code: "custom",
          message: `${capitalize(label)} must be between 0 and 9 999 999 999.99.`,
        });
      }
    })
    .transform((value) => (value.length ? Number(value) : null));
}

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be 200 characters or fewer."),
  sku: optionalText(64, "SKU must be 64 characters or fewer."),
  category: optionalText(100, "Category must be 100 characters or fewer."),
  description: optionalText(4000, "Description must be 4000 characters or fewer."),
  price: requiredNumber("price"),
  costPrice: optionalNumber("cost price"),
  stockQuantity: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!/^\d+$/.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Stock must be a whole number of 0 or more.",
        });
      }
    })
    .transform((value) => Number(value)),
  isActive: z.boolean(),
});

export function parseProductForm(
  values: ProductFormValues,
):
  | { ok: true; data: NormalizedProductForm }
  | { ok: false; fieldErrors: Partial<Record<keyof ProductFormValues, string>> } {
  const result = productFormSchema.safeParse(values);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const fieldErrors: Partial<Record<keyof ProductFormValues, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key as keyof ProductFormValues] = issue.message;
    }
  }
  return { ok: false, fieldErrors };
}

export function buildProductPatch(
  original: ProductResponse,
  form: NormalizedProductForm,
): UpdateProductRequest {
  const patch: UpdateProductRequest = {};
  if (form.name !== original.name) patch.name = form.name;
  if (form.price !== original.price) patch.price = form.price;
  if (form.stockQuantity !== original.stockQuantity) {
    patch.stockQuantity = form.stockQuantity;
  }
  if (form.isActive !== original.isActive) patch.isActive = form.isActive;
  if (form.sku !== original.sku) patch.sku = form.sku;
  if (form.category !== original.category) patch.category = form.category;
  if (form.description !== original.description) {
    patch.description = form.description;
  }
  if (form.costPrice !== original.costPrice) patch.costPrice = form.costPrice;
  return patch;
}
