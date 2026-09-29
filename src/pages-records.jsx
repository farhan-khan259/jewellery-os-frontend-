import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Download,
  Printer,
  ArrowUpRight,
  Grid2X2,
  List,
} from "lucide-react";
import { useApp } from "./context";
import { api, currency, grams, date, download } from "./api";
import {
  useData,
  Loading,
  ErrorState,
  Header,
  Button,
  Badge,
  Empty,
  SearchBox,
  Modal,
  Details,
  Confirm,
  Field,
} from "./components";
import { FormModal } from "./forms";
const titles = {
  inventory: "Inventory",
  customers: "Customers",
  karigars: "Karigars",
  orders: "Custom orders",
  repairs: "Repairs",
  expenses: "Expenses",
  "old-gold": "Old gold",
};
export function RecordsPage({ kind }) {
  const { t, notify, session } = useApp(),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    { data, error, loading, reload } = useData(
      `/records/${kind}?page=${page}&q=${encodeURIComponent(search)}&status=${status}`,
    ),
    [modal, setModal] = useState(null),
    [selected, setSelected] = useState(null),
    [edit, setEdit] = useState(null),
    [ledger, setLedger] = useState(null),
    [confirm, setConfirm] = useState(null),
    [gallery, setGallery] = useState(false),
    [transfer, setTransfer] = useState(null);
  const canWrite =
    !["auditor"].includes(session.user.role) &&
    !(
      session.user.role === "cashier" &&
      ["inventory", "orders", "repairs"].includes(kind)
    );
  const cols =
    kind === "inventory"
      ? ["Category", "Purity", "Net weight", "Status"]
      : kind === "customers"
        ? ["Phone", "Address"]
        : kind === "karigars"
          ? ["Phone", "Skill"]
          : kind === "expenses"
            ? ["Amount", "Method", "Date"]
            : kind === "old-gold"
              ? ["Purity", "Weight", "Amount", "Type"]
              : ["Customer", "Due date", "Status"];
  function cells(r) {
    const d = r.data;
    return kind === "inventory"
      ? [d.category, d.purity + "K", grams(d.netMg), <Badge>{d.status}</Badge>]
      : kind === "customers"
        ? [d.phone, d.address]
        : kind === "karigars"
          ? [d.phone, d.skill]
          : kind === "expenses"
            ? [currency(d.amount * 100), t(d.method), date(d.date)]
            : kind === "old-gold"
              ? [
                  d.purity + "K",
                  grams(d.remainingMg),
                  currency(d.value),
                  t(d.mode),
                ]
              : [
                  d.customerId?.slice(-6),
                  date(d.dueDate),
                  <Badge>{d.status}</Badge>,
                ];
  }
  const nextStage = async (reason) => {
    const r = confirm,
      stages =
        kind === "orders"
          ? [
              "draft",
              "confirmed",
              "design",
              "gold-issued",
              "manufacturing",
              "polishing",
              "qc",
              "ready",
              "delivered",
            ]
          : ["received", "assigned", "in-progress", "ready", "delivered"];
    await api("/records/" + kind + "/" + r._id, {
      method: "PATCH",
      body: {
        status: stages[stages.indexOf(r.data.status) + 1],
        reason,
        confirmation: true,
      },
    });
    reload();
    setSelected(null);
  };
  return (
    <>
      <Header title={titles[kind]}>
        <div className="heading-actions">
          {kind === "expenses" && session.user.role === "owner" && (
            <Button variant="secondary" onClick={() => setModal("cash")}>
              {t("Cash adjustment")}
            </Button>
          )}
          {kind === "customers" && canWrite && (
            <Button variant="secondary" onClick={() => setModal("payment")}>
              {t("Receive payment")}
            </Button>
          )}
          {kind === "karigars" && canWrite && (
            <>
              <Button variant="secondary" onClick={() => setModal("issue")}>
                {t("Issue gold")}
              </Button>
              <Button variant="secondary" onClick={() => setModal("receive")}>
                {t("Receive gold")}
              </Button>
            </>
          )}
          {canWrite && (
            <Button onClick={() => setModal(kind)}>
              <Plus size={17} />
              {t("Add")}
            </Button>
          )}
        </div>
      </Header>
      <section className="panel">
        <div className="list-toolbar">
          <SearchBox
            value={search}
            onChange={(q) => {
              setSearch(q);
              setPage(1);
            }}
          />
          {kind === "inventory" && (
            <>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label={t("Status")}
              >
                <option value="">{t("All")}</option>
                {["in-stock", "sold", "with-karigar"].map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
              <button
                className="icon-button"
                onClick={() => setGallery(!gallery)}
                aria-label="Toggle gallery"
              >
                {gallery ? <List size={19} /> : <Grid2X2 size={19} />}
              </button>
            </>
          )}
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} retry={reload} />
        ) : !data?.rows.length ? (
          <Empty />
        ) : gallery && kind === "inventory" ? (
          <div className="inventory-gallery">
            {data.rows.map((r) => (
              <button
                className="inventory-tile"
                key={r._id}
                onClick={() => setSelected(r)}
              >
                {r.data.photos?.[0] ? (
                  <img
                    src={"/api/v1/attachments/" + r.data.photos[0]}
                    alt={r.data.name}
                  />
                ) : (
                  <div className="no-photo">◇</div>
                )}
                <strong>{r.data.name}</strong>
                <small>
                  {r.key} · {r.data.purity}K · {grams(r.data.netMg)}
                </small>
                <Badge>{r.data.status}</Badge>
              </button>
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  {cols.map((c) => (
                    <th key={c}>{t(c)}</th>
                  ))}
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <button
                        className="table-name"
                        onClick={() => setSelected(r)}
                      >
                        {r.data.name}
                      </button>
                      <small>{r.key}</small>
                    </td>
                    {cells(r).map((v, i) => (
                      <td key={i}>{v || "—"}</td>
                    ))}
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelected(r)}
                      >
                        {t("View")}
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            {data?.total || 0} · {t("Page")} {page}
          </span>
          <div>
            <Button
              variant="text"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t("Previous")}
            </Button>
            <Button
              variant="text"
              disabled={page * 50 >= (data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              {t("Next")}
            </Button>
          </div>
        </div>
      </section>
      {modal && (
        <FormModal
          kind={modal}
          title={titles[modal] || "Add"}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}{" "}
      {edit && (
        <FormModal
          kind={kind}
          editId={edit._id}
          initial={edit.data}
          title="Edit"
          onClose={() => setEdit(null)}
          onSaved={reload}
        />
      )}
      {selected && (
        <Modal
          title={selected.data.name}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="modal-body">
            <div className="record-title">
              <strong>{selected.key}</strong>
              {selected.data.status && <Badge>{selected.data.status}</Badge>}
            </div>
            <Details
              rows={Object.entries(selected.data)
                .filter(
                  ([k, v]) =>
                    ![
                      "photos",
                      "items",
                      "bookingRates",
                      "customerId",
                      "karigarId",
                      "saleId",
                    ].includes(k) && typeof v !== "object",
                )
                .map(([k, v]) => [k.replace(/([A-Z])/g, " $1"), String(v)])}
            />
            {selected.data.photos?.length > 0 && (
              <div className="thumbs">
                {selected.data.photos.map((id) => (
                  <img
                    src={"/api/v1/attachments/" + id}
                    key={id}
                    alt={selected.data.name}
                  />
                ))}
              </div>
            )}
            <div className="detail-actions">
              {kind === "inventory" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      download(
                        "/inventory/" + selected._id + "/tag",
                        selected.key + "-tag.pdf",
                      ).catch((e) => notify(e.message, true))
                    }
                  >
                    {t("Print tag")}
                  </Button>
                  {canWrite &&
                    session.user.branches.length > 1 &&
                    selected.data.status === "in-stock" && (
                      <Button
                        variant="secondary"
                        onClick={() => setTransfer(selected)}
                      >
                        {t("Transfer item")}
                      </Button>
                    )}
                  {canWrite &&
                    ["in-stock", "reserved"].includes(selected.data.status) && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setConfirm({ ...selected, reservation: true })
                        }
                      >
                        {t(
                          selected.data.status === "reserved"
                            ? "Release reservation"
                            : "Reserve item",
                        )}
                      </Button>
                    )}
                </>
              )}
              {["customers", "karigars"].includes(kind) && (
                <Button
                  onClick={() => {
                    setLedger(selected);
                    setSelected(null);
                  }}
                >
                  {t("View ledger")}
                </Button>
              )}
              {kind === "customers" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      download(
                        "/customers/" + selected._id + "/statement",
                        "statement.pdf",
                      ).catch((e) => notify(e.message, true))
                    }
                  >
                    {t("Statement")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setModal("amanat");
                      setSelected(null);
                    }}
                  >
                    {t("Customer amanat")}
                  </Button>
                </>
              )}
              {["orders", "repairs"].includes(kind) &&
                selected.data.status !== "delivered" &&
                canWrite &&
                (kind === "orders" && selected.data.status === "ready" ? (
                  <Link
                    className="button"
                    to={"/app/pos?order=" + selected._id}
                  >
                    {t("New sale")}
                  </Link>
                ) : (
                  <Button onClick={() => setConfirm(selected)}>
                    {t("Next stage")}
                  </Button>
                ))}
              {["orders", "repairs", "old-gold"].includes(kind) && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    download(
                      `/documents/${kind}/${selected._id}`,
                      `${selected.key}.pdf`,
                    ).catch((e) => notify(e.message, true))
                  }
                >
                  {t("Download PDF")}
                </Button>
              )}
              {["customers", "karigars", "inventory"].includes(kind) &&
                canWrite && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEdit(selected);
                      setSelected(null);
                    }}
                  >
                    {t("Edit")}
                  </Button>
                )}
            </div>
          </div>
        </Modal>
      )}
      {transfer && (
        <TransferModal
          item={transfer}
          onClose={() => setTransfer(null)}
          onSaved={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
      {ledger && (
        <Ledger record={ledger} kind={kind} onClose={() => setLedger(null)} />
      )}{" "}
      {confirm && (
        <Confirm
          title="Next stage"
          onClose={() => setConfirm(null)}
          onConfirm={
            confirm?.reservation
              ? async (reason) => {
                  await api("/inventory/" + confirm._id + "/reserve", {
                    method: "POST",
                    body: {
                      reserve: confirm.data.status === "in-stock",
                      reason,
                    },
                  });
                  setSelected(null);
                  reload();
                }
              : nextStage
          }
        />
      )}
    </>
  );
}
function Ledger({ record, kind, onClose }) {
  const { t } = useApp(),
    { data, error, loading } = useData(
      `/records/${kind === "customers" ? "customerLedger" : "karigarLedger"}?${kind === "customers" ? "customerId" : "karigarId"}=${record._id}&limit=200`,
    );
  let balance = 0;
  return (
    <Modal
      title={record.data.name + " · " + t("Statement")}
      onClose={onClose}
      wide
    >
      <div className="modal-body">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <>
            <div className="ledger-balance">
              {kind === "customers"
                ? currency(data.rows.reduce((s, r) => s + r.data.amount, 0))
                : grams(data.rows.reduce((s, r) => s + r.data.pureMg, 0))}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Name")}</th>
                    <th>{t(kind === "customers" ? "Amount" : "Weight")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td>{date(r.createdAt)}</td>
                      <td>{r.data.name}</td>
                      <td>
                        {kind === "customers"
                          ? currency(r.data.amount)
                          : grams(r.data.pureMg)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
export function SalesPage() {
  const { t } = useApp(),
    drafts = useData("/records/drafts?limit=50"),
    [page, setPage] = useState(1),
    { data, loading, error, reload } = useData("/sales?page=" + page);
  return (
    <>
      {drafts.data?.rows.length > 0 && (
        <section className="panel panel-body">
          <h3>{t("Saved drafts")}</h3>
          <div className="detail-actions">
            {drafts.data.rows.map((d) => (
              <Link
                className="button secondary"
                key={d._id}
                to={"/app/pos?draft=" + d._id}
              >
                {d.key} · {date(d.createdAt)}
              </Link>
            ))}
          </div>
        </section>
      )}
      <Header title="Sales & invoices">
        <Link to="/app/pos" className="button">
          <Plus size={17} />
          {t("New sale")}
        </Link>
      </Header>
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} retry={reload} />
        ) : data.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "Reference",
                    "Customer",
                    "Date",
                    "Amount",
                    "Remaining balance",
                    "Status",
                  ].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <Link to={"/app/sales/" + s._id}>{s.number}</Link>
                    </td>
                    <td>{s.customer.name}</td>
                    <td>{date(s.createdAt)}</td>
                    <td>{currency(s.totals.total)}</td>
                    <td>{currency(s.totals.balance)}</td>
                    <td>
                      <Badge>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <div className="pagination">
          <span>{data?.total || 0}</span>
          <Button
            variant="text"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t("Previous")}
          </Button>
          <Button
            variant="text"
            disabled={page * 50 >= (data?.total || 0)}
            onClick={() => setPage(page + 1)}
          >
            {t("Next")}
          </Button>
        </div>
      </section>
    </>
  );
}
export function SaleDetail() {
  const { id } = useParams(),
    { t, notify, session } = useApp(),
    { data: s, error, loading, reload } = useData("/sales/" + id),
    [voiding, setVoiding] = useState(false),
    [returning, setReturning] = useState(false),
    [lang, setLang] = useState("en");
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const save = (paper) =>
    download(
      `/sales/${id}/document?paper=${paper}&lang=${lang}`,
      s.number + ".pdf",
    ).catch((e) => notify(e.message, true));
  return (
    <>
      <Header title={s.number}>
        <Link className="button secondary" to="/app/sales">
          <ArrowLeft size={16} />
          {t("Back")}
        </Link>
        <select
          aria-label={t("Invoice language")}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="en">English</option>
          <option value="ur">اردو</option>
          <option value="bilingual">English + اردو</option>
        </select>
        <Button onClick={() => save("a4")}>
          <Download size={16} />
          {t("Download PDF")}
        </Button>
        <Button variant="secondary" onClick={() => save("thermal")}>
          <Printer size={16} />
          {t("Thermal receipt")}
        </Button>
      </Header>
      <article className="invoice-sheet">
        <div className="invoice-heading">
          <div>
            {s.profile.logoId && (
              <img
                className="invoice-logo"
                src={"/api/v1/attachments/" + s.profile.logoId}
                alt={s.profile.name}
              />
            )}
            <h1>{s.profile.name}</h1>
            <p>{s.profile.address}</p>
            <p>{s.profile.phone}</p>
            <small>{s.profile.registration}</small>
          </div>
          <div>
            <div className="eyebrow">INVOICE / رسید</div>
            <h2>{s.number}</h2>
            <p>{date(s.createdAt)}</p>
            <Badge>{s.status}</Badge>
          </div>
        </div>
        <div className="bill-to">
          <small>{t("Customer")}</small>
          <h3>{s.customer.name}</h3>
          <p>
            {s.customer.phone} · {s.customer.address}
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Name",
                  "Purity",
                  "Net weight",
                  "Metal rates",
                  "Making charge",
                  "Amount",
                ].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.lines.map((l) => (
                <tr key={l.itemId}>
                  <td>
                    {l.description}
                    <small>{l.sku}</small>
                  </td>
                  <td>{l.purity}K</td>
                  <td>{grams(l.netMg)}</td>
                  <td>{currency(l.rate)}</td>
                  <td>{currency(l.making)}</td>
                  <td>{currency(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="invoice-totals">
          {[
            ["Subtotal", "subtotal"],
            ["Discount", "discount"],
            ["Tax percent", "tax"],
            ["Old gold exchange", "exchange"],
            ["Customer credit", "credit"],
            ["Amount payable", "payable"],
            ["Payment received", "received"],
            ["Remaining balance", "balance"],
          ].map(([k, v]) => (
            <div className={v === "payable" ? "grand" : ""} key={v}>
              <span>{t(k)}</span>
              <strong>{currency(s.totals[v])}</strong>
            </div>
          ))}
        </div>
        <div className="invoice-notes">
          <p>{s.profile.terms}</p>
          <p>{s.profile.bank}</p>
          <strong>{s.profile.footer}</strong>
          <small>{s.cashier}</small>
        </div>
      </article>
      <div className="detail-actions">
        <a
          className="button secondary"
          href={
            "https://wa.me/" +
            s.customer.phone?.replace(/\D/g, "") +
            "?text=" +
            encodeURIComponent(
              `${s.profile.name} · ${s.number}\n${t("Amount payable")}: ${currency(s.totals.payable)}\n${t("Remaining balance")}: ${currency(s.totals.balance)}`,
            )
          }
          target="_blank"
          rel="noreferrer"
        >
          {t("Share on WhatsApp")}
        </a>
        {["owner", "manager"].includes(session.user.role) &&
          s.status !== "void" && (
            <>
              <Button variant="secondary" onClick={() => setReturning(true)}>
                {t("Return items")}
              </Button>
              <Button variant="danger" onClick={() => setVoiding(true)}>
                {t("Void invoice")}
              </Button>
            </>
          )}
      </div>
      {returning && (
        <ReturnModal
          sale={s}
          onClose={() => setReturning(false)}
          onSaved={reload}
        />
      )}{" "}
      {voiding && (
        <Confirm
          title="Void invoice"
          onClose={() => setVoiding(false)}
          onConfirm={async (reason) => {
            await api("/sales/" + id + "/void", {
              method: "POST",
              body: { reason },
            });
            reload();
          }}
        />
      )}
    </>
  );
}

function ReturnModal({ sale, onClose, onSaved }) {
  const { t, notify } = useApp(),
    [ids, setIds] = useState([]),
    [refund, setRefund] = useState(0),
    [method, setMethod] = useState("cash"),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const [key] = useState(crypto.randomUUID());
  return (
    <Modal title="Return items" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/sales/" + sale._id + "/returns", {
              method: "POST",
              body: { items: ids, refund, method, reason, idempotencyKey: key },
            });
            notify("Saved successfully");
            onSaved();
            onClose();
          } catch (e) {
            notify(e.message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          {sale.lines.map((l) => (
            <label className="check-row" key={l.itemId}>
              <input
                type="checkbox"
                checked={ids.includes(l.itemId)}
                onChange={(e) =>
                  setIds(
                    e.target.checked
                      ? [...ids, l.itemId]
                      : ids.filter((id) => id !== l.itemId),
                  )
                }
              />
              {l.description} · {grams(l.netMg)}
            </label>
          ))}
          <Field label="Refund amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={refund}
              onChange={(e) => setRefund(+e.target.value)}
            />
          </Field>
          <Field label="Payment method">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {["cash", "bank", "card", "transfer"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason">
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-foot">
          <Button disabled={!ids.length} busy={busy}>
            {t("Confirm")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TransferModal({ item, onClose, onSaved }) {
  const { t, session, notify } = useApp(),
    [branch, setBranch] = useState(
      session.user.branches.find((b) => b !== item.branch) || "",
    ),
    [location, setLocation] = useState("");
  return (
    <Confirm
      title="Transfer item"
      onClose={onClose}
      onConfirm={async (reason) => {
        await api("/inventory/" + item._id + "/transfer", {
          method: "POST",
          body: { branch, location, reason },
        });
        onSaved();
      }}
    >
      <Field label="Destination branch">
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {session.user.branches
            .filter((b) => b !== item.branch)
            .map((b) => (
              <option key={b}>{b}</option>
            ))}
        </select>
      </Field>
      <Field label="Location">
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
    </Confirm>
  );
}
