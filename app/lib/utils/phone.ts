import { z } from "zod";
import {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";

function e164Error(value: string): string {
  try {
    const country = parsePhoneNumber(value)?.country;
    if (country) return `Enter a valid phone number for ${country}.`;
  } catch {
  }
  return "Enter a valid phone number, including the country code.";
}

function normalizeE164(value: string): string {
  try {
    const parsed = parsePhoneNumber(value);
    if (parsed) return parsed.number;
  } catch {
  }
  return value;
}

export const optionalPhoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!isValidPhoneNumber(value)) {
      ctx.addIssue({ code: "custom", message: e164Error(value) });
    }
  })
  .transform((value) => (value ? normalizeE164(value) : ""));

export const requiredPhoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: "custom", message: "Phone number is required." });
      return;
    }
    if (!isValidPhoneNumber(value)) {
      ctx.addIssue({ code: "custom", message: e164Error(value) });
    }
  })
  .transform((value) => normalizeE164(value));

export function getPhoneError(value: string): string | null {
  if (!value) return null;
  return isValidPhoneNumber(value) ? null : e164Error(value);
}
