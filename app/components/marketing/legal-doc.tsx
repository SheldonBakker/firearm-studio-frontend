import { Link } from "react-router";

export type LegalSection = {
  id: string;
  h: string;
  body: string[];
  bullets?: string[];
};

type LegalDocProps = {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalDoc({ kicker, title, intro, updated, sections }: LegalDocProps) {
  return (
    <div style={{ background: "var(--background)", overflow: "hidden" }}>
      <section style={{ borderBottom: "1px solid var(--line)", background: "var(--deep)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(18px,5vw,40px)" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--primary)",
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
              color: "var(--foreground)",
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
              color: "var(--muted-foreground)",
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
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--status-green)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "var(--muted-foreground)" }}>
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
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dim)" }}>
            On this page
          </div>
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              marginTop: 14,
              borderLeft: "1px solid var(--border)",
              paddingLeft: 14,
            }}
          >
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="transition-colors duration-150 hover:text-primary"
                style={{ fontSize: 13, lineHeight: 1.4, color: "var(--muted-foreground)", textDecoration: "none" }}
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
                  color: "var(--foreground)",
                }}
              >
                {s.h}
              </h2>
              {s.body.map((p, i) => (
                <p
                  key={i}
                  style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.72, color: "var(--muted-foreground)", textWrap: "pretty" }}
                >
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul style={{ margin: "4px 0 12px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 15, lineHeight: 1.6, color: "var(--muted-foreground)" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", padding: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--foreground)" }}>Questions about this policy?</div>
            <p style={{ margin: "7px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--muted-foreground)" }}>
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
                color: "var(--primary-foreground)",
                background: "var(--primary)",
                textDecoration: "none",
              }}
            >
              Contact us
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
