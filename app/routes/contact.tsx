import { useState } from "react";
import { z } from "zod";
import { Link } from "react-router";
import type { Route } from "./+types/contact";
import { SiteHeader } from "~/components/marketing/site-header";
import { SiteFooter } from "~/components/marketing/site-footer";
import { pageMeta } from "~/lib/utils/seo";
import { requiredEmailSchema, requiredTextSchema } from "~/lib/utils/validation";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Contact - Firearm Studio",
    description:
      "Questions about getting set up, migrating your registry, or how Firearm Studio handles SAPS requirements? Our team is here to help.",
    pathname: location.pathname,
  });
}

const GREEN = "#3fb68b";
const AMBER = "#e8973c";
const chip = (c: string) => `color-mix(in srgb, ${c} 14%, transparent)`;

const ic = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>',
  phone:
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"></path>',
} as const;

const methods = [
  { title: "Email us", detail: "For sales, support, and onboarding.", value: "support@firearmstudio.com", color: AMBER, svg: ic.mail },
  { title: "Call us", detail: "Mon–Fri, business hours (SAST).", value: "+27 21 000 0000", color: GREEN, svg: ic.phone },
];

const inputStyle: React.CSSProperties = {
  height: 42,
  padding: "0 13px",
  borderRadius: 10,
  border: "1px solid #333b49",
  background: "#0e1116",
  color: "#e6eaf0",
  fontSize: 14,
  fontFamily: "inherit",
};
const labelText: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#e6eaf0" };

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = z
      .object({
        fullName: requiredTextSchema("Full name"),
        email: requiredEmailSchema,
      })
      .safeParse({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
      });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      setSent(false);
      return;
    }

    setFieldErrors({});
    setSent(true);
  }

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
            height: 420,
            background: "radial-gradient(ellipse at center, rgba(232,151,60,0.12), rgba(232,151,60,0) 68%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", padding: "clamp(48px,7vw,80px) clamp(18px,5vw,40px) clamp(20px,3vw,28px)", textAlign: "center" }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8973c" }}>
            Contact
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: "clamp(32px,5vw,50px)", lineHeight: 1.06, fontWeight: 700, letterSpacing: "-0.025em", color: "#e6eaf0", textWrap: "balance" }}>
            Let's talk compliance
          </h1>
          <p style={{ margin: "18px auto 0", maxWidth: 540, fontSize: "clamp(15px,1.7vw,18px)", lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>
            Questions about getting set up, migrating your registry, or how Firearm Studio handles SAPS requirements? Our
            team is here to help.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(24px,3vw,32px) clamp(18px,5vw,40px) clamp(56px,8vw,96px)", display: "flex", flexWrap: "wrap", gap: "clamp(28px,4vw,48px)", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
          {methods.map((m) => (
            <div key={m.title} className="mk-method" style={{ border: "1px solid #262d38", borderRadius: 16, background: "#14181f", padding: 18, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", color: m.color, background: chip(m.color) }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: m.svg }} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "#e6eaf0" }}>{m.title}</span>
                <span style={{ display: "block", marginTop: 3, fontSize: 13, lineHeight: 1.5, color: "#8a93a2" }}>{m.detail}</span>
                <span style={{ display: "block", marginTop: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, fontWeight: 600, color: "#e8973c" }}>{m.value}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ flex: "1.4 1 380px", minWidth: 300 }}>
          <form noValidate onSubmit={onSubmit} style={{ border: "1px solid #262d38", borderRadius: 20, background: "#14181f", padding: "clamp(22px,3vw,32px)", boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "#e6eaf0" }}>Send us a message</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a93a2" }}>We typically reply within one business day.</p>

            {sent && (
              <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", padding: 16, borderRadius: 12, border: "1px solid color-mix(in srgb,#3fb68b 30%,transparent)", background: "color-mix(in srgb,#3fb68b 12%,transparent)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3fb68b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontSize: 14, color: "#e6eaf0" }}>
                  Thanks - your message is on its way. We'll be in touch shortly.
                </span>
              </div>
            )}

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={labelText}>Full name</span>
                <input
                  id="contact-full-name"
                  name="fullName"
                  className="mk-input"
                  type="text"
                  required
                  placeholder="Jane Mokoena"
                  style={inputStyle}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? "contact-name-error" : undefined}
                  onChange={() => {
                    setFieldErrors((previous) => {
                      if (!previous.fullName) return previous;
                      const next = { ...previous };
                      delete next.fullName;
                      return next;
                    });
                  }}
                />
                {fieldErrors.fullName && (
                  <span id="contact-name-error" style={{ fontSize: 12, color: "#ef6b73" }}>
                    {fieldErrors.fullName}
                  </span>
                )}
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={labelText}>Work email</span>
                <input
                  id="contact-email"
                  name="email"
                  className="mk-input"
                  type="email"
                  required
                  placeholder="you@company.co.za"
                  style={inputStyle}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors((previous) => {
                      if (!previous.email) return previous;
                      const next = { ...previous };
                      delete next.email;
                      return next;
                    });
                  }}
                  onBlur={() => {
                    const result = requiredEmailSchema.safeParse(email);
                    setFieldErrors((previous) => {
                      const next = { ...previous };
                      if (!result.success) {
                        next.email = result.error.issues[0]?.message;
                      } else delete next.email;
                      return next;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                />
                {fieldErrors.email && (
                  <span id="contact-email-error" style={{ fontSize: 12, color: "#ef6b73" }}>
                    {fieldErrors.email}
                  </span>
                )}
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
              <span style={labelText}>Company</span>
              <input className="mk-input" type="text" placeholder="Your storage facility" style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
              <span style={labelText}>How can we help?</span>
              <textarea
                className="mk-input"
                rows={4}
                placeholder="Tell us a little about your operation and what you're looking for…"
                style={{ ...inputStyle, height: "auto", padding: "12px 13px", resize: "vertical" }}
              />
            </label>
            <button
              className="mk-cta-lg"
              type="submit"
              style={{
                marginTop: 20,
                width: "100%",
                height: 46,
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                color: "#1a1206",
                background: "#e8973c",
                boxShadow: "0 8px 24px rgba(232,151,60,.25)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Send message
            </button>
            <p style={{ margin: "14px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "#5c6573", textAlign: "center" }}>
              By submitting, you agree to our{" "}
              <Link to="/privacy" style={{ color: "#8a93a2" }}>
                Privacy Policy
              </Link>
              . Your details are handled in line with POPIA.
            </p>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
