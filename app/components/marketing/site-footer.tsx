import { Link } from "react-router";
import { BrandMark } from "~/components/common/brand";

type FooterLink = { label: string; to: string; hash?: boolean };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/#features", hash: true },
      { label: "Integrations", to: "/#integrations", hash: true },
      { label: "Compliance", to: "/#compliance", hash: true },
      { label: "Security", to: "/#compliance", hash: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "POPIA", to: "/popia" },
      { label: "FCA notice", to: "/fca-notice" },
    ],
  },
];

const linkStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--dim)",
  width: "fit-content",
  textDecoration: "none",
};

function FootLink({ link }: { link: FooterLink }) {
  if (link.hash) {
    return (
      <a className="transition-colors duration-150 hover:text-foreground" href={link.to} style={linkStyle}>
        {link.label}
      </a>
    );
  }
  return (
    <Link className="transition-colors duration-150 hover:text-foreground" to={link.to} style={linkStyle}>
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--deep)",
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(40px,5vw,56px) clamp(18px,5vw,40px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            gap: 32,
          }}
        >
          <div style={{ gridColumn: "1 / -1", maxWidth: 300 }}>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <BrandMark size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
                Firearm Studio
              </span>
            </Link>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--dim)",
              }}
            >
              Storage &amp; compliance management for South African firearm
              storage providers.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--muted-foreground)",
                }}
              >
                {col.heading}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {col.links.map((link, i) => (
                  <FootLink key={`${link.label}-${i}`} link={link} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--line)",
          }}
        >
          <span suppressHydrationWarning style={{ fontSize: 12.5, color: "var(--dim)" }}>
            © {new Date().getFullYear()} Firearm Studio. All rights reserved.
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              color: "var(--dim)",
            }}
          >
            Made for SA storage providers · POPIA compliant
          </span>
        </div>
      </div>
    </footer>
  );
}
