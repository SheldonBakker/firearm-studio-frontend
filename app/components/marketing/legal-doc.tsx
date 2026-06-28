import { Link } from "react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export type LegalSection = {
  id: string;
  h: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocProps = {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalDoc({ kicker, title, intro, updated, sections }: LegalDocProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#0e1116", overflow: "hidden" }}>
      <SiteHeader />

      <section style={{ borderBottom: "1px solid #1f252e", background: "#0b0e12" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(18px,5vw,40px)" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#e8973c",
            }}
          >
            {kicker}
          </div>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: "clamp(30px,4.6vw,46px)",
              lineHeight: 1.08,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "#e6eaf0",
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: "18px 0 0",
              maxWidth: 620,
              fontSize: "clamp(14.5px,1.6vw,16.5px)",
              lineHeight: 1.6,
              color: "#8a93a2",
              textWrap: "pretty",
            }}
          >
            {intro}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #262d38",
              background: "#14181f",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3fb68b" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#8a93a2" }}>
              Last updated {updated}
            </span>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "clamp(32px,5vw,56px) clamp(18px,5vw,40px) clamp(56px,8vw,88px)",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(28px,4vw,56px)",
          alignItems: "flex-start",
        }}
      >
        <aside style={{ flex: "1 1 200px", minWidth: 200, position: "sticky", top: 88 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5c6573" }}>
            On this page
          </div>
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              marginTop: 14,
              borderLeft: "1px solid #262d38",
              paddingLeft: 14,
            }}
          >
            {sections.map((s) => (
              <a
                key={s.id}
                className="mk-toc-link"
                href={`#${s.id}`}
                style={{ fontSize: 13, lineHeight: 1.4, color: "#8a93a2", textDecoration: "none" }}
              >
                {s.h}
              </a>
            ))}
          </nav>
        </aside>

        <div style={{ flex: "3 1 460px", minWidth: 300 }}>
          {sections.map((s) => (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: 90, marginBottom: 36 }}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "clamp(18px,2.2vw,22px)",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#e6eaf0",
                }}
              >
                {s.h}
              </h2>
              {s.body.map((p, i) => (
                <p
                  key={i}
                  style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.72, color: "#8a93a2", textWrap: "pretty" }}
                >
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul style={{ margin: "4px 0 12px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 15, lineHeight: 1.6, color: "#8a93a2" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8, border: "1px solid #262d38", borderRadius: 16, background: "#14181f", padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#e6eaf0" }}>Questions about this policy?</div>
            <p style={{ margin: "7px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#8a93a2" }}>
              Reach our team and we'll point you in the right direction.
            </p>
            <Link
              to="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 14,
                height: 40,
                padding: "0 18px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "#1a1206",
                background: "#e8973c",
                textDecoration: "none",
              }}
            >
              Contact us
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1206" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
