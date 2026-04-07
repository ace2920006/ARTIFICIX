import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { formatInr } from "../lib/format";
import type { AnalyticsSummary } from "../types/order";

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await api<AnalyticsSummary>("/api/analytics/summary");
      setData(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="page">
        <div className="banner error">{error}</div>
        <button type="button" className="btn secondary" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <p className="muted">Loading analytics…</p>
      </div>
    );
  }

  const hourData = data.ordersPerHour.map((h) => ({
    label: `${h.hour}:00`,
    orders: h.count,
  }));

  const top = [...data.topProducts]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const maxRev = top[0]?.revenue ?? 1;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p className="muted">
            Orders per hour (last 24h window in DB), revenue, and top products.
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <section className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">All-time revenue</div>
          <div className="kpi-value">{formatInr(data.revenue.allTime)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Delivered revenue</div>
          <div className="kpi-value accent-ok">
            {formatInr(data.revenue.delivered)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Orders today</div>
          <div className="kpi-value">{data.ordersToday}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">In processing</div>
          <div className="kpi-value accent-blue">{data.counts.processing}</div>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="panel chart-panel">
          <h2>Orders per hour (last 24h)</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8b98a8", fontSize: 10 }}
                  interval={3}
                />
                <YAxis allowDecimals={false} tick={{ fill: "#8b98a8" }} />
                <Tooltip
                  contentStyle={{
                    background: "#111820",
                    border: "1px solid #2a3344",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="orders" fill="#5b8cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2>Top products</h2>
          <div className="top-list">
            {top.length === 0 && (
              <p className="muted">No product data yet.</p>
            )}
            {top.map((p) => (
              <div key={p.name} className="top-row">
                <div className="top-meta">
                  <div className="top-name">{p.name}</div>
                  <div className="muted small">
                    {p.qty} units · {formatInr(p.revenue)}
                  </div>
                </div>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
