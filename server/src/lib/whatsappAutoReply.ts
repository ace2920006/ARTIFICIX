import type { Server } from "socket.io";
import type { Channel, OrderStatus } from "../models/Order.js";

const MAX = 100;

export type WhatsAppAutoReplyRecord = {
  id: string;
  from: string;
  to: string;
  customerName: string;
  orderNumber: string;
  orderId?: string;
  channel: Channel;
  trigger: "order_created" | "status_updated";
  body: string;
  waLink: string;
  at: string;
  mode: "mock";
};

const store: WhatsAppAutoReplyRecord[] = [];

function isEnabled(): boolean {
  return process.env.WHATSAPP_AUTO_REPLY_ENABLED !== "false";
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits || raw;
}

function adminPhone(): string {
  const configured = process.env.WHATSAPP_ADMIN_NUMBER?.trim();
  return normalizePhone(configured || "9209818840");
}

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "received",
  accepted: "accepted",
  packed: "packed",
  shipped: "shipped",
  delivered: "delivered",
};

function firstName(name: string): string {
  const n = name.trim().split(/\s+/)[0];
  return n || "there";
}

export function listWhatsAppAutoReplies(limit = 40): WhatsAppAutoReplyRecord[] {
  return store.slice(0, limit);
}

/**
 * Simulates WhatsApp Business API outbound messages. In production, replace the
 * log + socket emit with Meta Cloud API `POST /messages`.
 */
export function maybeSendWhatsAppAutoReply(
  io: Server,
  ctx: {
    channel: Channel;
    orderId: string;
    orderNumber: string;
    phone: string;
    customerName: string;
    total: number;
  },
  kind: "order_created" | "status_updated",
  nextStatus?: OrderStatus
): WhatsAppAutoReplyRecord | null {
  if (!isEnabled()) return null;
  if (!ctx.phone?.trim()) return null;
  const recipient = normalizePhone(ctx.phone);

  let body: string;
  if (kind === "order_created") {
    body = `Hi ${firstName(ctx.customerName)}, thanks for your order on WhatsApp! Order ${ctx.orderNumber} is confirmed. Total ${formatInr(ctx.total)}. We'll message you here when the status updates.`;
  } else {
    const label = nextStatus ? STATUS_LABEL[nextStatus] : "updated";
    body = `Hi ${firstName(ctx.customerName)}, your order ${ctx.orderNumber} is now ${label}. Reply here if you need help.`;
  }

  const record: WhatsAppAutoReplyRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    from: adminPhone(),
    to: recipient,
    customerName: ctx.customerName,
    orderNumber: ctx.orderNumber,
    orderId: ctx.orderId,
    channel: ctx.channel,
    trigger: kind === "order_created" ? "order_created" : "status_updated",
    body,
    waLink: `https://wa.me/${recipient}?text=${encodeURIComponent(body)}`,
    at: new Date().toISOString(),
    mode: "mock",
  };
  store.unshift(record);
  if (store.length > MAX) store.pop();
  console.log(`[WhatsApp auto-reply mock] ${record.from} -> ${record.to}: ${body}`);
  io.emit("whatsapp:reply", record);
  return record;
}
