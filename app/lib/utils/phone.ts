import { z } from "zod";

const SOUTH_AFRICAN_PHONE_ERROR =
  "Enter a valid South African cellphone or landline number.";

const LANDLINE_AREA_CODES = new Set([
  "010",
  "011",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
  "018",
  "021",
  "022",
  "023",
  "027",
  "028",
  "031",
  "032",
  "033",
  "034",
  "035",
  "036",
  "039",
  "040",
  "041",
  "042",
  "043",
  "044",
  "045",
  "046",
  "047",
  "048",
  "049",
  "051",
  "053",
  "054",
  "056",
  "057",
  "058",
]);

const MOBILE_PREFIX = /^(?:06\d|07[1-4]|07[6-9]|08[1-4])$/;
const ALLOWED_PHONE_CHARACTERS = /^[+\d\s()-]+$/;

function getNationalNumber(value: string): string | null {
  const input = value.trim();

  if (!input || !ALLOWED_PHONE_CHARACTERS.test(input)) return null;

  const compact = input.replace(/[\s()-]/g, "");
  let nationalNumber: string;

  if (compact.startsWith("+27")) {
    nationalNumber = `0${compact.slice(3)}`;
  } else if (compact.startsWith("0027")) {
    nationalNumber = `0${compact.slice(4)}`;
  } else {
    nationalNumber = compact;
  }

  if (!/^0\d{9}$/.test(nationalNumber)) return null;

  const prefix = nationalNumber.slice(0, 3);
  return MOBILE_PREFIX.test(prefix) || LANDLINE_AREA_CODES.has(prefix)
    ? nationalNumber
    : null;
}

function createSouthAfricanPhoneSchema(required: boolean) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!value) {
        if (required) {
          context.addIssue({
            code: "custom",
            message: "Phone is required.",
          });
        }
        return;
      }

      if (!getNationalNumber(value)) {
        context.addIssue({
          code: "custom",
          message: SOUTH_AFRICAN_PHONE_ERROR,
        });
      }
    })
    .transform((value) => {
      if (!value) return "";
      const nationalNumber = getNationalNumber(value);
      return nationalNumber ? `+27${nationalNumber.slice(1)}` : value;
    });
}

export const optionalSouthAfricanPhoneSchema =
  createSouthAfricanPhoneSchema(false);
export const requiredSouthAfricanPhoneSchema =
  createSouthAfricanPhoneSchema(true);

export function getSouthAfricanPhoneError(value: string): string | null {
  const result = optionalSouthAfricanPhoneSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
}

export function getSouthAfricanNationalDigits(value: string): string {
  const input = value.trim();
  const digits = input.replace(/\D/g, "");

  if (input.startsWith("+27")) return digits.slice(2, 11);
  if (digits.startsWith("0027")) return digits.slice(4, 13);
  if (digits.length > 9 && digits.startsWith("27")) {
    return digits.slice(2, 11);
  }
  if (digits.startsWith("0")) return digits.slice(1, 10);
  return digits.slice(0, 9);
}
