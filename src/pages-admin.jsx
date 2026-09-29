import React, { useState } from "react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import {
  Gem,
  LayoutDashboard,
  Store,
  ShieldCheck,
  LogOut,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "./context";
import { api, date } from "./api";
import {
  useData,
  Header,
  Button,
  Loading,
  ErrorState,
  Empty,
  Modal,
  Field,
  Details,
  Confirm,
  Badge,
  SearchBox,
} from "./components";
import { TwoFactor } from "./pages-control";
const initial = {
  name: "",
  username: "",
  ownerName: "",
  plan: "starter",
  status: "trial",
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  graceUntil: "",
  billingCycle: "monthly",
  paymentStatus: "unpaid",
  users: 2,
  branches: 1,
  features: "*",
  phone: "",
  address: "",
  email: "",
  footer: "Thank you for your trust.",
  notes: "",
  reason: "",
};
export function Admin() {
  const { session, loading, refresh, notify } = useApp(),
    { view } = useParams(),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState(null),
    [credentials, setCredentials] = useState(null),
    [reset, setReset] = useState(null),
    [userStatus, setUserStatus] = useState(null),
    [note, setNote] = useState("");
  const state = useData("/platform-admin/overview");
  if (loading) return <Loading />;
  if (
    !session ||
    session.user.type !== "platformAdmin" ||
    session.user.firstLoginChangeRequired
  )
    return <Navigate to="/admin" replace />;
  const shops = state.data?.shops || [],
    detail = async (id) => {
      try {
        setSelected(await api("/platform-admin/tenants/" + id));
      } catch (e) {
        notify(e.message, true);
      }
    };
  return (
    <div className="app-shell admin-shell" dir="ltr">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={29} />
          <div>
            Ahmed Solutions<small>PLATFORM ADMIN</small>
          </div>
        </div>
        <nav>
          <div className="nav-group">
            <h4>PLATFORM</h4>
            {[
              ["overview", "Overview", LayoutDashboard],
              ["shops", "Shops & subscriptions", Store],
              ["audit", "Support & audit", ShieldCheck],
              ["security", "Account security", ShieldCheck],
            ].map(([p, l, I]) => (
              <NavLink key={p} to={"/admin/" + p}>
                <I size={18} />
                {l}
              </NavLink>
            ))}
          </div>
        </nav>
        <button
          className="logout"
          onClick={async () => {
            await api("/access/logout", { method: "POST" });
            await refresh();
          }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <strong>
            Ahmed Solutions{" "}
            <span className="muted">/ Platform administration</span>
          </strong>
          <div className="avatar">A</div>
        </header>
        <main className="main-content">
          <Header
            title={
              view === "shops"
                ? "Shops & subscriptions"
                : view === "audit"
                  ? "Support & audit"
                  : view === "security"
                    ? "Account security"
                    : "Platform overview"
            }
          >
            <Button onClick={() => setCreate(true)}>
              <Plus size={17} />
              Create shop
            </Button>
          </Header>
          {view === "security" ? (
            <section className="panel panel-body">
              <TwoFactor />
            </section>
          ) : view === "audit" ? (
            <PlatformAudit />
          ) : (
            <>
              {view === "overview" && (
                <div className="stats-grid">
                  {[
                    ["Total shops", shops.length],
                    [
                      "Active / trial",
                      shops.filter((s) =>
                        ["active", "trial"].includes(s.status),
                      ).length,
                    ],
                    [
                      "Suspended",
                      shops.filter((s) => s.status === "suspended").length,
                    ],
                    [
                      "Expiring in 7 days",
                      shops.filter(
                        (s) =>
                          new Date(s.expiresAt) > new Date() &&
                          new Date(s.expiresAt) <
                            new Date(Date.now() + 7 * 86400000),
                      ).length,
                    ],
                  ].map(([k, v], i) => (
                    <div
                      className={"stat-card " + (!i ? "primary" : "")}
                      key={k}
                    >
                      <div className="stat-top">
                        {k}
                        <Store size={18} />
                      </div>
                      <strong>{v}</strong>
                      <small>Shop accounts</small>
                    </div>
                  ))}
                </div>
              )}
              <section className="panel">
                <div className="list-toolbar">
                  <h2>Jewellery shops</h2>
                  <SearchBox value={search} onChange={setSearch} />
                </div>
                {state.loading ? (
                  <Loading />
                ) : state.error ? (
                  <ErrorState error={state.error} retry={state.reload} />
                ) : shops.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Shop</th>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Renewal / expiry</th>
                          <th>Limits</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shops
                          .filter((s) =>
                            s.name.toLowerCase().includes(search.toLowerCase()),
                          )
                          .map((s) => (
                            <tr key={s._id}>
                              <td>
                                <button
                                  className="table-name"
                                  onClick={() => detail(s._id)}
                                >
                                  {s.name}
                                </button>
                                <small>
                                  {s.profile.phone || s.profile.city}
                                </small>
                              </td>
                              <td>{s.plan}</td>
                              <td>
                                <Badge>{s.status}</Badge>
                              </td>
                              <td>{date(s.expiresAt)}</td>
                              <td>
                                {s.limits.users} users · {s.limits.branches}{" "}
                                branches
                              </td>
                              <td>
                                <button
                                  className="text-link"
                                  onClick={() => detail(s._id)}
                                >
                                  Manage
                                  <ArrowUpRight size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty />
                )}
              </section>
              {view === "overview" && (
                <section className="panel">
                  <div className="panel-head">
                    <h2>Recent account events</h2>
                  </div>
                  {state.data?.events.slice(0, 8).map((e) => (
                    <div className="event-row" key={e._id}>
                      <ShieldCheck size={18} />
                      <div>
                        <strong>{e.action}</strong>
                        <small>
                          {e.actor} · {date(e.createdAt)}
                        </small>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
          {create === true && (
            <ShopForm
              onClose={() => setCreate(false)}
              onSaved={(result) => {
                setCredentials(result);
                state.reload();
              }}
            />
          )}
          {selected && (
            <Modal
              title={selected.tenant.name}
              onClose={() => setSelected(null)}
              wide
            >
              <div className="modal-body">
                <Details
                  rows={[
                    ["Plan", selected.tenant.plan],
                    ["Status", selected.tenant.status],
                    ["Expiry", date(selected.tenant.expiresAt)],
                    [
                      "Storage",
                      (selected.storage / 1024 / 1024).toFixed(2) + " MB",
                    ],
                    ["Users", selected.users.length],
                    ["Branches", selected.branches.length],
                  ]}
                />
                <Button onClick={() => setCreate(selected.tenant)}>
                  Edit shop & subscription
                </Button>
                <h3 className="section-title">Users & access</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Activation</th>
                        <th>Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            {u.name}
                            <small>{u.username}</small>
                          </td>
                          <td>{u.role}</td>
                          <td>
                            {u.firstLoginChangeRequired
                              ? "Pending password change"
                              : "Activated"}
                            <small>{u.status}</small>
                          </td>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => setReset(u)}
                            >
                              Reset access
                            </button>
                            <button
                              className="text-link"
                              onClick={() => setUserStatus(u)}
                            >
                              {u.status === "active" ? "Revoke" : "Unlock"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3 className="section-title">Support note</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api("/platform-admin/support", {
                        method: "POST",
                        body: { tenantId: selected.tenant._id, note },
                      });
                      setNote("");
                      detail(selected.tenant._id);
                    } catch (e) {
                      notify(e.message, true);
                    }
                  }}
                >
                  <textarea
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    aria-label="Support note"
                  />
                  <Button variant="secondary">Save note</Button>
                </form>
                <h3 className="section-title">Account history</h3>
                {selected.events.map((e) => (
                  <div className="event-row" key={e._id}>
                    <div>
                      <strong>{e.action}</strong>
                      <small>
                        {e.actor} · {date(e.createdAt)}
                      </small>
                      <p>{e.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Modal>
          )}
          {create && typeof create === "object" && (
            <ShopForm
              tenant={create}
              onClose={() => setCreate(false)}
              onSaved={() => {
                state.reload();
                detail(create._id);
              }}
            />
          )}
          {credentials && (
            <Modal
              title="Issued access · shown once"
              onClose={() => setCredentials(null)}
            >
              <div className="modal-body">
                <p>
                  Share these credentials through a private channel. The shop
                  owner must set a new password on first access.
                </p>
                <Details
                  rows={
                    credentials.accessPath
                      ? [
                          [
                            "Access link",
                            location.origin + credentials.accessPath,
                          ],
                          ["Expires", "30 minutes"],
                        ]
                      : [
                          ["Access page", location.origin + "/access"],
                          ["Username", credentials.username],
                          ["Temporary password", credentials.temporaryPassword],
                        ]
                  }
                />
              </div>
            </Modal>
          )}
          {reset && (
            <Confirm
              title="Reset access"
              onClose={() => setReset(null)}
              onConfirm={async (reason) => {
                const r = await api(
                  "/platform-admin/users/" + reset._id + "/reset",
                  { method: "POST", body: { reason } },
                );
                setCredentials(r);
                if (selected) detail(selected.tenant._id);
              }}
            >
              <p>
                Existing sessions and invitations will be revoked immediately.
              </p>
            </Confirm>
          )}
          {userStatus && (
            <Confirm
              title="Change user access"
              onClose={() => setUserStatus(null)}
              onConfirm={async (reason) => {
                await api(
                  "/platform-admin/users/" + userStatus._id + "/status",
                  {
                    method: "POST",
                    body: {
                      status:
                        userStatus.status === "active" ? "revoked" : "active",
                      reason,
                    },
                  },
                );
                if (selected) detail(selected.tenant._id);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
function ShopForm({ tenant, onClose, onSaved }) {
  const { notify } = useApp(),
    [v, setV] = useState(
      tenant
        ? {
            ...initial,
            ...tenant,
            ...tenant.profile,
            users: tenant.limits.users,
            branches: tenant.limits.branches,
            features: tenant.limits.features.join(","),
            expiresAt: tenant.expiresAt?.slice(0, 10),
            graceUntil: tenant.graceUntil?.slice(0, 10) || "",
          }
        : initial,
    ),
    [busy, setBusy] = useState(false);
  const input = (key, label, type = "text", required = false) => (
      <Field label={label}>
        <input
          type={type}
          required={required}
          min={type === "number" ? 1 : undefined}
          value={v[key]}
          onChange={(e) =>
            setV({
              ...v,
              [key]: type === "number" ? +e.target.value : e.target.value,
            })
          }
        />
      </Field>
    ),
    select = (key, label, values) => (
      <Field label={label}>
        <select
          value={v[key]}
          onChange={(e) => setV({ ...v, [key]: e.target.value })}
        >
          {values.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
    );
  return (
    <Modal
      title={tenant ? "Manage shop" : "Create jewellery shop"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const body = {
              name: v.name,
              username: v.username,
              ownerName: v.ownerName,
              subscription: {
                plan: v.plan,
                status: v.status,
                expiresAt: v.expiresAt,
                graceUntil: v.graceUntil,
                billingCycle: v.billingCycle,
                paymentStatus: v.paymentStatus,
                limits: {
                  users: v.users,
                  branches: v.branches,
                  features: v.features
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                },
              },
              profile: {
                ...tenant?.profile,
                name: v.name,
                ownerName: v.ownerName,
                phone: v.phone,
                email: v.email,
                address: v.address,
                footer: v.footer,
                logoId: v.logoId || tenant?.profile.logoId || "",
              },
              notes: v.notes,
              reason: v.reason,
            };
            const r = await api(
              "/platform-admin/tenants" + (tenant ? "/" + tenant._id : ""),
              { method: tenant ? "PATCH" : "POST", body },
            );
            onSaved(r);
            onClose();
            notify("Saved successfully");
          } catch (e) {
            notify(e.message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          {tenant && (
            <Field label="Upload logo">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={async (e) => {
                  if (!e.target.files[0]) return;
                  try {
                    const data = new FormData();
                    data.append("file", e.target.files[0]);
                    const r = await api(
                      "/platform-admin/tenants/" + tenant._id + "/logo",
                      { method: "POST", body: data },
                    );
                    setV({ ...v, logoId: r.id });
                    notify("Logo ready. Save changes to apply it.");
                  } catch (e) {
                    notify(e.message, true);
                  }
                }}
              />
            </Field>
          )}
          <div className="form-grid">
            {input("name", "Shop name", "text", true)}
            {input("ownerName", "Owner name", "text", true)}
            {!tenant && input("username", "Owner username", "text", true)}
            {input("phone", "Phone")}
            {input("email", "Email")}
            {input("address", "Address")}
            {input("footer", "Invoice footer")}
            {input("plan", "Plan", "text", true)}
            {select("status", "Status", [
              "trial",
              "active",
              "grace",
              "expired",
              "suspended",
              "archived",
            ])}
            {input("expiresAt", "Expiry", "date", true)}
            {input("graceUntil", "Grace until", "date")}
            {select("billingCycle", "Billing cycle", ["monthly", "yearly"])}
            {select("paymentStatus", "Manual payment status", [
              "unpaid",
              "pending",
              "paid",
            ])}
            {input("users", "User limit", "number", true)}
            {input("branches", "Branch limit", "number", true)}
            {input(
              "features",
              "Features (* or comma-separated modules)",
              "text",
              true,
            )}
            {input("notes", "Admin notes")}
            {tenant && input("reason", "Reason", "text", true)}
          </div>
        </div>
        <div className="modal-foot">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button busy={busy}>
            {tenant ? "Save changes" : "Create & issue credentials"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function PlatformAudit() {
  const { data, error, loading } = useData("/platform-admin/audit");
  return (
    <section className="panel">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r._id}>
                  <td>{date(r.createdAt)}</td>
                  <td>{r.actor}</td>
                  <td>{r.action}</td>
                  <td>{r.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
