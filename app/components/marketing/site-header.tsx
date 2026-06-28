import { Link } from "react-router";

export function MarketingLogo({ size = 19 }: { size?: number }) {
  const box = Math.round((size / 19) * 34);
  return (
    <span
      style={{
        width: box,
        height: box,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#E8973C,#C9742A)",
        boxShadow: "0 4px 14px rgba(232,151,60,.3)",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l8 4v5c0 4.7-3.3 8-8 9.5C7.3 19 4 15.7 4 11V6l8-4z"
          stroke="#1a1206"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 11.5l2 2 4-4.5"
          stroke="#1a1206"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#compliance", label: "Compliance" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(14,17,22,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid #1f252e",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px clamp(18px,5vw,40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <MarketingLogo />
          <span>
            <span
              style={{
                display: "block",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: "#e6eaf0",
              }}
            >
              Firearm Studio
            </span>
            <span
              style={{
                display: "block",
                marginTop: 3,
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#5c6573",
              }}
            >
              Storage &amp; Compliance
            </span>
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(14px,2.2vw,28px)",
            flexWrap: "wrap",
          }}
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="mk-nav-link"
              style={{ fontSize: 13.5, fontWeight: 500, color: "#8a93a2" }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <Link
            to="/login"
            className="mk-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 34,
              padding: "0 14px",
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: 600,
              color: "#e6eaf0",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="mk-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 34,
              padding: "0 16px",
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: 600,
              color: "#1a1206",
              background: "#e8973c",
              boxShadow: "0 4px 14px rgba(232,151,60,.25)",
              textDecoration: "none",
            }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
