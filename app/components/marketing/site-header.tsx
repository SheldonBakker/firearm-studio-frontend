import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/context/auth-context";
import { Icon } from "~/components/common/icon";
import { LogoutDialog } from "~/components/modals/logout-dialog";
import { Button } from "~/components/ui/button";
import { BrandMark } from "~/components/common/brand";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#bookings", label: "Bookings" },
  { href: "/#integrations", label: "Integrations" },
  { href: "/#compliance", label: "Compliance" },
  { href: "/#how", label: "How it works" },
];

function AuthActions({
  compact,
  onClose,
  onLogout,
}: {
  compact: boolean;
  onClose?: () => void;
  onLogout: () => void;
}) {
  const { status, isLoggedIn } = useAuth();

  if (status === "loading") {
    return compact ? null : <div aria-hidden style={{ width: 220, height: 34 }} />;
  }

  if (isLoggedIn) {
    if (compact) {
      return (
        <>
          <Button asChild className="h-[42px] w-full rounded-[9px] text-[14.5px]" onClick={onClose}>
            <Link to="/dashboard" prefetch="viewport">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="h-[42px] w-full rounded-[9px] text-[14.5px]" onClick={onClose}>
            <Link to="/licences">
              <Icon name="bell" size={16} />
              Alerts
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-[42px] w-full rounded-[9px] text-[14.5px]"
            onClick={() => { onClose?.(); onLogout(); }}
          >
            <Icon name="logout" size={15} />
            Log out
          </Button>
        </>
      );
    }
    return (
      <>
        <Link
          to="/licences"
          aria-label="Alerts"
          title="Alerts"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 34,
            width: 34,
            borderRadius: 9,
            color: "var(--foreground)",
            background: "var(--secondary)",
            border: "1px solid var(--border2)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Icon name="bell" size={16} />
          <span
            style={{
              position: "absolute",
              right: 8,
              top: 7,
              height: 7,
              width: 7,
              borderRadius: 9999,
              background: "var(--status-red)",
              border: "2px solid var(--secondary)",
            }}
          />
        </Link>
        <Button asChild className="h-[34px] rounded-[9px] px-4 text-[13.5px]" style={{ boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent)" }}>
          <Link to="/dashboard" prefetch="viewport">Go to Dashboard</Link>
        </Button>
        <Button
          variant="outline"
          className="h-[34px] rounded-[9px] px-3.5 text-[13.5px] gap-[7px]"
          onClick={onLogout}
        >
          <Icon name="logout" size={15} />
          Log out
        </Button>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <Button asChild variant="outline" className="h-[42px] w-full rounded-[9px] text-[14.5px]" onClick={onClose}>
          <Link to="/login" prefetch="viewport">Sign in</Link>
        </Button>
        <Button asChild className="h-[42px] w-full rounded-[9px] text-[14.5px]" onClick={onClose}>
          <Link to="/signup" prefetch="viewport">Get started</Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild variant="ghost" className="h-[34px] rounded-[9px] px-3.5 text-[13.5px]">
        <Link to="/login" prefetch="viewport">Sign in</Link>
      </Button>
      <Button asChild className="h-[34px] rounded-[9px] px-4 text-[13.5px]" style={{ boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent)" }}>
        <Link to="/signup" prefetch="viewport">Get started</Link>
      </Button>
    </>
  );
}

export function SiteHeader() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "color-mix(in srgb, var(--background) 82%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          padding: "14px clamp(18px,3vw,28px)",
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
          <BrandMark size={34} />
          <span>
            <span
              style={{
                display: "block",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: "var(--foreground)",
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
                color: "var(--dim)",
              }}
            >
              Storage &amp; Compliance
            </span>
          </span>
        </Link>

        <nav
          className="flex items-center flex-wrap max-[860px]:hidden"
          style={{ gap: "clamp(14px,2.2vw,28px)" }}
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              to={n.href}
              className="transition-colors duration-150 hover:text-foreground"
              style={{ fontSize: 13.5, fontWeight: 500, color: "var(--muted-foreground)", textDecoration: "none" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div
          className="flex items-center flex-shrink-0 max-[860px]:hidden"
          style={{ gap: 10 }}
        >
          <AuthActions compact={false} onLogout={() => setConfirmOpen(true)} />
        </div>

        <button
          type="button"
          className="hidden max-[860px]:inline-flex items-center justify-center transition-[background,border-color] duration-150 hover:bg-raised"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            height: 38,
            width: 38,
            borderRadius: 9,
            color: "var(--foreground)",
            background: "var(--secondary)",
            border: "1px solid var(--border2)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Icon
            name={menuOpen ? "plus" : "list"}
            size={18}
            style={menuOpen ? { transform: "rotate(45deg)" } : undefined}
          />
        </button>
      </div>

      <div
        className={menuOpen ? "block" : "hidden"}
        style={{
          background: "var(--background)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "6px clamp(18px,3vw,28px) 4px",
          }}
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              to={n.href}
              className="transition-colors duration-150 hover:text-foreground"
              onClick={closeMenu}
              style={{
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--muted-foreground)",
                borderBottom: "1px solid var(--line)",
                textDecoration: "none",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "14px clamp(18px,3vw,28px) 20px",
          }}
        >
          <AuthActions compact={true} onClose={closeMenu} onLogout={() => setConfirmOpen(true)} />
        </div>
      </div>

      <LogoutDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </header>
  );
}
