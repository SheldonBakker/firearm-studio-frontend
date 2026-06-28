import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("popia", "routes/popia.tsx"),
  route("fca-notice", "routes/fca-notice.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  layout("routes/app-layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("customers", "routes/customers.tsx"),
    route("customers/:id", "routes/customer-detail.tsx"),
    route("firearms", "routes/firearms.tsx"),
    route("firearms/:id", "routes/firearm-detail.tsx"),
    route("storage", "routes/storage.tsx"),
    route("licences", "routes/licences.tsx"),
    route("invoices", "routes/invoices.tsx"),
    route("invoices/:id", "routes/invoice-detail.tsx"),
    route("team", "routes/team.tsx"),
    route("audit", "routes/audit.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
