import { Link } from "react-router";
import type { Route } from "./+types/home";
import { SiteHeader, MarketingLogo } from "~/components/marketing/site-header";
import { SiteFooter } from "~/components/marketing/site-footer";
import { organizationLd, pageMeta, websiteLd } from "~/lib/utils/seo";
import { useAuth } from "~/context/auth-context";

export function meta({ location }: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Firearm Studio - Storage & compliance for SA firearm providers",
      description:
        "Firearm Studio keeps your registry, storage records, licences, and invoicing in one secure, audit-ready system - purpose-built for South African firearm storage providers.",
      pathname: location.pathname,
    }),
    { "script:ld+json": organizationLd() },
    { "script:ld+json": websiteLd() },
  ];
}

const BLUE = "#4c8df0";
const GREEN = "#3fb68b";
const RED = "#e5484d";
const AMBER = "#e8973c";
const PURPLE = "#9a7cf0";

const chip = (c: string, pct = 14) =>
  `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const statusPill = (c: string) => ({
  color: c,
  bg: chip(c, 12),
  bd: chip(c, 28),
});

const ic = {
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"></path><path d="M3 8v8l9 5 9-5V8"></path><path d="M12 13v8"></path>',
  money:
    '<path d="M2 7h20v10H2z"></path><circle cx="12" cy="12" r="3"></circle><path d="M6 7v10"></path><path d="M18 7v10"></path>',
  alert:
    '<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>',
  shield:
    '<path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z"></path><path d="M9 12l2 2 4-4"></path>',
  list: '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
  users:
    '<path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path><path d="M2 21a8 8 0 0 1 16 0"></path>',
  send: '<path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path>',
} as const;

function Glyph({ d, size = 24, sw = 1.7 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

type Stat = { label: string; value: string; sub: string; color: string; svg: string };
type Invoice = {
  num: string;
  name: string;
  total: string;
  status: string;
  color: string;
  bg: string;
  bd: string;
};

const heroStats: Stat[] = [
  { label: "In storage", value: "1,284", sub: "1,510 on registry", color: BLUE, svg: ic.box },
  { label: "Monthly", value: "R96.4k", sub: "1,284 records", color: GREEN, svg: ic.money },
  { label: "Outstanding", value: "R12.8k", sub: "3 overdue", color: RED, svg: ic.alert },
  { label: "Licences", value: "7", sub: "5 due · 2 expired", color: AMBER, svg: ic.shield },
];

const heroInvoices: Invoice[] = [
  { num: "INV-2041", name: "Karoo Hunting Co.", total: "R3,450", status: "Paid", ...statusPill(GREEN) },
  { num: "INV-2040", name: "M. van der Merwe", total: "R890", status: "Overdue", ...statusPill(RED) },
  { num: "INV-2039", name: "Sentinel Security", total: "R7,200", status: "Sent", ...statusPill(BLUE) },
];

const metrics = [
  { value: "12k+", label: "Firearms under management" },
  { value: "99.9%", label: "Audit accuracy" },
  { value: "<5min", label: "To log a new firearm" },
  { value: "100%", label: "SAPS-ready records" },
];

const features = [
  { title: "Storage registry", body: "Track every firearm in your custody - make, model, serial, calibre, and exact storage location - on one searchable registry.", color: BLUE, svg: ic.box },
  { title: "Licence tracking", body: "Automatic expiry alerts and renewal tracking so nothing lapses. Stay ahead of every SAPS deadline.", color: AMBER, svg: ic.shield },
  { title: "Invoicing", body: "Monthly storage invoices are generated automatically, so you can track outstanding balances and flag overdue accounts.", color: GREEN, svg: ic.money },
  { title: "Audit trail", body: "Every action logged with who, what, and when - a complete, tamper-evident history for inspections.", color: PURPLE, svg: ic.list },
];

const stats: Stat[] = [
  { label: "Firearms in storage", value: "1,284", sub: "1,510 total on registry", color: BLUE, svg: ic.box },
  { label: "Monthly recurring", value: "R96.4k", sub: "across 1,284 records", color: GREEN, svg: ic.money },
  { label: "Outstanding", value: "R12.8k", sub: "3 overdue · follow up", color: RED, svg: ic.alert },
  { label: "Licence alerts", value: "7", sub: "5 due · 2 expired", color: AMBER, svg: ic.shield },
];

const invoices: Invoice[] = [
  { num: "INV-2041", name: "Karoo Hunting Co.", total: "R3,450", status: "Paid", ...statusPill(GREEN) },
  { num: "INV-2040", name: "M. van der Merwe", total: "R890", status: "Overdue", ...statusPill(RED) },
  { num: "INV-2039", name: "Sentinel Security", total: "R7,200", status: "Sent", ...statusPill(BLUE) },
  { num: "INV-2038", name: "Highveld Range", total: "R2,100", status: "Paid", ...statusPill(GREEN) },
];

const attention = [
  { color: RED, title: "Licence expired", detail: "LIC-88213 · J. Dlamini", tag: "Expired" },
  { color: RED, title: "Invoice overdue", detail: "INV-2040 · M. van der Merwe", tag: "R890" },
  { color: AMBER, title: "Renewal due soon", detail: "LIC-90471 · expires 14 Jul", tag: "Renew" },
  { color: AMBER, title: "Renewal due soon", detail: "LIC-90460 · expires 22 Jul", tag: "Renew" },
];

const trust = [
  { title: "Firearms Control Act aligned", body: "Record structure mirrors what SAPS expects - serial, calibre, licence linkage, and custody chain." },
  { title: "Tamper-evident audit log", body: "Every create, edit, and deletion is recorded with the user, timestamp, and affected record." },
  { title: "Role-based access control", body: "Admin, Manager, Staff, and Viewer roles keep sensitive actions in the right hands." },
  { title: "POPIA-compliant & encrypted", body: "Customer and firearm data is encrypted in transit and at rest, hosted in-region." },
];

const audit = [
  { who: "J. Mokoena", action: "registered firearm", target: "SN: AX449201 · 9mm", time: "2m", color: GREEN },
  { who: "T. Botha", action: "issued invoice", target: "INV-2041 · R3,450", time: "18m", color: BLUE },
  { who: "System", action: "flagged licence renewal", target: "LIC-90471", time: "1h", color: AMBER },
  { who: "J. Mokoena", action: "updated storage record", target: "Bay C-12", time: "3h", color: PURPLE },
  { who: "A. Naidoo", action: "marked invoice paid", target: "INV-2038 · R2,100", time: "5h", color: GREEN },
];

const steps = [
  { n: "1", title: "Register your facility", body: "Add your company and invite your team with role-based access in minutes.", svg: ic.users },
  { n: "2", title: "Log firearms & storage", body: "Capture each firearm and assign its storage bay on the registry.", svg: ic.box },
  { n: "3", title: "Stay compliant", body: "Track licences, get automatic renewal alerts, and keep a full audit trail.", svg: ic.shield },
  { n: "4", title: "Invoice & get paid", body: "Bill clients monthly and monitor outstanding balances at a glance.", svg: ic.send },
];

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#e8973c",
};
const h2: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: "clamp(28px,4vw,40px)",
  lineHeight: 1.1,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "#e6eaf0",
  textWrap: "balance",
};
const lede: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "clamp(15px,1.6vw,17px)",
  lineHeight: 1.6,
  color: "#8a93a2",
  textWrap: "pretty",
};
const arrow = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a1206" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

function StatusPill({ inv, big = false }: { inv: Invoice; big?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: big ? 6 : 5,
        padding: big ? "2px 10px" : "2px 9px",
        borderRadius: 999,
        fontSize: big ? 11 : 10,
        fontWeight: 600,
        color: inv.color,
        background: inv.bg,
        border: `1px solid ${inv.bd}`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: inv.color }} />
      {inv.status}
    </span>
  );
}

export default function Home() {
  const { isLoggedIn } = useAuth();
  return (
    <div style={{ minHeight: "100vh", background: "#0e1116", overflow: "hidden" }}>
      <SiteHeader />

      <section id="top" style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -180,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(900px,120vw)",
            height: 520,
            background:
              "radial-gradient(ellipse at center, rgba(232,151,60,0.16), rgba(232,151,60,0) 68%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 1200,
            margin: "0 auto",
            padding:
              "clamp(48px,7vw,88px) clamp(18px,5vw,40px) clamp(36px,5vw,56px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(36px,5vw,64px)",
            alignItems: "center",
          }}
        >
          <div className="mk-fade-up" style={{ flex: "1 1 420px", minWidth: 300 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #333b49",
                background: "#14181f",
                marginBottom: 22,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3fb68b", boxShadow: "0 0 8px #3fb68b" }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "#8a93a2" }}>
                SAPS-aligned compliance, built in
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(34px,5.4vw,56px)",
                lineHeight: 1.04,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#e6eaf0",
                textWrap: "balance",
              }}
            >
              Run a compliant firearm storage business - without the paperwork.
            </h1>
            <p style={{ ...lede, maxWidth: 540, fontSize: "clamp(15px,1.7vw,18px)", margin: "22px 0 0" }}>
              Firearm Studio keeps your registry, storage records, licences, and
              invoicing in one secure, audit-ready system - purpose-built for
              South African storage providers.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  prefetch="viewport"
                  className="mk-cta-lg"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: 46,
                    padding: "0 24px",
                    borderRadius: 11,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1a1206",
                    background: "#e8973c",
                    boxShadow: "0 8px 24px rgba(232,151,60,.28)",
                    textDecoration: "none",
                  }}
                >
                  Go to Dashboard
                  {arrow}
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    prefetch="viewport"
                    className="mk-cta-lg"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 46,
                      padding: "0 24px",
                      borderRadius: 11,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1a1206",
                      background: "#e8973c",
                      boxShadow: "0 8px 24px rgba(232,151,60,.28)",
                      textDecoration: "none",
                    }}
                  >
                    Start Free
                    {arrow}
                  </Link>
                  <Link
                    to="/login"
                    prefetch="viewport"
                    className="mk-ghost-lg"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 46,
                      padding: "0 24px",
                      borderRadius: 11,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#e6eaf0",
                      background: "#1a1f28",
                      border: "1px solid #333b49",
                      textDecoration: "none",
                    }}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px", marginTop: 30 }}>
              <span style={{ fontSize: 12.5, color: "#5c6573" }}>
                Trusted by dealers, gunsmiths &amp; secure facilities
              </span>
              <span style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {["Set up in minutes", "Fully SAPS-aligned"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#8a93a2" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb68b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="mk-fade-up-delayed" style={{ flex: "1 1 440px", minWidth: 300 }}>
            <div style={{ border: "1px solid #262d38", borderRadius: 16, background: "#14181f", boxShadow: "0 30px 80px rgba(0,0,0,.55)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: "1px solid #1f252e", background: "#11151b" }}>
                <span style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 10, height: 10, borderRadius: 999, background: "#333b49" }} />
                  ))}
                </span>
                <span style={{ marginLeft: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#5c6573" }}>
                  app.firearmstudio.com/dashboard
                </span>
              </div>
              <div style={{ padding: "clamp(14px,2vw,20px)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e6eaf0" }}>Good morning</div>
                <div style={{ marginTop: 2, fontSize: 11.5, color: "#8a93a2" }}>Friday, 27 June 2025</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 14 }}>
                  {heroStats.map((s) => (
                    <div key={s.label} style={{ border: "1px solid #262d38", borderRadius: 14, background: "#0e1116", padding: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#8a93a2" }}>{s.label}</span>
                        <span style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, background: chip(s.color) }}>
                          <Glyph d={s.svg} size={14} sw={1.8} />
                        </span>
                      </div>
                      <div style={{ marginTop: 9, fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#e6eaf0" }}>{s.value}</div>
                      <div style={{ marginTop: 3, fontSize: 10, color: "#5c6573" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, border: "1px solid #262d38", borderRadius: 14, background: "#0e1116", overflow: "hidden" }}>
                  <div style={{ padding: "11px 14px", borderBottom: "1px solid #1f252e", fontSize: 11.5, fontWeight: 700, color: "#e6eaf0" }}>Recent invoices</div>
                  {heroInvoices.map((r) => (
                    <div key={r.num} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1f252e" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 600, color: "#e6eaf0" }}>{r.num}</span>
                        <span style={{ display: "block", fontSize: 10, color: "#5c6573" }}>{r.name}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 600, color: "#e6eaf0" }}>{r.total}</span>
                        <StatusPill inv={r} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid #1f252e", borderBottom: "1px solid #1f252e", background: "#0b0e12" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(24px,4vw,36px) clamp(18px,5vw,40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 24, textAlign: "center" }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(26px,3.4vw,34px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#e8973c" }}>{m.value}</div>
              <div style={{ marginTop: 5, fontSize: 13, color: "#8a93a2" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(18px,5vw,40px)" }}>
        <div style={{ maxWidth: 640 }}>
          <div style={eyebrow}>Everything in one place</div>
          <h2 style={h2}>The complete system for firearm storage operations</h2>
          <p style={{ ...lede, fontSize: "clamp(15px,1.6vw,17px)" }}>
            Stop juggling spreadsheets, paper files, and renewal reminders.
            Firearm Studio brings your entire operation into one secure,
            role-based platform.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: "clamp(32px,4vw,48px)" }}>
          {features.map((f) => (
            <div key={f.title} className="mk-card" style={{ border: "1px solid #262d38", borderRadius: 18, background: "#14181f", padding: 24 }}>
              <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", color: f.color, background: chip(f.color) }}>
                <Glyph d={f.svg} size={22} />
              </span>
              <h3 style={{ margin: "18px 0 0", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#e6eaf0" }}>{f.title}</h3>
              <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#0b0e12", borderTop: "1px solid #1f252e", borderBottom: "1px solid #1f252e" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(18px,5vw,40px)" }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
            <div style={eyebrow}>The dashboard</div>
            <h2 style={h2}>Your whole operation, at a glance</h2>
            <p style={{ ...lede, fontSize: "clamp(15px,1.6vw,17px)" }}>
              Outstanding balances, licence alerts, and what needs attention - surfaced the moment you sign in.
            </p>
          </div>

          <div style={{ marginTop: "clamp(32px,4vw,48px)", border: "1px solid #262d38", borderRadius: 18, background: "#14181f", boxShadow: "0 30px 90px rgba(0,0,0,.5)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 18px", borderBottom: "1px solid #1f252e", background: "#11151b", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <MarketingLogo size={15} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e6eaf0" }}>Dashboard</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid #262d38", background: "#0e1116", fontSize: 12, color: "#5c6573" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5c6573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  Search registry…
                </span>
                <span style={{ width: 30, height: 30, borderRadius: 999, background: "#222834", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, color: "#e8973c" }}>JM</span>
              </span>
            </div>

            <div style={{ padding: "clamp(16px,2.6vw,28px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ border: "1px solid #262d38", borderRadius: 16, background: "#0e1116", padding: 17 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8a93a2" }}>{s.label}</span>
                      <span style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, background: chip(s.color) }}>
                        <Glyph d={s.svg} size={16} />
                      </span>
                    </div>
                    <div style={{ marginTop: 13, fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(22px,2.4vw,27px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#e6eaf0" }}>{s.value}</div>
                    <div style={{ marginTop: 5, fontSize: 11.5, color: "#5c6573" }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 18 }}>
                <div style={{ border: "1px solid #262d38", borderRadius: 16, background: "#0e1116", overflow: "hidden" }}>
                  <div style={{ padding: "13px 16px", borderBottom: "1px solid #1f252e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e6eaf0" }}>Recent invoices</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#5c6573" }}>View all →</span>
                  </div>
                  {invoices.map((r) => (
                    <div key={r.num} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1f252e" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, fontWeight: 600, color: "#e6eaf0" }}>{r.num}</span>
                        <span style={{ display: "block", marginTop: 1, fontSize: 11, color: "#5c6573" }}>{r.name}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, fontWeight: 600, color: "#e6eaf0" }}>{r.total}</span>
                        <StatusPill inv={r} big />
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ border: "1px solid #262d38", borderRadius: 16, background: "#0e1116", overflow: "hidden" }}>
                  <div style={{ padding: "13px 16px", borderBottom: "1px solid #1f252e", fontSize: 13, fontWeight: 700, color: "#e6eaf0" }}>Needs attention</div>
                  {attention.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1f252e" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: a.color, boxShadow: `0 0 7px ${a.color}` }} />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#e6eaf0" }}>{a.title}</span>
                        <span style={{ display: "block", marginTop: 1, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#8a93a2" }}>{a.detail}</span>
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, flexShrink: 0, color: a.color }}>{a.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="compliance" style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(18px,5vw,40px)", display: "flex", flexWrap: "wrap", gap: "clamp(36px,5vw,64px)", alignItems: "center" }}>
        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
          <div style={eyebrow}>Compliance &amp; security</div>
          <h2 style={h2}>Audit-ready, every single day</h2>
          <p style={{ ...lede, fontSize: "clamp(15px,1.6vw,17px)" }}>
            Built around the realities of the Firearms Control Act. Every
            record, every change, every renewal - logged and ready for
            inspection.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
            {trust.map((t) => (
              <div key={t.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#3fb68b", background: "rgba(63,182,139,.13)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#e6eaf0" }}>{t.title}</span>
                  <span style={{ display: "block", marginTop: 3, fontSize: 13.5, lineHeight: 1.55, color: "#8a93a2" }}>{t.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 340px", minWidth: 300 }}>
          <div style={{ border: "1px solid #262d38", borderRadius: 18, background: "#14181f", overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.45)" }}>
            <div style={{ padding: 18, borderBottom: "1px solid #1f252e", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#11151b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8973c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
                  <path d="M14 3v5h5" />
                  <path d="M9 13h6" />
                  <path d="M9 17h4" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e6eaf0" }}>Audit trail</span>
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: "#5c6573" }}>LAST 24H</span>
            </div>
            {audit.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "13px 18px", borderBottom: "1px solid #1f252e" }}>
                <span style={{ flexShrink: 0, width: 7, height: 7, marginTop: 5, borderRadius: 999, background: e.color }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 12.5, color: "#e6eaf0" }}>
                    <b style={{ fontWeight: 600 }}>{e.who}</b> {e.action}
                  </span>
                  <span style={{ display: "block", marginTop: 2, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: "#5c6573" }}>{e.target}</span>
                </span>
                <span style={{ flexShrink: 0, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: "#5c6573" }}>{e.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" style={{ background: "#0b0e12", borderTop: "1px solid #1f252e", borderBottom: "1px solid #1f252e" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(18px,5vw,40px)" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>How it works</div>
            <h2 style={h2}>Live in an afternoon, compliant for good</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18, marginTop: "clamp(32px,4vw,48px)" }}>
            {steps.map((st) => (
              <div key={st.n} style={{ border: "1px solid #262d38", borderRadius: 18, background: "#14181f", padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: "#1a1206", background: "#e8973c", width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{st.n}</span>
                  <span style={{ color: "#222834" }}>
                    <Glyph d={st.svg} size={22} />
                  </span>
                </div>
                <h3 style={{ margin: "18px 0 0", fontSize: 16, fontWeight: 700, color: "#e6eaf0" }}>{st.title}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(18px,5vw,40px)" }}>
        <div style={{ position: "relative", border: "1px solid #333b49", borderRadius: 24, background: "linear-gradient(135deg,#1a1f28,#14181f)", padding: "clamp(36px,6vw,64px) clamp(24px,5vw,56px)", textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 600, height: 360, background: "radial-gradient(ellipse at center, rgba(232,151,60,0.18), rgba(232,151,60,0) 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ margin: 0, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.025em", color: "#e6eaf0", textWrap: "balance" }}>
              Ready to bring order to your storage operation?
            </h2>
            <p style={{ margin: "16px auto 0", maxWidth: 520, fontSize: "clamp(15px,1.7vw,18px)", lineHeight: 1.6, color: "#8a93a2", textWrap: "pretty" }}>
              Start your free trial today - be compliant and invoicing before
              the day is out.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 30 }}>
              {isLoggedIn ? (
                <Link to="/dashboard" prefetch="viewport" className="mk-cta-lg" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 28px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#1a1206", background: "#e8973c", boxShadow: "0 8px 24px rgba(232,151,60,.3)", textDecoration: "none" }}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/signup" prefetch="viewport" className="mk-cta-lg" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 28px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#1a1206", background: "#e8973c", boxShadow: "0 8px 24px rgba(232,151,60,.3)", textDecoration: "none" }}>
                    Start Free
                  </Link>
                  <Link to="/login" prefetch="viewport" className="mk-ghost-lg" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, padding: "0 28px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#e6eaf0", background: "transparent", border: "1px solid #333b49", textDecoration: "none" }}>
                    Talk to sales
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
