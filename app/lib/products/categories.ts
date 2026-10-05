export const PRODUCT_CATEGORIES = [
  "Firearms",
  "Ammunition",
  "Magazines & Loading",
  "Optics & Sights",
  "Firearm Accessories",
  "Holsters & Carry",
  "Safes & Security",
  "Cleaning & Maintenance",
  "Gunsmithing & Parts",
  "Range Equipment",
  "Hearing Protection",
  "Eye Protection",
  "Hunting",
  "Tactical Gear",
  "Lights & Illumination",
  "Reloading",
  "Knives & Tools",
  "Outdoor & Survival",
  "Clothing",
  "Footwear",
  "Bags & Cases",
  "Competition Shooting",
  "Airguns & Accessories",
  "Archery",
  "Security Equipment",
  "Books & Training",
  "Merchandise",
  "Services",
  "Licensing & Administration",
  "Gift Cards",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
