import type { Route } from "./+types/popia";
import { LegalDoc, type LegalSection } from "~/components/marketing/legal-doc";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "POPIA Compliance — Firearm Studio" },
    {
      name: "description",
      content:
        "How Firearm Studio applies the eight processing conditions of South Africa's Protection of Personal Information Act.",
    },
  ];
}

const sections: LegalSection[] = [
  {
    id: "commitment",
    h: "1. Our commitment",
    body: [
      "We process personal information lawfully, fairly, and transparently. As an operator handling sensitive firearm and customer data, we apply POPIA's eight processing conditions across the service.",
    ],
  },
  {
    id: "conditions",
    h: "2. The eight conditions",
    body: ["We align our processing with POPIA's conditions for lawful processing:"],
    bullets: [
      "Accountability — a designated Information Officer oversees compliance.",
      "Processing limitation — we collect only what is necessary, with a lawful basis.",
      "Purpose specification — data is collected for clear, compliance-related purposes.",
      "Further processing limitation — data is not used in ways incompatible with those purposes.",
      "Information quality — tools help you keep records accurate and current.",
      "Openness — we document and disclose our processing in this notice.",
      "Security safeguards — encryption, access control, and audit logging protect data.",
      "Data subject participation — individuals can exercise their rights (see below).",
    ],
  },
  {
    id: "officer",
    h: "3. Information Officer",
    body: [
      "We maintain a registered Information Officer responsible for POPIA compliance, handling data-subject requests, and liaising with the Information Regulator. Requests can be directed through our Contact page.",
    ],
  },
  {
    id: "rights",
    h: "4. Data-subject rights",
    body: [
      "Individuals whose data we process may request access to their information, correction or deletion of inaccurate or unlawfully held data, and may object to certain processing. We respond to valid requests within the timeframes set by POPIA.",
    ],
  },
  {
    id: "operators",
    h: "5. Operators and transfers",
    body: [
      "Where we use third-party operators (for example, hosting and authentication), they are bound by written agreements requiring POPIA-compliant safeguards. Personal information is hosted in-region, and any cross-border transfer would only occur with adequate protection in place.",
    ],
  },
  {
    id: "breach",
    h: "6. Breach notification",
    body: [
      "In the event of a security compromise affecting personal information, we will notify the Information Regulator and affected parties as required by POPIA, and take prompt steps to contain and remediate the incident.",
    ],
  },
];

export default function Popia() {
  return (
    <LegalDoc
      kicker="Legal · POPIA"
      title="POPIA Compliance"
      updated="1 June 2025"
      intro="Firearm Studio is built to help your business meet its obligations under the Protection of Personal Information Act, 2013 (POPIA). This notice sets out how we apply POPIA's principles."
      sections={sections}
    />
  );
}
