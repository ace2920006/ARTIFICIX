import { Router } from "express";
import type { Server } from "socket.io";
import { Order } from "../models/Order.js";
import { applyRoutingRules } from "../lib/routing.js";
import { generateOrderNumber } from "../lib/orderNumber.js";
import { notifyOrderCreated } from "../lib/notifications.js";
import { listWhatsAppAutoReplies, maybeSendWhatsAppAutoReply } from "../lib/whatsappAutoReply.js";

export function createIntegrationsRouter(io: Server) {
  const r = Router();

  r.get("/whatsapp/auto-replies", (_req, res) => {
    res.json({ items: listWhatsAppAutoReplies(50) });
  });

  r.post("/whatsapp/mock", async (req, res) => {
    try {
      const body = req.body as {
        customerName?: string;
        phone?: string;
        shippingAddress?: string;
        city?: string;
        lineItems?: { name: string; qty: number; unitPrice: number; fragile?: boolean }[];
        threadId?: string;
      };
      if (
        !body.customerName ||
        !body.phone ||
        !body.shippingAddress ||
        !body.lineItems?.length
      ) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      const subtotal = body.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
      const total = subtotal;
      const routing = applyRoutingRules({
        city: body.city,
        total,
        lineItems: body.lineItems,
      });
      const orderNumber = generateOrderNumber();
      const now = new Date();
      const order = await Order.create({
        orderNumber,
        channel: "whatsapp",
        sourceMeta: { threadId: body.threadId ?? `WA-${Date.now()}`, mock: true },
        customerName: body.customerName,
        phone: body.phone,
        shippingAddress: body.shippingAddress,
        city: body.city ?? "",
        lineItems: body.lineItems.map((li) => ({
          name: li.name,
          qty: li.qty,
          unitPrice: li.unitPrice,
          fragile: li.fragile,
        })),
        subtotal,
        total,
        status: "pending",
        statusHistory: [{ status: "pending", at: now, note: "WhatsApp (mock) order" }],
        assignedWarehouse: routing.assignedWarehouse,
        priorityShipping: routing.priorityShipping,
        specialHandling: routing.specialHandling,
        routingReasons: routing.routingReasons,
      });
      notifyOrderCreated(String(order._id), order.orderNumber);
      io.emit("order:created", { orderId: String(order._id), orderNumber: order.orderNumber });
      const autoReply = maybeSendWhatsAppAutoReply(
        io,
        {
          channel: "whatsapp",
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          phone: order.phone,
          customerName: order.customerName,
          total: order.total,
        },
        "order_created"
      );
      res.status(201).json({
        messageId: `wamid.mock.${order._id}`,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        autoReply: autoReply
          ? { id: autoReply.id, body: autoReply.body, at: autoReply.at }
          : null,
      });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  return r;
}
