import React, { useEffect, useRef, useState } from "react";
import { X, LoaderCircle, Search } from "lucide-react";
import { useApp } from "./context";
import { api } from "./api";
export function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api(path)
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(e);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  return {
    data,
    error,
    loading,
    reload: () => setVersion((v) => v + 1),
    setData,
  };
}
export function Button({ children, variant = "", busy = false, ...props }) {
  return (
    <button
      className={"button " + variant}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Badge({ children }) {
  const { t } = useApp();
  return (
    <span className={"badge " + String(children).replaceAll(" ", "-")}>
      {t(children)}
    </span>
  );
}
export function Empty({
  title = "No records yet",
  text = "Add your first record to get started.",
  action,
}) {
  const { t } = useApp();
  return (
    <div className="empty">
      <div className="empty-icon">◇</div>
      <h3>{t(title)}</h3>
      <p>{t(text)}</p>
      {action}
    </div>
  );
}
export function Loading() {
  const { t } = useApp();
  return (
    <div className="loading">
      <LoaderCircle size={22} className="spin" />
      {t("Loading…")}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  const { t } = useApp();
  return (
    <div className="error-state" role="alert">
      <h3>{t(error?.message || "Something went wrong")}</h3>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          {t("Try again")}
        </Button>
      )}
    </div>
  );
}
export function Header({ title, subtitle, children }) {
  const { t } = useApp();
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">JEWELLER OS</div>
        <h1>{t(title)}</h1>
        {subtitle && <p>{t(subtitle)}</p>}
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(),
    { t } = useApp();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const listener = (e) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", listener);
    return () => el.removeEventListener("cancel", listener);
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{t(title)}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close")}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children, hint }) {
  const { t } = useApp();
  return (
    <label className="field">
      <span>{t(label)}</span>
      {children}
      {hint && <small>{t(hint)}</small>}
    </label>
  );
}
export function SearchBox({ value, onChange, placeholder = "Search" }) {
  const { t } = useApp();
  return (
    <div className="searchbox">
      <Search size={17} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholder)}
        aria-label={t(placeholder)}
      />
    </div>
  );
}
export function Confirm({ title = "Confirm", onClose, onConfirm, children }) {
  const { t, notify } = useApp(),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onConfirm(reason);
            onClose();
          } catch (e) {
            notify(e.message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          {children}
          <Field label="Reason">
            <textarea
              value={reason}
              required
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-foot">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button busy={busy}>{t("Confirm")}</Button>
        </div>
      </form>
    </Modal>
  );
}
export function Details({ rows }) {
  const { t } = useApp();
  return (
    <dl className="details">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{t(k)}</dt>
          <dd>{v ?? "—"}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
