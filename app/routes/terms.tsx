import type { Route } from "./+types/terms";
import { LegalDoc, type LegalSection } from "~/components/marketing/legal-doc";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Terms of Service — Firearm Studio" },
    {
      name: "description",
      content:
        "The terms governing your access to and use of Firearm Studio, governed by the laws of South Africa.",
    },
  ];
}

const sections: LegalSection[] = [
  {
    id: "acceptance",
    h: "1. Acceptance of terms",
    body: [
      "By accessing or using Firearm Studio, you confirm that you are authorised to bind your company to these terms and that the information you provide is accurate. If you do not agree, do not use the service.",
    ],
  },
  {
    id: "accounts",
    h: "2. Accounts and access",
    body: [
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Access is granted on a role basis — Owner, Admin, Clerk, and Viewer — and you must ensure roles are assigned appropriately.",
      "You must notify us promptly of any unauthorised use of your account.",
    ],
  },
  {
    id: "use",
    h: "3. Acceptable use",
    body: [
      "You agree to use Firearm Studio only for lawful purposes and in compliance with applicable firearm, privacy, and data-protection laws. You must not:",
    ],
    bullets: [
      "Enter false, misleading, or unlawful records.",
      "Attempt to access data belonging to other organisations.",
      "Interfere with, disrupt, or reverse-engineer the service.",
    ],
  },
  {
    id: "data",
    h: "4. Your data and compliance",
    body: [
      "You retain ownership of the records you enter. You are responsible for the accuracy and lawfulness of that data and for meeting your own obligations under the Firearms Control Act. Firearm Studio is a tool to support compliance — it does not replace your legal duties.",
    ],
  },
  {
    id: "availability",
    h: "5. Availability and changes",
    body: [
      "We aim to keep the service available and reliable but do not guarantee uninterrupted access. We may update, suspend, or discontinue features, and will give reasonable notice of material changes where practical.",
    ],
  },
  {
    id: "liability",
    h: "6. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Firearm Studio is provided “as is”. We are not liable for indirect or consequential losses, or for losses arising from your failure to meet your own regulatory obligations. Nothing in these terms limits liability that cannot be limited by law.",
    ],
  },
  {
    id: "termination",
    h: "7. Termination",
    body: [
      "You may stop using the service at any time. We may suspend or terminate access for breach of these terms. On termination, you may request an export of your records, subject to applicable retention requirements.",
    ],
  },
  {
    id: "law",
    h: "8. Governing law",
    body: [
      "These terms are governed by the laws of the Republic of South Africa, and the courts of South Africa have exclusive jurisdiction over any disputes.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalDoc
      kicker="Legal · Terms"
      title="Terms of Service"
      updated="1 June 2025"
      intro="These terms govern your access to and use of Firearm Studio. By creating an account or using the service, you agree to them on behalf of yourself and the company you represent."
      sections={sections}
    />
  );
}
