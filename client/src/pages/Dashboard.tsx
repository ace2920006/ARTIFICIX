import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { formatInr } from "../lib/format";
import type { Order, OrderStatus } from "../types/order";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Order[]>("/api/orders");
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byStatus = (s: OrderStatus) =>
    orders.filter((o) => o.status === s).length;
  const total = orders.length;
  const processing = byStatus("accepted") + byStatus("packed");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Central dashboard</h1>
          <p className="muted">
            Live KPIs and recent orders — open two tabs to see realtime toasts.
          </p>
        </div>
        <div className="row gap">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              toast.warning("Order delayed", {
                description: "Mock alert — no order affected.",
              });
            }}
          >
            Mock: delayed alert
          </button>
          <button type="button" className="btn secondary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

      <section className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total orders</div>
          <div className="kpi-value">{loading ? "—" : total}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value accent-warn">
            {loading ? "—" : byStatus("pending")}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Processing</div>
          <div className="kpi-value accent-blue">
            {loading ? "—" : processing}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Shipped</div>
          <div className="kpi-value">{loading ? "—" : byStatus("shipped")}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Delivered</div>
          <div className="kpi-value accent-ok">
            {loading ? "—" : byStatus("delivered")}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Recent orders</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Channel</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Routing</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                orders.slice(0, 25).map((o) => (
                  <tr key={o._id}>
                    <td>
                      <span className="mono">{o.orderNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ch-${o.channel}`}>{o.channel}</span>
                    </td>
                    <td>{o.customerName}</td>
                    <td>{formatInr(o.total)}</td>
                    <td>
                      <span className={`status status-${o.status}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="routing-cell">
                      {o.assignedWarehouse && (
                        <span className="tag">{o.assignedWarehouse}</span>
                      )}
                      {o.priorityShipping && (
                        <span className="tag warn">Priority</span>
                      )}
                      {o.specialHandling && (
                        <span className="tag subtle">Fragile</span>
                      )}
                    </td>
                    <td>
                      <Link className="link" to={`/orders/${o._id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
