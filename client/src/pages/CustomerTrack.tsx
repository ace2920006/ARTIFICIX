import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { formatDate, formatInr } from "../lib/format";
import type { Order, OrderStatus } from "../types/order";

const LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function CustomerTrack() {
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setOrder(null);
    try {
      const o = await api<Order>(`/api/orders/lookup/${encodeURIComponent(q.trim())}`);
      setOrder(o);
    } catch {
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Track your order</h1>
      <p className="muted">
        Enter the order number (e.g. <span className="mono">ORD-…</span>) from
        your confirmation.
      </p>
      <form onSubmit={lookup} className="row gap wrap">
        <input
          className="input grow"
          placeholder="Order number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {order && (
        <section className="panel mt-2">
          <div className="row spread">
            <div>
              <h2 className="mono">{order.orderNumber}</h2>
              <p className="muted">{order.customerName}</p>
            </div>
            <span className={`status large status-${order.status}`}>
              {LABEL[order.status]}
            </span>
          </div>
          <p className="mt-1">
            Total: <strong>{formatInr(order.total)}</strong>
          </p>
          <h3 className="mt-2">Timeline</h3>
          <ol className="timeline compact">
            {order.statusHistory.map((ev, i) => (
              <li key={i} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <span className={`status status-${ev.status}`}>
                    {LABEL[ev.status as OrderStatus] ?? ev.status}
                  </span>
                  <div className="muted small">{formatDate(ev.at)}</div>
                </div>
              </li>
            ))}
          </ol>
          <Link className="link mt-1" to={`/orders/${order._id}`}>
            Staff view →
          </Link>
        </section>
      )}
    </div>
  );
}
