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

export function isSouthAfricanIdFormat(idNumber: string): boolean {
  return idNumber.length === SOUTH_AFRICAN_ID_LENGTH && isAllDigits(idNumber);
}

export function isValidIdNumber(idNumber: string): boolean {
  if (!idNumber || idNumber.length > MAX_LENGTH) {
    return false;
  }

  if (!isSouthAfricanIdFormat(idNumber)) {
    return true;
  }

  return hasValidLuhnChecksum(idNumber);
}
