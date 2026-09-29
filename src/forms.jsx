import React, { useState } from "react";
import { useApp } from "./context";
import { api } from "./api";
import { Modal, Field, Button, useData, SearchBox } from "./components";
export const field = (key, label, type = "text", extra = {}) => ({
  key,
  label,
  type,
  ...extra,
});
const n = (k, l, extra = {}) => field(k, l, "number", extra),
  sel = (k, l, options) => field(k, l, "select", { options });
const customer = field("customerId", "Customer", "lookup", {
    kind: "customers",
    required: true,
  }),
  karigar = field("karigarId", "Karigars", "lookup", { kind: "karigars" }),
  note = field("notes", "Notes", "textarea");
export const forms = {
  customers: [
    field("name", "Name", "text", { required: true }),
    field("phone", "Phone"),
    field("address", "Address"),
    field("reference", "Reference"),
    n("openingBalance", "Opening balance", {
      default: 0,
      min: -1e9,
      unit: "PKR",
    }),
    n("creditLimit", "Credit limit", { default: 0, unit: "PKR" }),
    note,
  ],
  inventory: [
    field("name", "Name", "text", { required: true }),
    field("category", "Category", "text", { required: true }),
    sel("metal", "Metal", ["gold", "silver"]),
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    n("grossWeight", "Gross weight", { required: true, unit: "g" }),
    n("stoneWeight", "Stone weight", { default: 0, unit: "g" }),
    sel("makingMode", "Making mode", ["fixed", "perGram", "percent"]),
    n("making", "Making charge", { default: 0 }),
    sel("wastageMode", "Wastage mode", ["percent", "grams"]),
    n("wastage", "Wastage", { default: 0 }),
    n("stoneValue", "Stone value", { default: 0, unit: "PKR" }),
    n("cost", "Cost", { default: 0, unit: "PKR", owner: true }),
    field("location", "Location"),
    karigar,
    note,
    field("photos", "Photo", "photos"),
  ],
  karigars: [
    field("name", "Name", "text", { required: true }),
    field("phone", "Phone"),
    field("address", "Address"),
    field("skill", "Skill"),
    n("makingRate", "Making rate", { default: 0 }),
    n("openingWeight", "Opening weight", { default: 0, unit: "g" }),
    n("purity", "Purity", { default: 24, min: 1, max: 24 }),
    note,
  ],
  orders: [
    customer,
    field("name", "Name", "text", { required: true }),
    field("items", "Add item", "items"),
    field("measurements", "Measurements"),
    n("budget", "Budget", { default: 0, unit: "PKR" }),
    n("advance", "Advance", { default: 0, unit: "PKR" }),
    field("dueDate", "Due date", "date", { required: true }),
    karigar,
    sel("ratePolicy", "Rate policy", ["delivery", "booking", "locked"]),
    n("lockedRate", "Locked rate", { default: 0, unit: "PKR/g" }),
    field("paymentSchedule", "Payment schedule"),
    note,
    field("photos", "Photo", "photos"),
  ],
  repairs: [
    customer,
    field("name", "Name", "text", { required: true }),
    n("weight", "Weight", { required: true, unit: "g" }),
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    field("condition", "Condition", "text", { required: true }),
    n("serviceCharge", "Service charge", { default: 0, unit: "PKR" }),
    n("metalAdded", "Metal added", { default: 0, unit: "g" }),
    n("metalRemoved", "Metal removed", { default: 0, unit: "g" }),
    field("dueDate", "Due date", "date", { required: true }),
    field("assignee", "Assignee"),
    note,
    field("photos", "Photo", "photos"),
  ],
  cash: [
    field("name", "Name", "text", { required: true }),
    n("amount", "Amount", { required: true, min: -1e9, unit: "PKR" }),
    sel("method", "Payment method", ["cash", "bank", "card", "transfer"]),
    field("reason", "Reason", "textarea", { required: true }),
  ],
  expenses: [
    field("name", "Name", "text", { required: true }),
    n("amount", "Amount", { required: true, unit: "PKR" }),
    sel("method", "Method", ["cash", "bank", "card", "transfer"]),
    field("date", "Date", "date", {
      required: true,
      default: new Date().toISOString().slice(0, 10),
    }),
    note,
  ],
  "old-gold": [
    customer,
    field("name", "Name", "text", { required: true }),
    n("weight", "Weight", { required: true, unit: "g" }),
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    n("deductions", "Deductions", { default: 0, unit: "g" }),
    n("loss", "Testing loss", { default: 0, unit: "g", owner: true }),
    n("rate24", "24K rate", { required: true, unit: "PKR/g" }),
    sel("mode", "Purchase type", ["cash", "exchange"]),
    note,
  ],
  payment: [
    customer,
    n("amount", "Amount", { required: true, unit: "PKR" }),
    sel("method", "Payment method", ["cash", "bank", "card", "transfer"]),
    note,
  ],
  issue: [
    karigar,
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    n("weight", "Weight", { required: true, unit: "g" }),
    sel("sourceKind", "Source type", ["old-gold", "inventory"]),
    field("sourceId", "Source stock", "source", { required: true }),
    field("name", "Name", "text", { required: true }),
    field("jobId", "Job", "lookup", { kind: "orders" }),
    note,
  ],
  receive: [
    karigar,
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    n("finished", "Finished jewellery", { default: 0, unit: "g" }),
    n("scrap", "Scrap", { default: 0, unit: "g" }),
    n("remaining", "Remaining gold", { default: 0, unit: "g" }),
    n("wastage", "Wastage", { default: 0, unit: "g" }),
    field("name", "Name", "text", { required: true }),
    field("jobId", "Job", "lookup", { kind: "orders" }),
    note,
  ],
  amanat: [
    customer,
    sel("type", "Type", ["deposit", "return"]),
    n("weight", "Weight", { required: true, unit: "g" }),
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    note,
  ],
  reconciliation: [
    field("name", "Name", "text", { required: true }),
    n("physical", "Physical closing", { required: true, unit: "g" }),
    n("purity", "Purity", { default: 22, min: 1, max: 24 }),
    sel("metal", "Metal", ["gold", "silver"]),
    field("notes", "Reason", "textarea", { required: true }),
  ],
  branches: [
    field("name", "Name", "text", { required: true }),
    field("address", "Address"),
    field("phone", "Phone"),
  ],
  rates: [
    sel("conversion", "Conversion", ["automatic", "manual"]),
    n("rate22", "22K rate", { default: 0 }),
    n("rate21", "21K rate", { default: 0 }),
    n("rate18", "18K rate", { default: 0 }),
    n("rate24", "24K rate", { required: true }),
    n("silver", "Silver", { required: true }),
    sel("unit", "Type", ["gram", "tola"]),
    field("reason", "Reason", "textarea", { required: true }),
  ],
  profile: [
    field("name", "Shop name", "text", { required: true }),
    field("ownerName", "Owner name"),
    field("phone", "Phone"),
    field("email", "Email"),
    field("address", "Address"),
    field("city", "City"),
    field("registration", "Registration"),
    field("website", "Website"),
    field("footer", "Invoice footer"),
    field("bank", "Bank details"),
    field("terms", "Terms", "textarea"),
    sel("invoiceLanguage", "Invoice language", ["en", "ur", "bilingual"]),
    n("taxPercent", "Tax percent", { default: 0, max: 100 }),
    n("allowedWastage", "Allowed wastage", { default: 2, max: 100 }),
  ],
};
export function Lookup({ kind, value, onChange, required = false }) {
  const [query, setQuery] = useState(""),
    { t } = useApp(),
    { data } = useData(
      "/records/" + kind + "?limit=200&q=" + encodeURIComponent(query),
    );
  return (
    <div className="lookup">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("Search")}
        aria-label={t("Search")}
      />
      <select
        value={value || ""}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {data?.rows.map((r) => (
          <option key={r._id} value={r._id}>
            {r.data.name} · {r.key}
          </option>
        ))}
      </select>
    </div>
  );
}
function ItemList({ value = [], onChange }) {
  const { t } = useApp();
  return (
    <div className="order-items">
      {value.map((v, i) => (
        <div className="form-grid" key={i}>
          <Field label="Name">
            <input
              required
              value={v.description}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    i === j ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
            />
          </Field>
          {[
            ["targetWeight", "Target weight"],
            ["purity", "Purity"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input
                type="number"
                required
                min="0.001"
                step="0.001"
                value={v[k]}
                onChange={(e) =>
                  onChange(
                    value.map((x, j) =>
                      i === j ? { ...x, [k]: +e.target.value } : x,
                    ),
                  )
                }
              />
            </Field>
          ))}
          <Field label="Stone specification">
            <input
              value={v.stones}
              onChange={(e) =>
                onChange(
                  value.map((x, j) =>
                    i === j ? { ...x, stones: e.target.value } : x,
                  ),
                )
              }
            />
          </Field>
          <Button
            type="button"
            variant="text"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            {t("Remove")}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onChange([
            ...value,
            { description: "", targetWeight: 1, purity: 22, stones: "" },
          ])
        }
      >
        {t("Add item")}
      </Button>
    </div>
  );
}
export function DynamicFields({ fields, values, setValues }) {
  const { t, session, notify } = useApp();
  return (
    <div className="form-grid">
      {fields
        .filter((f) => !f.owner || session?.user.role === "owner")
        .map((f) => {
          const val = values[f.key] ?? "",
            change = (v) => setValues((x) => ({ ...x, [f.key]: v }));
          return (
            <div
              key={f.key}
              className={
                ["textarea", "items", "photos"].includes(f.type) ? "full" : ""
              }
            >
              <Field label={f.label} hint={f.unit}>
                {f.type === "select" ? (
                  <select value={val} onChange={(e) => change(e.target.value)}>
                    {f.options.map((x) => (
                      <option key={x} value={x}>
                        {t(x)}
                      </option>
                    ))}
                  </select>
                ) : f.type === "lookup" || f.type === "source" ? (
                  <Lookup
                    kind={
                      f.type === "source"
                        ? values.sourceKind || "old-gold"
                        : f.kind
                    }
                    value={val}
                    onChange={change}
                    required={
                      f.required ||
                      (f.key === "karigarId" &&
                        ["issue", "receive"].includes(values.type))
                    }
                  />
                ) : f.type === "items" ? (
                  <ItemList value={val || []} onChange={change} />
                ) : f.type === "photos" ? (
                  <>
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
                          change([...(val || []), r.id]);
                        } catch (e) {
                          notify(e.message, true);
                        }
                      }}
                    />
                    <div className="thumbs">
                      {(val || []).map((id) => (
                        <img
                          key={id}
                          src={"/api/v1/attachments/" + id}
                          alt={t("Photo")}
                        />
                      ))}
                    </div>
                  </>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={val}
                    required={f.required}
                    onChange={(e) => change(e.target.value)}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={val}
                    min={f.min ?? (f.type === "number" ? 0 : undefined)}
                    max={f.max}
                    step={f.type === "number" ? "0.001" : undefined}
                    required={f.required}
                    onChange={(e) =>
                      change(
                        f.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </Field>
            </div>
          );
        })}
    </div>
  );
}
export function FormModal({
  kind,
  title,
  onClose,
  onSaved,
  initial = {},
  editId,
}) {
  const { t, notify } = useApp(),
    fields = forms[kind],
    defaults = () =>
      Object.fromEntries(
        fields.map((f) => [
          f.key,
          f.default ??
            (f.type === "select"
              ? f.options[0]
              : f.type === "items"
                ? [{ description: "", targetWeight: 1, purity: 22, stones: "" }]
                : f.type === "photos"
                  ? []
                  : f.type === "number"
                    ? 0
                    : ""),
        ]),
      ),
    [values, setValues] = useState({ ...defaults(), ...initial }),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let path = "/records/" + kind,
        body = values;
      if (kind === "rates") {
        path = "/rates";
        body = { ...values, auto: values.conversion !== "manual" };
      }
      if (kind === "old-gold" || kind === "reconciliation") path = "/" + kind;
      if (kind === "payment") {
        path = "/payments";
        body = { ...values, idempotencyKey: crypto.randomUUID() };
      }
      if (["issue", "receive"].includes(kind)) {
        path = "/karigar-movements";
        body = { ...values, type: kind === "issue" ? "issue" : "receive" };
      }
      if (kind === "amanat") path = "/amanat";
      if (kind === "cash") path = "/cash-adjustments";
      if (editId) {
        path += "/" + editId;
        body = { data: values, reason };
      }
      await api(path, { method: editId ? "PATCH" : "POST", body });
      notify("Saved successfully");
      onSaved?.();
      if (e.nativeEvent.submitter?.value === "new") setValues(defaults());
      else onClose();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title || "Add"} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="modal-body">
          <DynamicFields
            fields={fields}
            values={values}
            setValues={setValues}
          />
          {editId && (
            <Field label="Reason">
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          )}
        </div>
        <div className="modal-foot">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          {!editId && (
            <Button variant="secondary" busy={busy} value="new">
              {t("Save & new")}
            </Button>
          )}
          <Button busy={busy}>{t("Save")}</Button>
        </div>
      </form>
    </Modal>
  );
}
