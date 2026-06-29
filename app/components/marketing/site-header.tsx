import { Link } from "react-router";

export function MarketingLogo({ size = 19 }: { size?: number }) {
  const box = Math.round((size / 19) * 34);
  return (
    <img
      src="/icon-192.png"
      alt="Firearm Studio"
      width={box}
      height={box}
      style={{
        width: box,
        height: box,
        borderRadius: Math.round(box * 0.26),
        boxShadow: "0 4px 14px rgba(0,0,0,.3)",
        flexShrink: 0,
        display: "block",
      }}
    />
  );
}

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#compliance", label: "Compliance" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
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
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              prefetch="viewport"
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
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                prefetch="viewport"
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
                prefetch="viewport"
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
