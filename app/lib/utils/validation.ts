import { z } from "zod";

const EMAIL_ERROR = "Enter a valid email address.";

const trimmedString = z.string().trim();

export const optionalEmailSchema = trimmedString
  .pipe(z.union([z.literal(""), z.email({ error: EMAIL_ERROR })]))
  .transform((value) => value.toLowerCase());

export const requiredEmailSchema = trimmedString
  .pipe(z.string().min(1, "Email is required."))
  .pipe(z.email({ error: EMAIL_ERROR }))
  .transform((value) => value.toLowerCase());

export function requiredTextSchema(label: string) {
  return z.string().trim().min(1, `${label} is required.`);
}
