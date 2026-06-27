import { useNavigate, useLocation, Link } from "react-router";
import { Icon, type IconName } from "~/components/common/icon";
import { BrandLockup } from "~/components/common/brand";
import { signOut } from "~/lib/auth";
import { canSeeNav, primaryRole, type NavKey, type SessionUser } from "~/lib/rbac";
import { initials } from "~/lib/format";
import { cn } from "~/lib/utils";

interface NavItem {
  key: NavKey;
  label: string;
  icon: IconName;
  to: string;
}
interface NavGroup {
  head: string | null;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    head: null,
    items: [{ key: "dashboard", label: "Dashboard", icon: "grid", to: "/dashboard" }],
  },
  {
    head: "Registry",
    items: [
      { key: "customers", label: "Customers", icon: "users", to: "/customers" },
      { key: "firearms", label: "Firearms", icon: "target", to: "/firearms" },
      { key: "storage", label: "Storage", icon: "box", to: "/storage" },
      { key: "licences", label: "Licences", icon: "shield", to: "/licences" },
    ],
  },
  {
    head: "Billing",
    items: [{ key: "invoices", label: "Invoices", icon: "file", to: "/invoices" }],
  },
  {
    head: "Administration",
    items: [
      { key: "team", label: "Team", icon: "team", to: "/team" },
      { key: "audit", label: "Audit log", icon: "list", to: "/audit" },
      { key: "settings", label: "Settings", icon: "gear", to: "/settings" },
    ],
  },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(to + "/");

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-[18px] pb-[18px] pt-5">
        <BrandLockup />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
        {GROUPS.map((g, gi) => {
          const items = g.items.filter((it) => canSeeNav(user, it.key));
          if (!items.length) return null;
          return (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {g.head && (
                <div className="px-3 pb-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.13em] text-dim">
                  {g.head}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((it) => {
                  const on = isActive(it.to);
                  return (
                    <Link
                      key={it.key}
                      to={it.to}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13.5px] transition-colors",
                        on
                          ? "border-border2 bg-secondary font-semibold text-foreground"
                          : "border-transparent font-medium text-muted-foreground hover:bg-card hover:text-foreground",
                      )}
                    >
                      {on && (
                        <span className="absolute -left-px bottom-2.5 top-2.5 w-[3px] rounded-sm bg-primary" />
                      )}
                      <span className={on ? "text-primary" : ""}>
                        <Icon name={it.icon} size={18} />
                      </span>
                      <span className="flex-1">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-[9px] border border-border bg-secondary px-2.5 py-2.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-raised text-xs font-bold text-foreground">
            {initials(user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-foreground">
              {user.email ?? "Signed in"}
            </div>
            <div className="truncate text-[11px] text-dim">
              {primaryRole(user)}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="flex text-dim transition-colors hover:text-foreground"
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
