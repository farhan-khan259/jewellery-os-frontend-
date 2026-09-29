import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import {
  Gem,
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Users,
  Scale,
  Hammer,
  ClipboardList,
  Wrench,
  ScanLine,
  ChartNoAxesCombined,
  Wallet,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  Bell,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Provider, useApp } from "./context";
import { api, setBranch } from "./api";
import { Loading, Field, Button, ErrorState } from "./components";
import { Dashboard } from "./pages-dashboard";
import { RecordsPage, SalesPage, SaleDetail } from "./pages-records";
import { POS } from "./pages-pos";
import {
  ControlPage,
  RatesPage,
  ReportsPage,
  SettingsPage,
  TeamPage,
  ActivityPage,
  NotificationsPage,
} from "./pages-control";
import { Admin } from "./pages-admin";
import "./style.css";
export function Language() {
  const { lang, changeLang } = useApp();
  return (
    <select
      className="language"
      aria-label="Language / زبان"
      value={lang}
      onChange={(e) => changeLang(e.target.value)}
    >
      <option value="en">English</option>
      <option value="ur">اردو</option>
      <option value="roman">Roman English</option>
    </select>
  );
}
function Access({ admin = false }) {
  const { session, refresh, loading, t, notify } = useApp(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(false),
    [values, setValues] = useState({
      username: "",
      password: "",
      code: "",
      currentPassword: "",
    });
  const invite = new URLSearchParams(location.search).get("invite");
  if (loading) return <Loading />;
  const change = session?.user.firstLoginChangeRequired;
  if (session && !change && !invite)
    return (
      <Navigate
        to={session.user.type === "platformAdmin" ? "/admin/overview" : "/app"}
        replace
      />
    );
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (invite)
        await api("/access/accept-invitation", {
          method: "POST",
          body: { token: invite, password: values.password },
        });
      else if (change)
        await api("/access/change-password", {
          method: "POST",
          body: {
            currentPassword: values.currentPassword,
            password: values.password,
          },
        });
      else
        await api("/access/sign-in", {
          method: "POST",
          body: { ...values, portal: admin ? "admin" : "shop" },
        });
      await refresh();
      if (invite) navigate("/app", { replace: true });
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={"access " + (admin ? "admin-access" : "")}>
      <aside className="access-brand">
        <div className="brand">
          <Gem size={30} />
          <div>
            {admin ? "Ahmed Solutions" : "Jeweller OS"}
            <small>
              {admin ? "PLATFORM ADMINISTRATION" : "BY AHMED SOLUTIONS"}
            </small>
          </div>
        </div>
        <div className="access-message">
          <div className="eyebrow">
            {admin ? "PLATFORM CONTROL" : "YOUR SHOP, IN ORDER"}
          </div>
          <h1>
            {admin
              ? "A clear view of every shop."
              : t("Every gram, accounted for.")}
          </h1>
          <p>
            {admin
              ? "Provision shops. Manage access. Keep every account in control."
              : t("Gold in shop") +
                " · " +
                t("Sales & invoices") +
                " · " +
                t("Karigars")}
          </p>
        </div>
        <small>AHMED SOLUTIONS © {new Date().getFullYear()}</small>
      </aside>
      <main className="access-main">
        <div className="access-language">
          <Language />
        </div>
        <div className="access-form">
          <span className="access-icon">
            <ShieldCheck size={24} />
          </span>
          <h1>
            {change || invite
              ? t("Set your new password")
              : admin
                ? "Platform administrator"
                : t("Access your shop")}
          </h1>
          <p>
            {change || invite
              ? t("Use at least 12 characters.")
              : admin
                ? "Sign in with your administrator account."
                : t("Enter the credentials issued by Ahmed Solutions.")}
          </p>
          <form onSubmit={submit}>
            {!invite && !change && (
              <Field label="Username">
                <input
                  autoComplete="username"
                  value={values.username}
                  required
                  onChange={(e) =>
                    setValues({ ...values, username: e.target.value })
                  }
                />
              </Field>
            )}
            {change && (
              <Field label="Current password">
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={values.currentPassword}
                  onChange={(e) =>
                    setValues({ ...values, currentPassword: e.target.value })
                  }
                />
              </Field>
            )}
            <Field label={change || invite ? "New password" : "Password"}>
              <input
                type="password"
                autoComplete={
                  change || invite ? "new-password" : "current-password"
                }
                minLength={change || invite ? 12 : undefined}
                required
                value={values.password}
                onChange={(e) =>
                  setValues({ ...values, password: e.target.value })
                }
              />
            </Field>
            {!change && !invite && (
              <Field label="Verification code">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={values.code}
                  onChange={(e) =>
                    setValues({ ...values, code: e.target.value })
                  }
                  placeholder="2FA · optional"
                />
              </Field>
            )}
            <Button busy={busy}>
              {t(change || invite ? "Continue" : "Open dashboard")}
            </Button>
          </form>
          <small>{t("Need access? Contact Ahmed Solutions.")}</small>
        </div>
      </main>
    </div>
  );
}
const nav = [
  [
    "Overview",
    [
      ["", "Dashboard", LayoutDashboard],
      ["pos", "New sale", ShoppingBag],
      ["rates", "Metal rates", Scale],
    ],
  ],
  [
    "Operations",
    [
      ["sales", "Sales & invoices", ClipboardList],
      ["inventory", "Inventory", Boxes],
      ["customers", "Customers", Users],
      ["old-gold", "Old gold", Scale],
      ["karigars", "Karigars", Hammer],
      ["orders", "Custom orders", Gem],
      ["repairs", "Repairs", Wrench],
    ],
  ],
  [
    "Control",
    [
      ["audits", "Stock audit", ScanLine],
      ["reconciliation", "Reconciliation", Scale],
      ["expenses", "Expenses", Wallet],
      ["reports", "Reports", ChartNoAxesCombined],
    ],
  ],
  [
    "Administration",
    [
      ["team", "Team", Users],
      ["activity", "Activity log", ShieldCheck],
      ["settings", "Settings", Settings],
    ],
  ],
];
const allowed = {
  owner: ["*"],
  manager: [
    "",
    "pos",
    "sales",
    "inventory",
    "customers",
    "old-gold",
    "karigars",
    "orders",
    "repairs",
    "audits",
    "reconciliation",
    "reports",
  ],
  cashier: ["", "pos", "sales", "inventory", "customers", "orders", "repairs"],
  accountant: [
    "",
    "sales",
    "customers",
    "expenses",
    "reports",
    "reconciliation",
    "old-gold",
  ],
  inventory: ["inventory", "audits"],
  coordinator: ["inventory", "karigars", "orders", "repairs"],
  auditor: ["reports", "activity", "audits", "reconciliation"],
};
function Shell() {
  const { session, refresh, loading, t } = useApp(),
    [open, setOpen] = useState(false),
    [branch, setB] = useState("main"),
    [branchVersion, setV] = useState(0);
  if (loading) return <Loading />;
  if (
    !session ||
    session.user.type !== "tenantUser" ||
    session.user.firstLoginChangeRequired
  )
    return <Navigate to="/access" replace />;
  const u = session.user,
    can = (p) =>
      allowed[u.role]?.includes("*") ||
      allowed[u.role]?.includes(p) ||
      p === "rates";
  const logout = async () => {
    await api("/access/logout", { method: "POST" });
    await refresh();
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "is-open" : "")}>
        <NavLink to="/app" className="brand">
          <span className="brand-icon">
            <Gem size={26} />
          </span>
          <div>
            Jeweller OS<small>AHMED SOLUTIONS</small>
          </div>
        </NavLink>
        <div className="shop-switch">
          <div className="shop-avatar">{session.tenant.name.slice(0, 1)}</div>
          <div>
            <strong>{session.tenant.name}</strong>
            <small>
              {t("Plan")}: {session.tenant.plan}
            </small>
          </div>
        </div>
        <nav>
          {nav.map(([group, items]) => (
            <div className="nav-group" key={group}>
              {items.some(([p]) => can(p)) && <h4>{t(group)}</h4>}
              {items
                .filter(([p]) => can(p))
                .map(([path, label, Icon]) => (
                  <NavLink
                    key={path}
                    to={"/app" + (path ? "/" + path : "")}
                    end
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} />
                    {t(label)}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={17} />
          {t("Sign out")}
        </button>
        <div className="sidebar-footer">
          <ShieldCheck size={14} /> {u.role} · {u.name}
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close menu"
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
            <span className="workspace-name">{session.tenant.name}</span>
            <span className="top-separator" />
            <select
              aria-label={t("Branches")}
              value={branch}
              onChange={(e) => {
                setB(e.target.value);
                setBranch(e.target.value);
                setV((v) => v + 1);
              }}
            >
              {u.branches.map((b) => (
                <option key={b} value={b}>
                  {b === "main" ? t("Main branch") : b}
                </option>
              ))}
            </select>
          </div>
          <div className="top-right">
            <Language />
            <NavLink
              className="icon-button"
              to="/app/notifications"
              aria-label={t("Notifications")}
            >
              <Bell size={19} />
            </NavLink>
            <div className="avatar" title={u.name}>
              {u.name.slice(0, 1)}
            </div>
          </div>
        </header>
        <main className="main-content" key={branchVersion}>
          {["suspended", "archived"].includes(session.tenant.status) ? (
            <ErrorState
              error={{
                message: "Shop access is suspended. Contact Ahmed Solutions",
              }}
            />
          ) : (
            <>
              {(session.tenant.status === "expired" ||
                new Date(session.tenant.expiresAt) < new Date()) && (
                <div className="banner">
                  {t("Plan expired. Contact Ahmed Solutions to renew.")}
                </div>
              )}
              <Outlet />
            </>
          )}
        </main>
        <footer className="app-footer">
          JEWELLER OS <span>{t("Every gram, accounted for.")}</span>
        </footer>
      </div>
    </div>
  );
}
function App() {
  return (
    <Routes>
      <Route path="/access" element={<Access />} />
      <Route path="/admin" element={<Access admin />} />
      <Route path="/admin/:view" element={<Admin />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="rates" element={<RatesPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        {[
          "inventory",
          "customers",
          "karigars",
          "orders",
          "repairs",
          "expenses",
          "old-gold",
        ].map((k) => (
          <Route key={k} path={k} element={<RecordsPage key={k} kind={k} />} />
        ))}
        <Route path="audits" element={<ControlPage kind="audits" />} />
        <Route
          path="reconciliation"
          element={<ControlPage key="reconciliation" kind="reconciliation" />}
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
);
