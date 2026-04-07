import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { Channel, LineItem } from "../types/order";

type FormState = {
  customerName: string;
  phone: string;
  shippingAddress: string;
  city: string;
  productName: string;
  qty: number;
  unitPrice: number;
  fragile: boolean;
};

const empty: FormState = {
  customerName: "",
  phone: "",
  shippingAddress: "",
  city: "",
  productName: "",
  qty: 1,
  unitPrice: 999,
  fragile: false,
};

type WaAutoReply = {
  id: string;
  from: string;
  to: string;
  channel: string;
  orderNumber: string;
  trigger: "order_created" | "status_updated";
  body: string;
  waLink: string;
  at: string;
};

function lineFromForm(f: FormState): LineItem[] {
  return [
    {
      name: f.productName || "Product",
      qty: f.qty,
      unitPrice: f.unitPrice,
      fragile: f.fragile,
    },
  ];
}

export function IntakePage() {
  const [website, setWebsite] = useState(empty);
  const [admin, setAdmin] = useState({ ...empty, productName: "Admin SKU" });
  const [wa, setWa] = useState({ ...empty, productName: "WA item" });
  const [waThread, setWaThread] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [seedCount, setSeedCount] = useState(12);
  const [waReplies, setWaReplies] = useState<WaAutoReply[]>([]);

  const loadWaReplies = useCallback(async () => {
    try {
      const data = await api<{ items: WaAutoReply[] }>(
        "/api/integrations/whatsapp/auto-replies"
      );
      setWaReplies(data.items);
    } catch {
      setWaReplies([]);
    }
  }, []);

  useEffect(() => {
    loadWaReplies();
  }, [loadWaReplies]);

  async function submit(
    channel: Channel,
    body: Record<string, unknown>
  ) {
    setBusy(channel);
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success("Order created", { description: `Channel: ${channel}` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitWhatsApp() {
    setBusy("whatsapp-api");
    try {
      await api("/api/integrations/whatsapp/mock", {
        method: "POST",
        body: JSON.stringify({
          customerName: wa.customerName,
          phone: wa.phone,
          shippingAddress: wa.shippingAddress,
          city: wa.city,
          threadId: waThread || undefined,
          lineItems: lineFromForm(wa),
        }),
      });
      toast.success("WhatsApp mock order ingested");
      await loadWaReplies();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateSamples() {
    setBusy("seed");
    try {
      await api("/api/orders/generate-samples", {
        method: "POST",
        body: JSON.stringify({ count: seedCount }),
      });
      toast.success("Samples generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Multi-channel intake</h1>
          <p className="muted">
            Website, admin manual entry, and WhatsApp mock — all stored in one
            schema.
          </p>
        </div>
        <div className="seed-box">
          <label className="inline">
            <span className="muted">Bulk demo</span>
            <input
              type="number"
              min={1}
              max={30}
              value={seedCount}
              onChange={(e) => setSeedCount(Number(e.target.value))}
              className="input narrow"
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={busy === "seed"}
            onClick={generateSamples}
          >
            Generate sample orders
          </button>
        </div>
      </div>

      <div className="intake-grid">
        <section className="panel">
          <h2>Website order</h2>
          <p className="muted small">
            Simulates checkout posting to{" "}
            <code className="mono">POST /api/orders</code> with{" "}
            <code>channel: &quot;website&quot;</code>.
          </p>
          <IntakeFields
            f={website}
            set={setWebsite}
            disabled={!!busy}
          />
          <button
            type="button"
            className="btn primary"
            disabled={!!busy}
            onClick={() =>
              submit("website", {
                channel: "website",
                customerName: website.customerName,
                phone: website.phone,
                shippingAddress: website.shippingAddress,
                city: website.city,
                lineItems: lineFromForm(website),
              })
            }
          >
            {busy === "website" ? "Submitting…" : "Place order"}
          </button>
        </section>

        <section className="panel">
          <h2>Admin manual entry</h2>
          <p className="muted small">
            Same API with <code>channel: &quot;admin&quot;</code>.
          </p>
          <IntakeFields f={admin} set={setAdmin} disabled={!!busy} />
          <button
            type="button"
            className="btn primary"
            disabled={!!busy}
            onClick={() =>
              submit("admin", {
                channel: "admin",
                customerName: admin.customerName,
                phone: admin.phone,
                shippingAddress: admin.shippingAddress,
                city: admin.city,
                lineItems: lineFromForm(admin),
              })
            }
          >
            {busy === "admin" ? "Submitting…" : "Create order"}
          </button>
        </section>

        <section className="panel">
          <h2>WhatsApp (mock API)</h2>
          <p className="muted small">
            <code>POST /api/integrations/whatsapp/mock</code> — ingests an order
            and triggers an automatic customer reply (mock). Real WhatsApp uses
            Meta Cloud API in production.
          </p>
          <label className="field">
            Thread id (optional)
            <input
              className="input"
              value={waThread}
              onChange={(e) => setWaThread(e.target.value)}
              disabled={!!busy}
              placeholder="e.g. thread-abc"
            />
          </label>
          <IntakeFields f={wa} set={setWa} disabled={!!busy} />
          <button
            type="button"
            className="btn primary"
            disabled={!!busy}
            onClick={submitWhatsApp}
          >
            {busy === "whatsapp-api" ? "Sending…" : "Ingest WhatsApp order"}
          </button>
        </section>
      </div>

      <section className="panel mt-2">
        <div className="page-head" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h2>WhatsApp auto-replies (mock log)</h2>
            <p className="muted small">
              Outbound messages are auto-generated for customer contacts with a
              ready WhatsApp send link. Status changes also trigger updates.
            </p>
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={loadWaReplies}
          >
            Refresh log
          </button>
        </div>
        <div className="reply-log">
          {waReplies.length === 0 && (
            <p className="muted">No auto-replies yet. Ingest a WhatsApp order above.</p>
          )}
          {waReplies.map((r) => (
            <div key={r.id} className="reply-row">
              <div className="muted small">
                {new Date(r.at).toLocaleString()} · {r.orderNumber} · {r.channel} · {r.from} to {r.to} · {r.trigger.replace(/_/g, " ")}
              </div>
              <div>{r.body}</div>
              <a className="link small" href={r.waLink} target="_blank" rel="noreferrer">
                Open WhatsApp chat
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function IntakeFields({
  f,
  set,
  disabled,
}: {
  f: FormState;
  set: (v: FormState) => void;
  disabled: boolean;
}) {
  return (
    <>
      <label className="field">
        Customer name
        <input
          className="input"
          value={f.customerName}
          onChange={(e) => set({ ...f, customerName: e.target.value })}
          disabled={disabled}
          required
        />
      </label>
      <label className="field">
        Phone
        <input
          className="input"
          value={f.phone}
          onChange={(e) => set({ ...f, phone: e.target.value })}
          disabled={disabled}
        />
      </label>
      <label className="field">
        Shipping address
        <input
          className="input"
          value={f.shippingAddress}
          onChange={(e) => set({ ...f, shippingAddress: e.target.value })}
          disabled={disabled}
        />
      </label>
      <label className="field">
        City (try <strong>Nashik</strong> for Warehouse A)
        <input
          className="input"
          value={f.city}
          onChange={(e) => set({ ...f, city: e.target.value })}
          disabled={disabled}
        />
      </label>
      <label className="field">
        Product name
        <input
          className="input"
          value={f.productName}
          onChange={(e) => set({ ...f, productName: e.target.value })}
          disabled={disabled}
        />
      </label>
      <div className="row gap">
        <label className="field grow">
          Qty
          <input
            type="number"
            min={1}
            className="input"
            value={f.qty}
            onChange={(e) => set({ ...f, qty: Number(e.target.value) })}
            disabled={disabled}
          />
        </label>
        <label className="field grow">
          Unit price (₹)
          <input
            type="number"
            min={0}
            className="input"
            value={f.unitPrice}
            onChange={(e) => set({ ...f, unitPrice: Number(e.target.value) })}
            disabled={disabled}
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={f.fragile}
          onChange={(e) => set({ ...f, fragile: e.target.checked })}
          disabled={disabled}
        />
        Fragile item
      </label>
    </>
  );
}
