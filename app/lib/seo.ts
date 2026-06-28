import type { MetaDescriptor } from "react-router";

export const SITE_URL = "https://firearmstudio.com";
export const SITE_NAME = "Firearm Studio";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const SUPPORT_EMAIL = "support@firearmstudio.com";

export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/popia",
  "/fca-notice",
] as const;

export function canonical(pathname: string): string {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "");
  return path === "" ? SITE_URL : `${SITE_URL}${path}`;
}

type PageMetaOptions = {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function pageMeta(o: PageMetaOptions): MetaDescriptor[] {
  const url = canonical(o.pathname);
  const image = o.image ?? DEFAULT_OG_IMAGE;
  const tags: MetaDescriptor[] = [
    { title: o.title },
    { name: "description", content: o.description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: o.title },
    { property: "og:description", content: o.description },
    { property: "og:type", content: o.type ?? "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_ZA" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: o.title },
    { name: "twitter:description", content: o.description },
    { name: "twitter:image", content: image },
  ];
  if (o.noIndex) {
    tags.push({ name: "robots", content: "noindex, nofollow" });
  }
  return tags;
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description:
      "Storage and compliance management software for South African firearm storage providers.",
    areaServed: "ZA",
    contactPoint: {
      "@type": "ContactPoint",
      email: SUPPORT_EMAIL,
      contactType: "customer support",
    },
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}
