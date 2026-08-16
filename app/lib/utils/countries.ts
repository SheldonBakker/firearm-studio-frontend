import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0)),
    );
}

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
