export type NotificationEvent = {
  id: string;
  type: "order_created" | "order_updated" | "order_delayed" | "info";
  message: string;
  orderId?: string;
  at: Date;
};

const MAX = 50;
const store: NotificationEvent[] = [];

function push(ev: Omit<NotificationEvent, "id" | "at"> & { at?: Date }) {
  const item: NotificationEvent = {
    ...ev,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: ev.at ?? new Date(),
  };
  store.unshift(item);
  if (store.length > MAX) store.pop();
  return item;
}

export function notifyOrderCreated(orderId: string, orderNumber: string) {
  return push({
    type: "order_created",
    message: `New order received: ${orderNumber}`,
    orderId,
  });
}

export function notifyOrderUpdated(orderId: string, orderNumber: string, detail: string) {
  return push({
    type: "order_updated",
    message: `Order ${orderNumber}: ${detail}`,
    orderId,
  });
}

export function notifyOrderDelayed(orderId: string, orderNumber: string) {
  return push({
    type: "order_delayed",
    message: `Order delayed: ${orderNumber}`,
    orderId,
  });
}

export function listNotifications(limit = 20): NotificationEvent[] {
  return store.slice(0, limit);
}
