import type { Route } from "./+types/fca-notice";
import { LegalDoc, type LegalSection } from "~/components/marketing/legal-doc";
import { pageMeta } from "~/lib/seo";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Firearms Control Act Notice - Firearm Studio",
    description:
      "How Firearm Studio supports compliance with South Africa's Firearms Control Act, and where your responsibilities remain.",
    pathname: location.pathname,
  });
}

const sections: LegalSection[] = [
  {
    id: "purpose",
    h: "1. Purpose of this notice",
    body: [
      "This notice clarifies how Firearm Studio assists firearm storage businesses in meeting record-keeping and compliance requirements under the FCA. It is informational and does not constitute legal advice.",
    ],
  },
  {
    id: "records",
    h: "2. Record-keeping support",
    body: [
      "The platform structures custody and storage records around what the FCA and SAPS expect, helping you maintain a complete and accurate registry:",
    ],
    bullets: [
      "Firearm identification - make, model, serial number, and calibre.",
      "Licence linkage - association of firearms with valid licences and holders.",
      "Custody chain - records of receipt, storage location, and release.",
      "Storage records - bay or location assignment and movement history.",
    ],
  },
  {
    id: "licences",
    h: "3. Licence and renewal tracking",
    body: [
      "Firearm Studio tracks licence validity and surfaces automatic alerts ahead of expiry, helping you avoid lapses. Acting on those alerts, and applying for renewals within statutory timeframes, remains your responsibility.",
    ],
  },
  {
    id: "audit",
    h: "4. Audit trail and inspections",
    body: [
      "Every create, edit, and deletion is logged with the user and timestamp in a tamper-evident audit trail, producing inspection-ready records. You should ensure that staff use their own accounts so the trail accurately reflects who performed each action.",
    ],
  },
  {
    id: "responsibility",
    h: "5. Your responsibilities",
    body: [
      "Firearm Studio is a compliance tool, not a substitute for your legal duties. You remain responsible for holding the correct licences and permits, entering accurate data, securing physical storage to the required standard, and cooperating with SAPS and other authorities.",
    ],
  },
  {
    id: "updates",
    h: "6. Regulatory changes",
    body: [
      "Firearm legislation and regulations may change. We update the platform to reflect material regulatory changes where applicable, but you should stay informed of your obligations and seek professional advice where needed.",
    ],
  },
];

export default function FcaNotice() {
  return (
    <LegalDoc
      kicker="Legal · FCA"
      title="Firearms Control Act Notice"
      updated="1 June 2025"
      intro="Firearm Studio is designed to support compliance with the Firearms Control Act, 2000 (FCA) and its regulations. This notice explains how the platform supports your obligations and where your responsibilities remain."
      sections={sections}
    />
  );
}
