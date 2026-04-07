import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { formatDate, formatInr } from "../lib/format";
import type { Order, OrderStatus } from "../types/order";

const ORDER: OrderStatus[] = [
  "pending",
  "accepted",
  "packed",
  "shipped",
  "delivered",
];

const LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const o = await api<Order>(`/api/orders/${id}`);
      setOrder(o);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Not found");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function advance() {
    if (!order) return;
    const idx = ORDER.indexOf(order.status);
    const next = ORDER[idx + 1];
    if (!next) {
      toast.message("Already delivered");
      return;
    }
    setAdvancing(true);
    try {
      const updated = await api<Order>(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setOrder(updated);
      toast.success(`Status → ${LABEL[next]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <p>Order not found.</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  const idx = ORDER.indexOf(order.status);
  const canAdvance = idx < ORDER.length - 1;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link className="link back" to="/">
            ← Dashboard
          </Link>
          <h1 className="mt-1">{order.orderNumber}</h1>
          <p className="muted">
            {order.customerName} ·{" "}
            <span className={`badge ch-${order.channel}`}>{order.channel}</span>
          </p>
        </div>
        <div className="row gap align-start">
          <span className={`status large status-${order.status}`}>
            {LABEL[order.status]}
          </span>
          {canAdvance && (
            <button
              type="button"
              className="btn primary"
              disabled={advancing}
              onClick={advance}
            >
              {advancing
                ? "Updating…"
                : `Advance to ${LABEL[ORDER[idx + 1]!]}`}
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Smart routing</h2>
          <ul className="reason-list">
            {order.routingReasons.length === 0 && (
              <li className="muted">No special routing rules applied.</li>
            )}
            {order.routingReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="badge-row">
            {order.assignedWarehouse && (
              <span className="tag">{order.assignedWarehouse}</span>
            )}
            {order.priorityShipping && (
              <span className="tag warn">Priority shipping</span>
            )}
            {order.specialHandling && (
              <span className="tag subtle">Special handling</span>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Line items</h2>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Fragile</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map((li, i) => (
                <tr key={i}>
                  <td>{li.name}</td>
                  <td>{li.qty}</td>
                  <td>{formatInr(li.unitPrice)}</td>
                  <td>{li.fragile ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <span>Total</span>
            <strong>{formatInr(order.total)}</strong>
          </div>
        </section>

        <section className="panel timeline-panel">
          <h2>Status timeline</h2>
          <ol className="timeline">
            {order.statusHistory.map((ev, i) => (
              <li key={i} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <div className="timeline-title">
                    <span className={`status status-${ev.status}`}>
                      {LABEL[ev.status as OrderStatus] ?? ev.status}
                    </span>
                  </div>
                  <div className="muted small">{formatDate(ev.at)}</div>
                  {ev.note && <div className="timeline-note">{ev.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <h2>Shipping</h2>
          <p>{order.shippingAddress}</p>
          <p className="muted">{order.city}</p>
          <p>{order.phone}</p>
        </section>
      </div>
    </div>
  );
}
