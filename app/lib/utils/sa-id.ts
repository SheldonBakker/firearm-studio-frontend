// Mirrors FirearmStudio.Domain.Services.SouthAfricanIdValidator on the backend. A value that is
// exactly 13 digits is treated as a South African ID number and must pass the standard Luhn
// checksum. Any other value is accepted as a passport number, bounded only by length.

const SOUTH_AFRICAN_ID_LENGTH = 13;
const MAX_LENGTH = 20;

function isAllDigits(value: string): boolean {
  for (const ch of value) {
    if (ch < "0" || ch > "9") return false;
  }
  return true;
}

function hasValidLuhnChecksum(digits: string): boolean {
  let sum = 0;
  let doubleDigit = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - "0".charCodeAt(0);

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

/** True for a 13-digit numeric value, i.e. one that must pass the SA ID Luhn checksum. */
export function isSouthAfricanIdFormat(idNumber: string): boolean {
  return idNumber.length === SOUTH_AFRICAN_ID_LENGTH && isAllDigits(idNumber);
}

/** Validity for the attendee ID number field: SA ID checksum, or passport length fallback. */
export function isValidIdNumber(idNumber: string): boolean {
  if (!idNumber || idNumber.length > MAX_LENGTH) {
    return false;
  }

  if (!isSouthAfricanIdFormat(idNumber)) {
    return true;
  }

  return hasValidLuhnChecksum(idNumber);
}
