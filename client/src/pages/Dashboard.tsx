import { useCallback, useEffect, useMemo, useState } from "react";
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

type DashboardTab = "orders" | "analytics" | "insights";

function OrdersSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={7}>
            <div className="skeleton-row">
              <span className="skeleton skeleton-pill" />
              <span className="skeleton skeleton-text" />
              <span className="skeleton skeleton-text" />
              <span className="skeleton skeleton-pill wide" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function MetricSkeleton() {
  return (
    <div className="kpi kpi-skeleton">
      <div className="skeleton skeleton-text small" />
      <div className="skeleton skeleton-text large" />
    </div>
  );
}

function InsightSkeletonCard() {
  return (
    <div className="panel insight-card skeleton-card">
      <div className="skeleton skeleton-pill" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text short" />
    </div>
  );
}

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DashboardTab>("orders");
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [hasSimulatedInsightsLoad, setHasSimulatedInsightsLoad] =
    useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Order[]>("/api/orders");
      setOrders(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t load your orders. Please try again."
      );
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

  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.channel] = (counts[o.channel] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  const smartAlerts = useMemo(() => {
    if (!orders.length) return [];
    const fragileOrders = orders.filter((o) =>
      o.lineItems.some((l) => l.fragile)
    );
    const priorityOrders = orders.filter((o) => o.priorityShipping);
    const pendingTooLong = orders.filter(
      (o) => o.status === "pending" || o.status === "accepted"
    );

    return [
      fragileOrders.length > 0 && {
        type: "Fragile shipments",
        message: `${fragileOrders.length} orders have fragile items. Auto-assign to trained agents and mark \"handle with care\".`,
      },
      priorityOrders.length > 0 && {
        type: "Priority deliveries",
        message: `${priorityOrders.length} high-priority orders are queued. Ensure they are assigned to the closest available agent.`,
      },
      pendingTooLong.length > 0 && {
        type: "Stuck in processing",
        message:
          "Some orders are stuck in pending/accepted. AI can auto-nudge agents or re-route to faster warehouses.",
      },
    ].filter(Boolean) as { type: string; message: string }[];
  }, [orders]);

  const aiInsights = useMemo(
    () => [
      {
        title: "Smart inventory alert",
        body: "Restock fast-moving SKUs in East hub within the next 48 hours to avoid stockouts during peak evenings.",
      },
      {
        title: "Auto-assignment win",
        body: "Auto-assigned 72% of last-mile deliveries to the nearest available agent, cutting average assignment time to 12 seconds.",
      },
      {
        title: "Delivery SLA at risk",
        body: "Orders created after 7 PM from the website channel are 1.6x more likely to breach SLA. Consider adding an extra evening rider.",
      },
    ],
    []
  );

  useEffect(() => {
    if (tab === "insights" && !hasSimulatedInsightsLoad) {
      setHasSimulatedInsightsLoad(true);
      setInsightsLoading(true);
      setInsightsError(null);
      const timer = setTimeout(() => {
        const shouldError = Math.random() < 0.4;
        if (shouldError) {
          setInsightsError(
            "We couldn’t load AI insights right now. Your deliveries are still safe—please try again in a moment."
          );
        }
        setInsightsLoading(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [tab, hasSimulatedInsightsLoad]);

  const retryInsights = () => {
    setInsightsLoading(true);
    setInsightsError(null);
    setTimeout(() => {
      setInsightsLoading(false);
    }, 700);
  };

  return (
    <div className="page landing">
      <section className="hero" id="hero">
        <div className="hero-copy">
          <h1>Smart delivery, zero stockouts</h1>
          <p className="muted">
            Smart inventory alerts and auto-assignment to delivery agents so you
            stop firefighting and start scaling fulfillment.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                toast.success("Request received", {
                  description:
                    "This is a demo. Imagine your inbox just got a warm lead.",
                })
              }
            >
              Get early access
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See live dashboard
            </button>
          </div>
          <div className="hero-meta">
            <span className="tag subtle">
              Smart inventory alerts · Auto agent assignment · AI insights
            </span>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel hero-metrics">
            <h3>Today at a glance</h3>
            <p className="muted small">
              Live snapshot from the control dashboard you&apos;re about to
              see.
            </p>
            <div className="hero-kpi-grid">
              {loading ? (
                <>
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                </>
              ) : (
                <>
                  <div className="kpi compact">
                    <div className="kpi-label">Active orders</div>
                    <div className="kpi-value">{total}</div>
                  </div>
                  <div className="kpi compact">
                    <div className="kpi-label">In processing</div>
                    <div className="kpi-value accent-blue">
                      {processing}
                    </div>
                  </div>
                  <div className="kpi compact">
                    <div className="kpi-label">Smart alerts</div>
                    <div className="kpi-value accent-warn">
                      {smartAlerts.length || "—"}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="hero-footnote small muted">
              No fake screenshots — this is the actual dashboard UI.
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid" id="problem">
        <div>
          <h2>The problem</h2>
          <p>
            Most operations teams juggle spreadsheets, chat groups, and phone
            calls just to keep deliveries moving. Inventory and last-mile are
            stitched together with hacks.
          </p>
        </div>
        <ul className="reason-list">
          <li>Stockouts discovered only when customers are already angry.</li>
          <li>Dispatchers manually matching every order to a delivery agent.</li>
          <li>No single source of truth across channels and warehouses.</li>
          <li>Zero visibility into where SLAs are quietly being broken.</li>
        </ul>
      </section>

      <section className="section-grid" id="solution">
        <div>
          <h2>The solution</h2>
          <p>
            A single control surface that watches inventory, predicts demand,
            and auto-assigns the right delivery agent in seconds — with AI
            insights that highlight what actually needs your attention.
          </p>
        </div>
        <div className="feature-columns">
          <div className="panel feature-card">
            <h3>Smart inventory alerts</h3>
            <p className="muted small">
              Set dynamic thresholds per SKU and warehouse. Get ahead of
              low-stock events instead of reacting after a surge.
            </p>
          </div>
          <div className="panel feature-card">
            <h3>Auto agent assignment</h3>
            <p className="muted small">
              Orders are auto-routed to the nearest available rider with the
              right vehicle and skills, no manual routing needed.
            </p>
          </div>
          <div className="panel feature-card">
            <h3>AI route & demand insights</h3>
            <p className="muted small">
              Spot patterns in delays, peak slots, and products so you can
              schedule riders and stock ahead of time.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <h2>Features built for busy ops teams</h2>
        <div className="feature-grid">
          <div className="panel feature-card">
            <h3>Multi-channel intake</h3>
            <p className="muted small">
              Website, POS, WhatsApp — all orders land in one queue with
              consistent SLAs.
            </p>
          </div>
          <div className="panel feature-card">
            <h3>Smart routing reasons</h3>
            <p className="muted small">
              Every auto-decision comes with human-readable reasons so trust
              stays high.
            </p>
          </div>
          <div className="panel feature-card">
            <h3>Exception alerts</h3>
            <p className="muted small">
              Flag delayed, fragile, or high-value orders and surface them in a
              focused queue.
            </p>
          </div>
          <div className="panel feature-card">
            <h3>Warehouse-aware inventory</h3>
            <p className="muted small">
              Per-hub stock visibility so assignments never go to an empty
              shelf.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="demo">
        <div className="section-header">
          <div>
            <h2>See the product in action</h2>
            <p className="muted">
              Below is the live demo dashboard. Switch between Orders,
              Analytics, and AI Insights to see how everything connects.
            </p>
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              document
                .getElementById("dashboard")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Jump to dashboard
          </button>
        </div>
      </section>

      <section className="section" id="testimonials">
        <h2>Teams we&apos;re designing for</h2>
        <div className="testimonial-grid">
          <article className="panel testimonial">
            <p>
              “Before this, our dispatch room was 5 chrome tabs and 3 WhatsApp
              groups. Now my team starts the day on one screen and actually
              leaves on time.”
            </p>
            <div className="testimonial-meta">
              <div className="avatar-pill">AK</div>
              <div>
                <div className="testimonial-name">Ananya Kapoor</div>
                <div className="muted small">
                  Head of Operations, UrbanGrocer
                </div>
              </div>
            </div>
          </article>
          <article className="panel testimonial">
            <p>
              “The smart inventory alerts caught a weekend stockout that would
              have cost us lakhs. The system pinged us before customers ever
              felt it.”
            </p>
            <div className="testimonial-meta">
              <div className="avatar-pill">RS</div>
              <div>
                <div className="testimonial-name">Rohan Singh</div>
                <div className="muted small">
                  Co-founder, FreshCrate D2C Foods
                </div>
              </div>
            </div>
          </article>
          <article className="panel testimonial">
            <p>
              “Auto assignment sounded scary. But the explainable routing
              reasons made my team comfortable — now they only step in for true
              exceptions.”
            </p>
            <div className="testimonial-meta">
              <div className="avatar-pill">LM</div>
              <div>
                <div className="testimonial-name">Lata Menon</div>
                <div className="muted small">
                  Logistics Lead, SwiftKart Marketplace
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section cta-band" id="cta">
        <div className="cta-content">
          <div>
            <h2>Ready to try a calmer control room?</h2>
            <p className="muted">
              We&apos;re onboarding a small group of design partners who want
              to co-build the future of inventory-aware delivery.
            </p>
          </div>
          <div className="cta-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                toast.info("Demo form coming soon", {
                  description: "For now this button is just here for vibes.",
                })
              }
            >
              Book a 20-min demo
            </button>
          </div>
        </div>
      </section>

      <section className="section dashboard-section" id="dashboard">
        <header className="section-header">
          <div>
            <h2>Control dashboard</h2>
            <p className="muted">
              This is the same dashboard your team would live in every day —
              with smart alerts, auto-assignment context, and AI insights.
            </p>
          </div>
          <div className="row gap">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                toast.warning("Order delayed", {
                  description:
                    "Mock alert only – no real orders are affected.",
                });
              }}
            >
              Trigger mock alert
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={load}
              disabled={loading}
            >
              Refresh data
            </button>
          </div>
        </header>

        {error && (
          <div className="banner error">
            <strong>We couldn&apos;t load orders.</strong>
            <p className="small">
              Your data source might be offline in this demo environment. Try
              again, or come back later — no real orders are at risk.
            </p>
            <button
              type="button"
              className="btn secondary"
              onClick={load}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        <nav className="dashboard-tabs" aria-label="Dashboard views">
          <button
            type="button"
            className={tab === "orders" ? "tab active" : "tab"}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
          <button
            type="button"
            className={tab === "analytics" ? "tab active" : "tab"}
            onClick={() => setTab("analytics")}
          >
            Analytics
          </button>
          <button
            type="button"
            className={tab === "insights" ? "tab active" : "tab"}
            onClick={() => setTab("insights")}
          >
            AI Insights
          </button>
        </nav>

        {tab === "orders" && (
          <>
            <section className="kpi-grid">
              {loading ? (
                <>
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                </>
              ) : (
                <>
                  <div className="kpi">
                    <div className="kpi-label">Total orders</div>
                    <div className="kpi-value">{total}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Pending</div>
                    <div className="kpi-value accent-warn">
                      {byStatus("pending")}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Processing</div>
                    <div className="kpi-value accent-blue">
                      {processing}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Shipped</div>
                    <div className="kpi-value">
                      {byStatus("shipped")}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Delivered</div>
                    <div className="kpi-value accent-ok">
                      {byStatus("delivered")}
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>Recent orders</h3>
                <p className="muted small">
                  Auto-assignment tags show how the system routed each order.
                </p>
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
                  {loading ? (
                    <OrdersSkeleton />
                  ) : (
                    <tbody>
                      {orders.slice(0, 25).map((o) => (
                        <tr key={o._id}>
                          <td>
                            <span className="mono">{o.orderNumber}</span>
                          </td>
                          <td>
                            <span className={`badge ch-${o.channel}`}>
                              {o.channel}
                            </span>
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
                              <span className="tag">
                                {o.assignedWarehouse}
                              </span>
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
                  )}
                </table>
              </div>
            </section>
          </>
        )}

        {tab === "analytics" && (
          <section className="analytics-layout">
            <div className="kpi-grid">
              {loading ? (
                <>
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                </>
              ) : (
                <>
                  <div className="kpi">
                    <div className="kpi-label">Orders in flight</div>
                    <div className="kpi-value accent-blue">
                      {processing + byStatus("shipped")}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Delivered share</div>
                    <div className="kpi-value accent-ok">
                      {total
                        ? `${Math.round(
                            (byStatus("delivered") / total) * 100
                          )}%`
                        : "—"}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Pending risk</div>
                    <div className="kpi-value accent-warn">
                      {total
                        ? `${Math.round(
                            (byStatus("pending") / total) * 100
                          )}%`
                        : "—"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="analytics-panels">
              <div className="panel">
                <h3>Orders by channel</h3>
                <p className="muted small">
                  See where demand is coming from so you can staff the right
                  intake channels.
                </p>
                <div className="channel-list">
                  {loading && (
                    <>
                      <div className="channel-row">
                        <span className="skeleton skeleton-pill" />
                        <span className="skeleton skeleton-text short" />
                      </div>
                      <div className="channel-row">
                        <span className="skeleton skeleton-pill" />
                        <span className="skeleton skeleton-text short" />
                      </div>
                    </>
                  )}
                  {!loading &&
                    (Object.keys(channelBreakdown).length ? (
                      Object.entries(channelBreakdown).map(
                        ([channel, count]) => (
                          <div key={channel} className="channel-row">
                            <span className={`badge ch-${channel}`}>
                              {channel}
                            </span>
                            <span className="muted small">
                              {count} order{count === 1 ? "" : "s"}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <p className="muted small">
                        No orders yet. Once data flows in, we&apos;ll break it
                        down by website, POS, WhatsApp, and admin.
                      </p>
                    ))}
                </div>
              </div>
              <div className="panel">
                <h3>Smart inventory alerts</h3>
                <p className="muted small">
                  Auto-generated flags help you catch problems before they
                  impact customers.
                </p>
                <div className="alert-list">
                  {loading && (
                    <>
                      <InsightSkeletonCard />
                      <InsightSkeletonCard />
                    </>
                  )}
                  {!loading && smartAlerts.length === 0 && (
                    <p className="muted small">
                      No active alerts. As your order and inventory data flows
                      in, we&apos;ll surface early warnings here.
                    </p>
                  )}
                  {!loading &&
                    smartAlerts.map((a) => (
                      <div key={a.type} className="alert-row">
                        <div className="alert-icon">!</div>
                        <div>
                          <div className="alert-title">{a.type}</div>
                          <p className="muted small">{a.message}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "insights" && (
          <section className="section">
            {insightsError && (
              <div className="banner error">
                <p className="small">{insightsError}</p>
                <button
                  type="button"
                  className="btn secondary mt-1"
                  onClick={retryInsights}
                  disabled={insightsLoading}
                >
                  Retry insights
                </button>
              </div>
            )}
            <div className="insights-grid">
              {insightsLoading && !insightsError && (
                <>
                  <InsightSkeletonCard />
                  <InsightSkeletonCard />
                  <InsightSkeletonCard />
                </>
              )}
              {!insightsLoading &&
                !insightsError &&
                aiInsights.map((insight) => (
                  <article
                    key={insight.title}
                    className="panel insight-card"
                  >
                    <div className="pill-label">AI suggestion</div>
                    <h3>{insight.title}</h3>
                    <p className="muted small">{insight.body}</p>
                  </article>
                ))}
            </div>
          </section>
        )}
      </section>

      <section className="section" id="about">
        <h2>Why we&apos;re building this</h2>
        <p>
          We&apos;ve sat inside control rooms where every late rider and missing
          SKU turned into a fire drill. The tools were either too generic or
          built for a different market altogether.
        </p>
        <p>
          This project is our attempt to design a calmer, more predictable
          operating system for delivery-first businesses in India — one that
          respects how scrappy teams actually work.
        </p>
        <div className="team-grid">
          <div className="team-card">
            <div className="avatar-pill">YD</div>
            <div>
              <div className="testimonial-name">You</div>
              <div className="muted small">
                Product, design, and the person who deeply cares about this
                space.
              </div>
            </div>
          </div>
          <div className="team-card">
            <div className="avatar-pill">ENG</div>
            <div>
              <div className="testimonial-name">Engineering partners</div>
              <div className="muted small">
                Backend, infra, and data folks who enjoy solving messy
                operational problems.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
