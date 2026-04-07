import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "packed",
  "shipped",
  "delivered",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CHANNELS = ["website", "admin", "whatsapp", "pos"] as const;
export type Channel = (typeof CHANNELS)[number];

const lineItemSchema = new mongoose.Schema(
  {
    productId: { type: String },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    fragile: { type: Boolean, default: false },
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    channel: {
      type: String,
      required: true,
      enum: CHANNELS,
      index: true,
    },
    sourceMeta: { type: mongoose.Schema.Types.Mixed },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    city: { type: String, default: "" },
    lineItems: { type: [lineItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    total: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    statusHistory: { type: [statusEventSchema], default: [] },
    assignedWarehouse: { type: String, default: null },
    priorityShipping: { type: Boolean, default: false },
    specialHandling: { type: Boolean, default: false },
    routingReasons: { type: [String], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, channel: 1 });

export const Order = mongoose.model("Order", orderSchema);
