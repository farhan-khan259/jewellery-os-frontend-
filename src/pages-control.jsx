import React, { useState, useEffect } from "react";
import { Plus, Download, ShieldCheck } from "lucide-react";
import { useApp } from "./context";
import { api, currency, grams, date, download } from "./api";
import {
  useData,
  Header,
  Button,
  Loading,
  ErrorState,
  Empty,
  Badge,
  Modal,
  Field,
  Confirm,
  Details,
} from "./components";
import { FormModal, DynamicFields, forms, field } from "./forms";
export function ControlPage({ kind }) {
  const { t, notify } = useApp(),
    { data, error, loading, reload } = useData("/records/" + kind),
    [modal, setModal] = useState(false),
    [selected, setSelected] = useState(null),
    [name, setName] = useState(""),
    [sku, setSku] = useState(""),
    [weight, setWeight] = useState(0),
    [closing, setClosing] = useState(false);
  const act = async (fn) => {
    try {
      await fn();
      reload();
    } catch (e) {
      notify(e.message, true);
    }
  };
  const audit = kind === "audits";
  return (
    <>
      <Header title={audit ? "Stock audit" : "Reconciliation"}>
        <Button onClick={() => setModal(true)}>
          <Plus size={17} />
          {t(audit ? "Start audit" : "Add")}
        </Button>
      </Header>
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : !data?.rows.length ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {(audit
                    ? [
                        "Name",
                        "Date",
                        "Expected",
                        "Scanned",
                        "Status",
                        "Actions",
                      ]
                    : [
                        "Name",
                        "Date",
                        "Purity",
                        "Expected",
                        "Physical closing",
                        "Difference",
                      ]
                  ).map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r._id}>
                    <td>{r.data.name}</td>
                    <td>{date(r.createdAt)}</td>
                    {audit ? (
                      <>
                        <td>{r.data.expected.length}</td>
                        <td>{r.data.scanned.length}</td>
                        <td>
                          <Badge>{r.data.status}</Badge>
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setSelected(r)}
                          >
                            {t("View")}
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{r.data.purity}K</td>
                        <td>{grams(r.data.expected)}</td>
                        <td>{grams(r.data.physical)}</td>
                        <td className={r.data.difference ? "negative" : ""}>
                          {grams(r.data.difference)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal &&
        (audit ? (
          <Modal title="Start audit" onClose={() => setModal(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api("/audits", { method: "POST", body: { name } });
                  setModal(false);
                });
              }}
            >
              <div className="modal-body">
                <Field label="Name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              </div>
              <div className="modal-foot">
                <Button>{t("Start audit")}</Button>
              </div>
            </form>
          </Modal>
        ) : (
          <FormModal
            kind="reconciliation"
            onClose={() => setModal(false)}
            onSaved={reload}
          />
        ))}
      {selected && (
        <Modal
          title={selected.data.name}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="modal-body">
            {selected.data.status === "open" && (
              <form
                className="scan-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    const a = await api("/audits/" + selected._id + "/scan", {
                      method: "POST",
                      body: { sku, weight },
                    });
                    setSelected(a);
                    setSku("");
                  });
                }}
              >
                <Field label="Reference">
                  <input
                    value={sku}
                    required
                    onChange={(e) => setSku(e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Net weight" hint="g">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={weight}
                    onChange={(e) => setWeight(+e.target.value)}
                  />
                </Field>
                <Button>{t("Scan item")}</Button>
              </form>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Reference")}</th>
                    <th>{t("Expected")}</th>
                    <th>{t("Scanned")}</th>
                    <th>{t("Difference")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.data.expected.map((r) => {
                    const s = selected.data.scanned.find(
                      (x) => x.sku === r.sku,
                    );
                    return (
                      <tr key={r.sku}>
                        <td>
                          {r.sku}
                          <small>{r.name}</small>
                        </td>
                        <td>{grams(r.netMg)}</td>
                        <td>{s ? grams(s.netMg) : t("Missing")}</td>
                        <td>{s ? grams(s.netMg - r.netMg) : "—"}</td>
                      </tr>
                    );
                  })}
                  {selected.data.scanned
                    .filter(
                      (s) =>
                        !selected.data.expected.some((e) => e.sku === s.sku),
                    )
                    .map((s) => (
                      <tr key={s.sku}>
                        <td>{s.sku}</td>
                        <td>{t("Unexpected")}</td>
                        <td>{grams(s.netMg)}</td>
                        <td>—</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {selected.data.resolution && <p>{selected.data.resolution}</p>}
            {selected.data.status === "open" && (
              <Button onClick={() => setClosing(true)}>
                {t("Close audit")}
              </Button>
            )}
          </div>
        </Modal>
      )}
      {closing && (
        <Confirm
          title="Close audit"
          onClose={() => setClosing(false)}
          onConfirm={async (reason) => {
            const r = await api("/audits/" + selected._id + "/close", {
              method: "POST",
              body: { reason },
            });
            setSelected(r);
            reload();
          }}
        />
      )}
    </>
  );
}
const reports = [
  ["sales", "Sales & invoices"],
  ["profit", "Gross profit"],
  ["stock", "Inventory"],
  ["gold-movement", "Gold movement"],
  ["karigar-outstanding", "Karigars"],
  ["wastage", "Wastage"],
  ["receivables", "Customer dues"],
  ["cash-bank", "Cash / bank"],
  ["expenses", "Expenses"],
  ["old-gold", "Old gold"],
  ["orders", "Custom orders"],
  ["repairs", "Repairs"],
  ["discounts", "Discount"],
  ["audit-discrepancies", "Stock audit"],
  ["reconciliation", "Reconciliation"],
  ["activity", "Activity log"],
  ["design-performance", "Design performance"],
  ["amanat", "Customer amanat"],
];
export function ReportsPage() {
  const { t, notify, session } = useApp(),
    [type, setType] = useState("sales"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    path = `/reports/${type}?from=${from}&to=${to}`,
    { data, error, loading } = useData(path);
  const keys = data?.rows.length
    ? [...new Set(data.rows.flatMap(Object.keys))].filter(
        (k) =>
          ![
            "photos",
            "bookingRates",
            "expected",
            "scanned",
            "movementIds",
            "missing",
            "unexpected",
            "mismatched",
            "items",
          ].includes(k),
      )
    : [];
  return (
    <>
      <Header title="Reports">
        <Button variant="secondary" onClick={() => window.print()}>
          {t("Print invoice")}
        </Button>
        <Button
          onClick={() =>
            download(path + "&format=csv", type + ".csv").catch((e) =>
              notify(e.message, true),
            )
          }
        >
          <Download size={16} />
          {t("Export CSV")}
        </Button>
      </Header>
      <section className="panel">
        <div className="report-filters">
          <Field label="Reports">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {reports
                .filter(
                  ([key]) => key !== "profit" || session.user.role === "owner",
                )
                .map(([k, l]) => (
                  <option key={k} value={k}>
                    {t(l)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="From">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : !data?.rows.length ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {keys.map((k) => (
                    <th key={k}>{t(k.replace(/([A-Z])/g, " $1"))}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i}>
                    {keys.map((k) => (
                      <td key={k}>
                        {typeof r[k] === "object"
                          ? JSON.stringify(r[k])
                          : String(r[k] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
export function TwoFactor() {
  const { t, notify, session, refresh } = useApp(),
    [setup, setSetup] = useState(null),
    [code, setCode] = useState("");
  return (
    <div className="two-factor">
      <h3>
        <ShieldCheck size={18} /> {t("Enable 2FA")}
      </h3>
      {session.user.totpEnabled ? (
        <Badge>Enabled</Badge>
      ) : setup ? (
        <>
          <p>
            {t("Secret key")}: <code>{setup.secret}</code>
          </p>
          <Field label="Verification code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Button
            onClick={async () => {
              try {
                await api("/access/2fa/enable", {
                  method: "POST",
                  body: { code },
                });
                await refresh();
                setSetup(null);
                notify("Saved successfully");
              } catch (e) {
                notify(e.message, true);
              }
            }}
          >
            {t("Confirm")}
          </Button>
        </>
      ) : (
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              setSetup(await api("/access/2fa/setup", { method: "POST" }));
            } catch (e) {
              notify(e.message, true);
            }
          }}
        >
          {t("Enable 2FA")}
        </Button>
      )}
    </div>
  );
}
export function SettingsPage() {
  const { t, notify, refresh } = useApp(),
    { data, error, loading, reload } = useData("/settings"),
    [profile, setProfile] = useState(null),
    [busy, setBusy] = useState(false),
    [branch, setBranch] = useState(false);
  useEffect(() => {
    if (data) setProfile(data.profile);
  }, [data]);
  if (loading || !profile)
    return error ? <ErrorState error={error} /> : <Loading />;
  return (
    <>
      <Header title="Settings">
        <Button
          variant="secondary"
          onClick={() =>
            download("/export", "jeweller-os-export.json").catch((e) =>
              notify(e.message, true),
            )
          }
        >
          {t("Export shop data")}
        </Button>
      </Header>
      <div className="settings-layout">
        <section className="panel">
          <div className="panel-head">
            <h2>{t("Shop profile")}</h2>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api("/settings", { method: "PUT", body: profile });
                await refresh();
                notify("Saved successfully");
              } catch (e) {
                notify(e.message, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="panel-body">
              <div className="logo-upload">
                {profile.logoId ? (
                  <img
                    src={"/api/v1/attachments/" + profile.logoId}
                    alt={profile.name}
                  />
                ) : (
                  <div className="logo-placeholder">◇</div>
                )}
                <Field label="Upload logo">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={async (e) => {
                      if (!e.target.files[0]) return;
                      try {
                        const fd = new FormData();
                        fd.append("file", e.target.files[0]);
                        const r = await api("/attachments", {
                          method: "POST",
                          body: fd,
                        });
                        setProfile({ ...profile, logoId: r.id });
                      } catch (e) {
                        notify(e.message, true);
                      }
                    }}
                  />
                </Field>
              </div>
              <DynamicFields
                fields={forms.profile}
                values={profile}
                setValues={setProfile}
              />
            </div>
            <div className="panel-foot">
              <Button busy={busy}>{t("Save")}</Button>
            </div>
          </form>
        </section>
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("Subscription")}</h2>
            </div>
            <div className="panel-body">
              <Details
                rows={[
                  [t("Plan"), data.subscription.plan],
                  [t("Status"), data.subscription.status],
                  ["Expiry", date(data.subscription.expiresAt)],
                  ["User limit", data.subscription.limits.users],
                  ["Branch limit", data.subscription.limits.branches],
                ]}
              />
              <TwoFactor />
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("Branches")}</h2>
              <Button variant="text" onClick={() => setBranch(true)}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="panel-body">
              {data.branches.map((b) => (
                <p key={b._id}>
                  {b.data.name} <small>{b.key}</small>
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
      {branch && (
        <FormModal
          kind="branches"
          title="Branches"
          onClose={() => setBranch(false)}
          onSaved={() => {
            reload();
            refresh();
          }}
        />
      )}
    </>
  );
}
export function TeamPage() {
  const { t, notify } = useApp(),
    { data, error, loading, reload } = useData("/users"),
    [modal, setModal] = useState(false),
    [secret, setSecret] = useState(null),
    [values, setValues] = useState({ name: "", username: "", role: "cashier" }),
    [change, setChange] = useState(null);
  return (
    <>
      <Header title="Team">
        <Button onClick={() => setModal(true)}>
          <Plus size={16} />
          {t("Add")}
        </Button>
      </Header>
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
                  {["Name", "Username", "Role", "Status", "Actions"].map(
                    (k) => (
                      <th key={k}>{t(k)}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>
                      {u.firstLoginChangeRequired
                        ? "Awaiting activation"
                        : u.status || "active"}
                    </td>
                    <td>
                      {u.role !== "owner" && (
                        <Button variant="text" onClick={() => setChange(u)}>
                          {t("Edit")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && (
        <Modal title="Team" onClose={() => setModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const r = await api("/users", {
                  method: "POST",
                  body: { ...values, branches: ["main"] },
                });
                setSecret(r);
                setModal(false);
                reload();
              } catch (e) {
                notify(e.message, true);
              }
            }}
          >
            <div className="modal-body">
              <DynamicFields
                fields={[
                  field("name", "Name", "text", { required: true }),
                  field("username", "Username", "text", { required: true }),
                  field("role", "Role", "select", {
                    options: [
                      "cashier",
                      "manager",
                      "accountant",
                      "inventory",
                      "coordinator",
                      "auditor",
                    ],
                  }),
                ]}
                values={values}
                setValues={setValues}
              />
            </div>
            <div className="modal-foot">
              <Button>{t("Save")}</Button>
            </div>
          </form>
        </Modal>
      )}
      {secret && (
        <Modal title="Issued credentials" onClose={() => setSecret(null)}>
          <div className="modal-body">
            <p>
              Shown once. Share privately; the user must change this password at
              first access.
            </p>
            <Details
              rows={[
                [t("Username"), secret.user.username],
                [t("Password"), secret.temporaryPassword],
              ]}
            />
          </div>
        </Modal>
      )}
      {change && (
        <Confirm
          title="Revoke / reactivate access"
          onClose={() => setChange(null)}
          onConfirm={async (reason) => {
            await api("/users/" + change._id, {
              method: "PATCH",
              body: {
                role: change.role,
                status: change.status === "revoked" ? "active" : "revoked",
                reason,
              },
            });
            reload();
          }}
        >
          <Field label="Role">
            <select
              value={change.role}
              onChange={(e) => setChange({ ...change, role: e.target.value })}
            >
              {[
                "cashier",
                "manager",
                "accountant",
                "inventory",
                "coordinator",
                "auditor",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </Confirm>
      )}
    </>
  );
}
export function ActivityPage() {
  const { t } = useApp(),
    { data, error, loading } = useData("/audit-logs");
  return (
    <>
      <Header title="Activity log" />
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
                  <th>{t("Date")}</th>
                  <th>{t("Name")}</th>
                  <th>{t("Actions")}</th>
                  <th>{t("Reason")}</th>
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
    </>
  );
}
export function NotificationsPage() {
  const { data, error, loading } = useData("/notifications");
  return (
    <>
      <Header title="Notifications" />
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : data.length ? (
          data.map((r) => (
            <div className="notification-row" key={r._id}>
              <span className="notification-mark">!</span>
              <div>
                <h3>{r.data.name}</h3>
                <p>{r.data.notes}</p>
              </div>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
export function RatesPage() {
  const { t, session } = useApp(),
    { data, error, loading, reload } = useData("/records/rates?limit=100"),
    [modal, setModal] = useState(false);
  return (
    <>
      <Header title="Metal rates">
        {session.user.role === "owner" && (
          <Button onClick={() => setModal(true)}>{t("Update rates")}</Button>
        )}
      </Header>
      <section className="panel">
        <div className="panel-head">
          <h2>{t("Rate history")}</h2>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : data.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  {[24, 22, 21, 18].map((k) => (
                    <th key={k}>{k}K PKR / g</th>
                  ))}
                  <th>{t("Silver")}</th>
                  <th>{t("Reason")}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r._id}>
                    <td>
                      {date(r.createdAt)}
                      <small>{r.actor}</small>
                    </td>
                    {[24, 22, 21, 18, "silver"].map((k) => (
                      <td key={k}>{currency(r.data.rates[k])}</td>
                    ))}
                    <td>{r.data.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
      {modal && (
        <FormModal
          kind="rates"
          title="Update rates"
          onClose={() => setModal(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}
