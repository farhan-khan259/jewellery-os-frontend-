import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, X, ShoppingBag, Check, Calculator } from "lucide-react";
import { useApp } from "./context";
import { api, currency, grams } from "./api";
import {
  Header,
  Button,
  Field,
  SearchBox,
  useData,
  Empty,
  Loading,
  ErrorState,
} from "./components";
import { Lookup, FormModal } from "./forms";
export function POS() {
  const { t, notify, session } = useApp(),
    navigate = useNavigate(),
    [searchParams] = useSearchParams(),
    [search, setSearch] = useState(""),
    { data, error, loading, reload } = useData(
      "/records/inventory?status=in-stock&limit=200&q=" +
        encodeURIComponent(search),
    ),
    [items, setItems] = useState([]),
    [values, setValues] = useState({
      customerId: "",
      discount: 0,
      credit: 0,
      oldGoldId: "",
      orderId: searchParams.get("order") || "",
    }),
    [payments, setPayments] = useState([{ method: "cash", amount: 0 }]),
    [quote, setQuote] = useState(null),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [key, setKey] = useState(crypto.randomUUID());
  useEffect(() => {
    setQuote(null);
  }, [items, values, payments]);
  useEffect(() => {
    const draft = searchParams.get("draft");
    if (draft)
      api("/records/drafts/" + draft)
        .then(async (r) => {
          const d = r.data;
          setValues({
            customerId: d.customerId,
            discount: d.discount,
            credit: d.credit,
            oldGoldId: d.oldGoldId,
            orderId: d.orderId,
          });
          setPayments(d.payments);
          const loaded = [];
          for (const id of d.items)
            loaded.push(await api("/records/inventory/" + id));
          setItems(loaded);
        })
        .catch((e) => notify(e.message, true));
    if (values.orderId)
      api("/records/orders/" + values.orderId)
        .then((r) =>
          setValues((v) => ({ ...v, customerId: r.data.customerId })),
        )
        .catch((e) => notify(e.message, true));
  }, []);
  const body = () => ({
    ...values,
    items: items.map((i) => i._id),
    payments: payments.filter((p) => p.amount > 0),
    idempotencyKey: key,
  });
  const calculate = async () => {
    setBusy(true);
    try {
      const r = await api("/sales/quote", { method: "POST", body: body() });
      setQuote(r);
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/sales", { method: "POST", body: body() });
      notify("Saved successfully");
      navigate("/app/sales/" + r._id);
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const add = (i) => {
    if (items.some((x) => x._id === i._id)) return;
    setItems([...items, i]);
    setSearch("");
  };
  return (
    <>
      <Header title="New sale">
        <Button variant="secondary" onClick={() => setModal("customers")}>
          <Plus size={17} />
          {t("Customer")}
        </Button>
      </Header>
      <div className="pos-layout">
        <div>
          <section className="panel pos-customer">
            <Field label="Select customer">
              <Lookup
                kind="customers"
                value={values.customerId}
                onChange={(v) => setValues({ ...values, customerId: v })}
                required
              />
            </Field>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("Available jewellery")}</h2>
              <span className="count">{data?.total || 0}</span>
            </div>
            <div className="pos-search">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Scan or search jewellery"
              />
            </div>
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorState error={error} retry={reload} />
            ) : data?.rows.length ? (
              <div className="pos-catalog">
                {data.rows.map((i) => (
                  <button
                    key={i._id}
                    className={
                      "catalog-item " +
                      (items.some((x) => x._id === i._id) ? "selected" : "")
                    }
                    onClick={() => add(i)}
                  >
                    <span className="item-mark">
                      {i.data.photos?.[0] ? (
                        <img
                          src={"/api/v1/attachments/" + i.data.photos[0]}
                          alt=""
                        />
                      ) : (
                        <span>◇</span>
                      )}
                    </span>
                    <div>
                      <strong>{i.data.name}</strong>
                      <small>
                        {i.key} · {i.data.purity}K
                      </small>
                      <span>{grams(i.data.netMg)}</span>
                    </div>
                    {items.some((x) => x._id === i._id) ? (
                      <Check size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </section>
        </div>
        <section className="panel sale-summary">
          <div className="panel-head">
            <h2>{t("Sale summary")}</h2>
            <ShoppingBag size={20} />
          </div>
          <div className="summary-content">
            {items.length ? (
              <div className="cart">
                {items.map((i) => (
                  <div className="cart-item" key={i._id}>
                    <div>
                      <strong>{i.data.name}</strong>
                      <small>
                        {i.data.purity}K · {grams(i.data.netMg)}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() =>
                        setItems(items.filter((x) => x._id !== i._id))
                      }
                      aria-label={t("Remove")}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="No items selected"
                text="Choose items from your available stock."
              />
            )}
            <div className="form-grid">
              <Field label="Discount" hint="PKR">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.discount}
                  disabled={!["owner", "manager"].includes(session.user.role)}
                  onChange={(e) =>
                    setValues({ ...values, discount: +e.target.value })
                  }
                />
              </Field>
              <Field label="Customer credit" hint="PKR">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.credit}
                  onChange={(e) =>
                    setValues({ ...values, credit: +e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Old gold exchange">
              <Lookup
                kind="old-gold"
                value={values.oldGoldId}
                onChange={(v) => setValues({ ...values, oldGoldId: v })}
              />
            </Field>
            <div className="payments">
              <h3>{t("Payment received")}</h3>
              {payments.map((p, i) => (
                <div className="payment-row" key={i}>
                  <select
                    aria-label={t("Payment method")}
                    value={p.method}
                    onChange={(e) =>
                      setPayments(
                        payments.map((v, j) =>
                          i === j ? { ...v, method: e.target.value } : v,
                        ),
                      )
                    }
                  >
                    {["cash", "bank", "card", "transfer"].map((v) => (
                      <option key={v} value={v}>
                        {t(v)}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={t("Amount")}
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) =>
                      setPayments(
                        payments.map((v, j) =>
                          i === j ? { ...v, amount: +e.target.value } : v,
                        ),
                      )
                    }
                  />
                  <button
                    className="icon-button"
                    onClick={() =>
                      setPayments(payments.filter((_, j) => j !== i))
                    }
                    aria-label={t("Remove")}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <Button
                variant="text"
                onClick={() =>
                  setPayments([...payments, { method: "cash", amount: 0 }])
                }
              >
                <Plus size={15} />
                {t("Payment method")}
              </Button>
            </div>
            {quote && (
              <div className="quote-totals">
                {[
                  ["Subtotal", "subtotal"],
                  ["Discount", "discount"],
                  ["Old gold exchange", "exchange"],
                  ["Amount payable", "payable"],
                  ["Payment received", "received"],
                  ["Remaining balance", "balance"],
                ].map(([label, k]) => (
                  <div key={k} className={k === "payable" ? "grand" : ""}>
                    <span>{t(label)}</span>
                    <strong>{currency(quote.totals[k])}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="pos-buttons">
              <Button
                variant="text"
                disabled={!items.length || !values.customerId}
                onClick={async () => {
                  try {
                    await api("/records/drafts", {
                      method: "POST",
                      body: body(),
                    });
                    notify("Saved successfully");
                  } catch (e) {
                    notify(e.message, true);
                  }
                }}
              >
                {t("Save draft")}
              </Button>
              <Button
                variant="secondary"
                busy={busy}
                onClick={calculate}
                disabled={!items.length || !values.customerId}
              >
                <Calculator size={16} />
                {t("Calculate total")}
              </Button>
              <Button busy={busy} onClick={save} disabled={!quote}>
                <Check size={16} />
                {t("Save & print")}
              </Button>
            </div>
          </div>
        </section>
      </div>
      {modal && (
        <FormModal
          kind={modal}
          title="Customer"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
