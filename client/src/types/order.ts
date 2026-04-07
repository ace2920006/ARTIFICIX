export type OrderStatus =
  | "pending"
  | "accepted"
  | "packed"
  | "shipped"
  | "delivered";

export type Channel = "website" | "admin" | "whatsapp" | "pos";

export type LineItem = {
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  fragile?: boolean;
};

export type StatusEvent = {
  status: string;
  at: string;
  note?: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  channel: Channel;
  sourceMeta?: Record<string, unknown>;
  customerName: string;
  phone: string;
  shippingAddress: string;
  city: string;
  lineItems: LineItem[];
  subtotal: number;
  currency: string;
  total: number;
  status: OrderStatus;
  statusHistory: StatusEvent[];
  assignedWarehouse: string | null;
  priorityShipping: boolean;
  specialHandling: boolean;
  routingReasons: string[];
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsSummary = {
  counts: {
    total: number;
    byStatus: Record<string, number>;
    processing: number;
  };
  revenue: { allTime: number; delivered: number };
  ordersToday: number;
  ordersPerHour: { hour: number; count: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
};
