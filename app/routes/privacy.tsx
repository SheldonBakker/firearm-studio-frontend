import type { Route } from "./+types/privacy";
import { LegalDoc, type LegalSection } from "~/components/marketing/legal-doc";
import { pageMeta } from "~/lib/seo";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Privacy Policy - Firearm Studio",
    description:
      "How Firearm Studio collects, uses, and protects personal information, in line with South Africa's POPIA.",
    pathname: location.pathname,
  });
}

const sections: LegalSection[] = [
  {
    id: "overview",
    h: "1. Overview",
    body: [
      "Firearm Studio (“we”, “us”) provides storage and compliance management software for firearm storage businesses in South Africa. We take the privacy and security of personal information seriously and process it in line with the Protection of Personal Information Act (POPIA).",
      "By using our website or application, you agree to the practices described in this policy.",
    ],
  },
  {
    id: "collect",
    h: "2. Information we collect",
    body: ["We collect information needed to operate the service and meet regulatory obligations:"],
    bullets: [
      "Account details - name, work email, role, and the company you represent.",
      "Operational records you enter - firearm registry data, storage records, customer and licence details, and invoicing information.",
      "Usage and device data - log entries, IP address, and browser type, used to secure and improve the service.",
    ],
  },
  {
    id: "use",
    h: "3. How we use information",
    body: [
      "We use personal information to provide and maintain the service, authenticate users, generate compliance and audit records, process invoicing, respond to support requests, and meet legal obligations.",
      "We do not sell personal information, and we do not use the operational records you store for advertising.",
    ],
  },
  {
    id: "sharing",
    h: "4. Sharing and disclosure",
    body: ["We share information only where necessary to run the service or where required by law:"],
    bullets: [
      "Service providers - vetted processors (e.g. hosting and authentication) bound by confidentiality and POPIA obligations.",
      "Legal and regulatory - where disclosure is required by SAPS, a court, or applicable law.",
      "Business transfers - in connection with a merger or acquisition, subject to this policy.",
    ],
  },
  {
    id: "retention",
    h: "5. Data retention",
    body: [
      "We retain records for as long as your account is active and as required to meet legal, compliance, and audit obligations under the Firearms Control Act and related regulations. When data is no longer required, it is securely deleted or anonymised.",
    ],
  },
  {
    id: "security",
    h: "6. Security",
    body: [
      "Data is encrypted in transit and at rest and hosted in-region. Access is governed by role-based controls, and changes are recorded in a tamper-evident audit trail. While no system is perfectly secure, we maintain safeguards appropriate to the sensitivity of the data we handle.",
    ],
  },
  {
    id: "rights",
    h: "7. Your rights",
    body: [
      "Subject to POPIA, you may request access to, correction of, or deletion of your personal information, and you may object to certain processing. To exercise these rights, contact us using the details on our Contact page.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalDoc
      kicker="Legal · Privacy"
      title="Privacy Policy"
      updated="1 June 2025"
      intro="This policy explains what personal information Firearm Studio collects, how we use it, and the choices you have. It applies to our marketing site and the Firearm Studio application."
      sections={sections}
    />
  );
}
