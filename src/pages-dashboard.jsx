import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  ShoppingBag,
  Gem,
  Hammer,
  Wallet,
  ArrowRight,
  Eye,
  EyeOff,
  Scale,
  Users,
  CalendarDays,
} from "lucide-react";
import { useApp } from "./context";
import { currency, grams, date } from "./api";
import {
  useData,
  Loading,
  ErrorState,
  Header,
  Button,
  Badge,
  Empty,
} from "./components";
import { FormModal } from "./forms";
export function Dashboard() {
  const { session, t } = useApp(),
    { data, error, loading, reload } = useData("/dashboard"),
    [modal, setModal] = useState(null),
    [secret, setSecret] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const s = data.stats;
  return (
    <>
      <Header title="Today’s overview" subtitle="Every gram, accounted for.">
        <span className="date-label">
          <CalendarDays size={16} />
          {date(new Date())}
        </span>
        <Link className="button" to="/app/pos">
          <Plus size={18} />
          {t("New sale")}
        </Link>
      </Header>
      <section className="rates-strip">
        <div className="rates-title">
          <span className="gold-icon">
            <Gem size={21} />
          </span>
          <strong>{t("Metal rates")}</strong>
          <small>PKR / g</small>
        </div>
        {[24, 22, 21, 18, "silver"].map((k) => (
          <div className="rate" key={k}>
            <span>{k === "silver" ? t("Silver") : k + "K " + t("Gold")}</span>
            <strong>
              {data.rates[k]
                ? (data.rates[k] / 100).toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })
                : "—"}
            </strong>
          </div>
        ))}
        {session.user.role === "owner" && (
          <button className="text-link" onClick={() => setModal("rates")}>
            {t("Update rates")}
            <ArrowUpRight size={15} />
          </button>
        )}
      </section>
      <div className="stats-grid">
        {[
          [
            "Today’s sales",
            currency(s.salesToday),
            t("Payment received") + ": " + currency(s.paymentsToday),
            ShoppingBag,
            "primary",
          ],
          [
            "Gold in shop",
            grams(s.goldInShopMg),
            s.inventoryCount + " " + t("Available jewellery"),
            Gem,
            "",
          ],
          [
            "With karigars",
            grams(s.karigarPureMg),
            t("Pure gold equivalent"),
            Hammer,
            "",
          ],
          [
            "Customer dues",
            currency(s.receivables),
            t("Outstanding balance"),
            Wallet,
            "",
          ],
        ].map(([title, value, caption, Icon, cls]) => (
          <Link
            to={
              title === "Today’s sales"
                ? "/app/sales"
                : title === "Gold in shop"
                  ? "/app/inventory"
                  : title === "With karigars"
                    ? "/app/karigars"
                    : "/app/customers"
            }
            className={"stat-card " + cls}
            key={title}
          >
            <div className="stat-top">
              <span>{t(title)}</span>
              <Icon size={19} />
            </div>
            <strong>{secret ? "••••••" : value}</strong>
            <small>{caption}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel trend-panel">
          <div className="panel-head">
            <div>
              <h2>{t("Sales trend")}</h2>
              <small>PKR · {t("Sales & invoices")}</small>
            </div>
            <Link to="/app/reports" className="text-link">
              {t("Reports")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {data.trend.length ? (
            <div className="chart">
              <div className="chart-bars">
                {data.trend.map((r) => (
                  <div
                    key={r.date}
                    className="chart-column"
                    title={r.date + " · " + currency(r.total)}
                  >
                    <small>{Math.round(r.total / 100000)}k</small>
                    <div
                      style={{
                        height:
                          Math.max(
                            3,
                            (r.total /
                              Math.max(...data.trend.map((x) => x.total))) *
                              160,
                          ) + "px",
                      }}
                    />
                    <span>{r.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty
              title="No sales recorded yet"
              text="Set rates before creating your first sale."
            />
          )}
        </section>
        <section className="panel metal-summary">
          <div className="panel-head">
            <h2>{t("Overview")}</h2>
            <Scale size={19} />
          </div>
          {[
            ["Old gold", grams(s.oldGoldMg)],
            ["Customer amanat", grams(s.amanatMg)],
            ["Repair stock", grams(s.repairMg)],
            ["Cash balance", currency(s.cash)],
          ].map(([l, v]) => (
            <div className="summary-row" key={l}>
              <span>{t(l)}</span>
              <strong>{secret ? "••••" : v}</strong>
            </div>
          ))}
          {session.user.role === "owner" && (
            <button
              className="text-link secret-toggle"
              onClick={() => setSecret(!secret)}
            >
              {secret ? <Eye size={16} /> : <EyeOff size={16} />}{" "}
              {t(secret ? "Show sensitive figures" : "Hide sensitive figures")}
            </button>
          )}
        </section>
      </div>
      <section className="quick-actions">
        <h3>{t("Quick actions")}</h3>
        {[
          ["inventory", "Add item", Gem],
          ["payment", "Receive payment", Wallet],
          ["old-gold", "Old gold", Scale],
          ["issue", "Issue gold", Hammer],
          ["orders", "New order", Plus],
          ["repairs", "New repair", Plus],
        ].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setModal(key)}>
            <Icon size={19} />
            {t(label)}
            <ArrowRight size={14} />
          </button>
        ))}
      </section>
      <div className="dashboard-columns bottom">
        <section className="panel">
          <div className="panel-head">
            <h2>{t("Recent invoices")}</h2>
            <Link to="/app/sales" className="text-link">
              {t("View all")}
              <ArrowRight size={16} />
            </Link>
          </div>
          {data.recentSales.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Reference")}</th>
                    <th>{t("Customer")}</th>
                    <th>{t("Amount")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <Link to={"/app/sales/" + r._id}>{r.number}</Link>
                        <small>{date(r.createdAt)}</small>
                      </td>
                      <td>{r.customer.name}</td>
                      <td className="number">{currency(r.totals.total)}</td>
                      <td>
                        <Badge>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="No sales recorded yet" />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>{t("Due soon")}</h2>
            <span className="count">{s.pendingOrders + s.pendingRepairs}</span>
          </div>
          {data.orders.concat(data.repairs).length ? (
            data.orders
              .concat(data.repairs)
              .slice(0, 4)
              .map((r) => (
                <Link
                  to={"/app/" + (r.kind === "orders" ? "orders" : "repairs")}
                  className="due-row"
                  key={r._id}
                >
                  <span className="due-icon">
                    {r.kind === "orders" ? (
                      <Gem size={18} />
                    ) : (
                      <Hammer size={18} />
                    )}
                  </span>
                  <div>
                    <strong>{r.data.name}</strong>
                    <small>
                      {r.key} · {date(r.data.dueDate)}
                    </small>
                  </div>
                  <Badge>{r.data.status}</Badge>
                </Link>
              ))
          ) : (
            <Empty />
          )}
        </section>
      </div>
      {modal && (
        <FormModal
          kind={modal}
          title={modal === "rates" ? "Update rates" : "Add"}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
    </>
  );
}
