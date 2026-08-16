import { Link } from "react-router";
import type { Route } from "./+types/about";
import { pageMeta } from "~/lib/utils/seo";
import { Button } from "~/components/ui/button";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "About - Firearm Studio",
    description:
      "Firearm Studio is built by storage operators, for storage operators - taking the friction out of compliant firearm storage in South Africa.",
    pathname: location.pathname,
  });
}

const BLUE = "var(--status-blue)";
const GREEN = "var(--status-green)";
const AMBER = "var(--primary)";
const PURPLE = "var(--status-purple)";
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
  color: "var(--primary)",
};

export default function About() {
  return (
    <div style={{ background: "var(--background)", overflow: "hidden" }}>
      <section style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -160,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(800px,120vw)",
            height: 440,
            background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 13%, transparent), transparent 68%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,40px) clamp(24px,3vw,32px)", textAlign: "center" }}>
          <div style={eyebrow}>About us</div>
          <h1 style={{ margin: "14px 0 0", fontSize: "clamp(32px,5vw,52px)", lineHeight: 1.06, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--foreground)", textWrap: "balance" }}>
            Built by storage operators, for storage operators
          </h1>
          <p style={{ margin: "20px auto 0", maxWidth: 600, fontSize: "clamp(15px,1.7vw,18px)", lineHeight: 1.6, color: "var(--muted-foreground)", textWrap: "pretty" }}>
            Firearm Studio exists to take the friction out of compliant firearm storage - so South African operators can
            spend less time on paperwork and more time running a safe, accountable business.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(18px,5vw,40px)", display: "flex", flexWrap: "wrap", gap: "clamp(32px,5vw,56px)", alignItems: "center" }}>
        <div style={{ flex: "1 1 380px", minWidth: 300 }}>
          <div style={eyebrow}>Our story</div>
          <h2 style={{ margin: "14px 0 0", fontSize: "clamp(24px,3.4vw,34px)", lineHeight: 1.12, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", textWrap: "balance" }}>
            We were drowning in spreadsheets, too
          </h2>
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.65, color: "var(--muted-foreground)", textWrap: "pretty" }}>
            Firearm Studio began inside a working storage facility. Tracking custody, licence expiry dates, and monthly
            invoicing across spreadsheets and paper files was slow, error-prone, and a real risk at inspection time.
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.65, color: "var(--muted-foreground)", textWrap: "pretty" }}>
            So we built the system we wished we had: one secure place for the registry, storage records, licences, and
            billing - structured around the Firearms Control Act and ready for SAPS at any moment. Today it manages
            thousands of firearms for operators across the country.
          </p>
        </div>
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--card)", padding: "clamp(24px,3vw,32px)", boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <p style={{ margin: "18px 0 0", fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.5, fontWeight: 600, color: "var(--foreground)", textWrap: "pretty" }}>
              "Compliance shouldn't be the hardest part of running a storage business. It should be the part you never
              have to worry about."
            </p>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 999, background: "var(--raised)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>JM</span>
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>J. Mokoena</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--dim)" }}>Founder &amp; storage operator</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--deep)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,40px)" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={eyebrow}>What we stand for</div>
            <h2 style={{ margin: "14px 0 0", fontSize: "clamp(26px,3.6vw,38px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", textWrap: "balance" }}>
              Values that hold up at inspection
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: "clamp(28px,4vw,44px)" }}>
            {values.map((v) => (
              <div key={v.title} style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--card)", padding: 24 }}>
                <span style={{ display: "inline-flex", width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", color: v.color, background: chip(v.color) }}>
                  <Glyph d={v.svg} />
                </span>
                <h3 style={{ margin: "16px 0 0", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>{v.title}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--muted-foreground)", textWrap: "pretty" }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(40px,5vw,64px) clamp(18px,5vw,40px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 24, textAlign: "center" }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--primary)" }}>{m.value}</div>
              <div style={{ marginTop: 5, fontSize: 13, color: "var(--muted-foreground)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(18px,5vw,40px) clamp(56px,8vw,96px)" }}>
        <div style={{ position: "relative", border: "1px solid var(--border2)", borderRadius: 24, background: "linear-gradient(135deg,var(--secondary),var(--card))", padding: "clamp(36px,6vw,56px) clamp(24px,5vw,48px)", textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 560, height: 340, background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ margin: 0, fontSize: "clamp(24px,3.6vw,38px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", textWrap: "balance" }}>
              Want to see it on your operation?
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 26 }}>
              <Button asChild className="h-[46px] rounded-[12px] px-[26px] text-[15px]" style={{ boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 28%, transparent)" }}>
                <Link to="/signup">Start Free</Link>
              </Button>
              <Button asChild variant="outline" className="h-[46px] rounded-[12px] px-[26px] text-[15px]">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
