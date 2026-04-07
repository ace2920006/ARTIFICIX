import { Router } from "express";
import type { Server } from "socket.io";
import { Order, ORDER_STATUSES, type OrderStatus, CHANNELS, type Channel } from "../models/Order.js";
import { applyRoutingRules } from "../lib/routing.js";
import { generateOrderNumber } from "../lib/orderNumber.js";
import { notifyOrderCreated, notifyOrderUpdated } from "../lib/notifications.js";
import { maybeSendWhatsAppAutoReply } from "../lib/whatsappAutoReply.js";

const STATUS_ORDER: OrderStatus[] = [...ORDER_STATUSES];

function nextStatus(current: OrderStatus): OrderStatus | null {
  const i = STATUS_ORDER.indexOf(current);
  if (i < 0 || i >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[i + 1]!;
}

function computeTotals(
  lineItems: { qty: number; unitPrice: number }[]
): { subtotal: number; total: number } {
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  return { subtotal, total: subtotal };
}

export function createOrdersRouter(io: Server) {
  const r = Router();

  r.post("/preview-routing", (req, res) => {
    try {
      const { city, lineItems } = req.body as {
        city?: string;
        lineItems?: { qty: number; unitPrice: number; fragile?: boolean }[];
      };
      const items = Array.isArray(lineItems) ? lineItems : [];
      const subtotal = items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
      const routing = applyRoutingRules({
        city,
        total: subtotal,
        lineItems: items.map((li) => ({
          name: "preview",
          qty: li.qty,
          unitPrice: li.unitPrice,
          fragile: li.fragile,
        })),
      });
      res.json({ subtotal, total: subtotal, routing });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  r.post("/", async (req, res) => {
    try {
      const body = req.body as {
        channel?: string;
        sourceMeta?: Record<string, unknown>;
        customerName?: string;
        phone?: string;
        shippingAddress?: string;
        city?: string;
        lineItems?: {
          productId?: string;
          name: string;
          qty: number;
          unitPrice: number;
          fragile?: boolean;
        }[];
      };

      const channel = body.channel as Channel | undefined;
      if (!channel || !CHANNELS.includes(channel)) {
        res.status(400).json({ error: "Invalid or missing channel" });
        return;
      }
      if (
        !body.customerName ||
        !body.phone ||
        !body.shippingAddress ||
        !body.lineItems?.length
      ) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const { subtotal, total } = computeTotals(body.lineItems);
      const routing = applyRoutingRules({
        city: body.city,
        total,
        lineItems: body.lineItems,
      });

      const orderNumber = generateOrderNumber();
      const now = new Date();
      const order = await Order.create({
        orderNumber,
        channel,
        sourceMeta: body.sourceMeta,
        customerName: body.customerName,
        phone: body.phone,
        shippingAddress: body.shippingAddress,
        city: body.city ?? "",
        lineItems: body.lineItems,
        subtotal,
        total,
        status: "pending",
        statusHistory: [{ status: "pending", at: now, note: "Order placed" }],
        assignedWarehouse: routing.assignedWarehouse,
        priorityShipping: routing.priorityShipping,
        specialHandling: routing.specialHandling,
        routingReasons: routing.routingReasons,
      });

      notifyOrderCreated(String(order._id), order.orderNumber);
      io.emit("order:created", { orderId: String(order._id), orderNumber: order.orderNumber });
      maybeSendWhatsAppAutoReply(
        io,
        {
          channel: order.channel as Channel,
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          phone: order.phone,
          customerName: order.customerName,
          total: order.total,
        },
        "order_created"
      );
      res.status(201).json(order);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  r.get("/", async (req, res) => {
    try {
      const { status, channel, from, to } = req.query;
      const q: Record<string, unknown> = {};
      if (typeof status === "string" && status) q.status = status;
      if (typeof channel === "string" && channel) q.channel = channel;
      if (typeof from === "string" || typeof to === "string") {
        q.createdAt = {};
        if (typeof from === "string" && from)
          (q.createdAt as Record<string, Date>).$gte = new Date(from);
        if (typeof to === "string" && to)
          (q.createdAt as Record<string, Date>).$lte = new Date(to);
      }
      const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).lean();
      res.json(orders);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  r.get("/lookup/:orderNumber", async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  });

  r.get("/:id", async (req, res) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(order);
  });

  r.patch("/:id/status", async (req, res) => {
    try {
      const { status: requested } = req.body as { status?: OrderStatus; note?: string };
      const order = await Order.findById(req.params.id);
      if (!order) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (!requested || !ORDER_STATUSES.includes(requested)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const expectedNext = nextStatus(order.status as OrderStatus);
      if (requested !== expectedNext) {
        res.status(400).json({
          error: `Can only advance to ${expectedNext ?? "none (terminal)"}`,
        });
        return;
      }
      order.status = requested;
      order.statusHistory.push({
        status: requested,
        at: new Date(),
        note: (req.body as { note?: string }).note,
      });
      await order.save();
      notifyOrderUpdated(String(order._id), order.orderNumber, `Status → ${requested}`);
      io.emit("order:updated", { orderId: String(order._id), orderNumber: order.orderNumber });
      maybeSendWhatsAppAutoReply(
        io,
        {
          channel: order.channel as Channel,
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          phone: order.phone,
          customerName: order.customerName,
          total: order.total,
        },
        "status_updated",
        requested
      );
      res.json(order);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  r.post("/generate-samples", async (req, res) => {
    try {
      const count = Math.min(30, Math.max(1, Number((req.body as { count?: number })?.count) || 10));
      const cities = ["Mumbai", "Pune", "Nashik", "Delhi"];
      const products = [
        { name: "Ceramic Vase", fragile: true },
        { name: "Notebook", fragile: false },
        { name: "Glass Bowl", fragile: true },
        { name: "USB Cable", fragile: false },
      ];
      const channels: Channel[] = ["website", "admin", "whatsapp", "pos"];
      const created = [];
      for (let i = 0; i < count; i++) {
        const city = cities[i % cities.length]!;
        const ch = channels[i % channels.length]!;
        const p = products[i % products.length]!;
        const qty = (i % 3) + 1;
        const unitPrice = 800 + i * 150;
        const lineItems = [
          {
            name: p.name,
            qty,
            unitPrice,
            fragile: p.fragile,
          },
        ];
        const { subtotal, total } = computeTotals(lineItems);
        const routing = applyRoutingRules({ city, total, lineItems });
        const orderNumber = generateOrderNumber();
        const statusIdx = i % ORDER_STATUSES.length;
        const status = ORDER_STATUSES[statusIdx]!;
        const history = [];
        for (let s = 0; s <= statusIdx; s++) {
          const st = ORDER_STATUSES[s]!;
          history.push({
            status: st,
            at: new Date(Date.now() - (statusIdx - s) * 3600000),
            note: s === 0 ? "Order placed" : undefined,
          });
        }
        const doc = await Order.create({
          orderNumber,
          channel: ch,
          customerName: `Customer ${i + 1}`,
          phone: `98${String(10000000 + i).slice(0, 8)}`,
          shippingAddress: `${i + 1} Sample Street`,
          city,
          lineItems,
          subtotal,
          total,
          status,
          statusHistory: history,
          assignedWarehouse: routing.assignedWarehouse,
          priorityShipping: routing.priorityShipping,
          specialHandling: routing.specialHandling,
          routingReasons: routing.routingReasons,
        });
        created.push(doc);
      }
      io.emit("orders:seeded", { count: created.length });
      res.json({ created: created.length });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  return r;
}
