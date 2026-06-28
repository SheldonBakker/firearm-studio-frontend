import { Link } from "react-router";
import type { Route } from "./+types/about";
import { SiteHeader } from "~/components/marketing/site-header";
import { SiteFooter } from "~/components/marketing/site-footer";
import { pageMeta } from "~/lib/seo";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "About - Firearm Studio",
    description:
      "Firearm Studio is built by storage operators, for storage operators - taking the friction out of compliant firearm storage in South Africa.",
    pathname: location.pathname,
  });
}

const BLUE = "#4c8df0";
const GREEN = "#3fb68b";
const AMBER = "#e8973c";
const PURPLE = "#9a7cf0";
const chip = (c: string) => `color-mix(in srgb, ${c} 14%, transparent)`;

const ic = {
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z"></path><path d="M9 12l2 2 4-4"></path>',
  list: '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
  users: '<path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path><path d="M2 21a8 8 0 0 1 16 0"></path>',
  target: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4.5"></circle><path d="M12 12h.01"></path>',
} as const;

function Glyph({ d, size = 21 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

const values = [
  { title: "Compliance first", body: "Every feature is shaped by the Firearms Control Act. If it doesn't help you stay compliant, it doesn't ship.", color: AMBER, svg: ic.shield },
  { title: "Accountable by design", body: "A complete, tamper-evident record of who did what, and when - so accountability is never in question.", color: PURPLE, svg: ic.list },
  { title: "Built for real operators", body: "We work alongside dealers, gunsmiths, and facilities to make sure the product fits the day-to-day.", color: BLUE, svg: ic.users },
  { title: "Precision over noise", body: "Clear data, no clutter. The numbers that matter, surfaced the moment you need them.", color: GREEN, svg: ic.target },
];

const metrics = [
  { value: "12k+", label: "Firearms under management" },
  { value: "99.9%", label: "Audit accuracy" },
  { value: "100%", label: "SAPS-ready records" },
  { value: "In-region", label: "Data hosted in South Africa" },
];

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#e8973c",
};

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e1116", overflow: "hidden" }}>
      <SiteHeader />

      <section style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -160,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(800px,120vw)",
            height: 440,
            background: "radial-gradient(ellipse at center, rgba(232,151,60,0.13), rgba(232,151,60,0) 68%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,40px) clamp(24px,3vw,32px)", textAlign: "center" }}>
          <div style={eyebrow}>About us</div>
          <h1 style={{ margin: "14px 0 0", fontSize: "clamp(32px,5vw,52px)", lineHeight: 1.06, fontWeight: 700, letterSpacing: "-0.025em", color: "#e6eaf0", textWrap: "balance" }}>
            Built by storage operators, for storage operators
          </h1>
          <p style={{ margin: "20px auto 0", maxWidth: 600, fontSize: "clamp(15px,1.7vw,18px)", lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>
            Firearm Studio exists to take the friction out of compliant firearm storage - so South African operators can
            spend less time on paperwork and more time running a safe, accountable business.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(18px,5vw,40px)", display: "flex", flexWrap: "wrap", gap: "clamp(32px,5vw,56px)", alignItems: "center" }}>
        <div style={{ flex: "1 1 380px", minWidth: 300 }}>
          <div style={eyebrow}>Our story</div>
          <h2 style={{ margin: "14px 0 0", fontSize: "clamp(24px,3.4vw,34px)", lineHeight: 1.12, fontWeight: 700, letterSpacing: "-0.02em", color: "#e6eaf0", textWrap: "balance" }}>
            We were drowning in spreadsheets, too
          </h2>
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.65, color: "#8a93a2", textWrap: "pretty" }}>
            Firearm Studio began inside a working storage facility. Tracking custody, licence expiry dates, and monthly
            invoicing across spreadsheets and paper files was slow, error-prone, and a real risk at inspection time.
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.65, color: "#8a93a2", textWrap: "pretty" }}>
            So we built the system we wished we had: one secure place for the registry, storage records, licences, and
            billing - structured around the Firearms Control Act and ready for SAPS at any moment. Today it manages
            thousands of firearms for operators across the country.
          </p>
        </div>
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <div style={{ border: "1px solid #262d38", borderRadius: 18, background: "#14181f", padding: "clamp(24px,3vw,32px)", boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#e8973c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <p style={{ margin: "18px 0 0", fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.5, fontWeight: 600, color: "#e6eaf0", textWrap: "pretty" }}>
              "Compliance shouldn't be the hardest part of running a storage business. It should be the part you never
              have to worry about."
            </p>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 999, background: "#222834", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#e8973c" }}>JM</span>
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#e6eaf0" }}>J. Mokoena</span>
                <span style={{ display: "block", fontSize: 12, color: "#5c6573" }}>Founder &amp; storage operator</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "#0b0e12", borderTop: "1px solid #1f252e", borderBottom: "1px solid #1f252e" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,40px)" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={eyebrow}>What we stand for</div>
            <h2 style={{ margin: "14px 0 0", fontSize: "clamp(26px,3.6vw,38px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", color: "#e6eaf0", textWrap: "balance" }}>
              Values that hold up at inspection
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: "clamp(28px,4vw,44px)" }}>
            {values.map((v) => (
              <div key={v.title} style={{ border: "1px solid #262d38", borderRadius: 18, background: "#14181f", padding: 24 }}>
                <span style={{ display: "inline-flex", width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", color: v.color, background: chip(v.color) }}>
                  <Glyph d={v.svg} />
                </span>
                <h3 style={{ margin: "16px 0 0", fontSize: 16, fontWeight: 700, color: "#e6eaf0" }}>{v.title}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(18px,5vw,40px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 24, textAlign: "center" }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#e8973c" }}>{m.value}</div>
              <div style={{ marginTop: 5, fontSize: 13, color: "#8a93a2" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(18px,5vw,40px) clamp(56px,8vw,96px)" }}>
        <div style={{ position: "relative", border: "1px solid #333b49", borderRadius: 24, background: "linear-gradient(135deg,#1a1f28,#14181f)", padding: "clamp(36px,6vw,56px) clamp(24px,5vw,48px)", textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 560, height: 340, background: "radial-gradient(ellipse at center, rgba(232,151,60,0.16), rgba(232,151,60,0) 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ margin: 0, fontSize: "clamp(24px,3.6vw,38px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", color: "#e6eaf0", textWrap: "balance" }}>
              Want to see it on your operation?
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 26 }}>
              <Link to="/signup" className="mk-cta-lg" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 46, padding: "0 26px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#1a1206", background: "#e8973c", boxShadow: "0 8px 24px rgba(232,151,60,.28)", textDecoration: "none" }}>
                Start Free
              </Link>
              <Link to="/contact" className="mk-ghost-lg" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 46, padding: "0 26px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#e6eaf0", background: "transparent", border: "1px solid #333b49", textDecoration: "none" }}>
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
