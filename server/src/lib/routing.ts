export type LineItemInput = {
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  fragile?: boolean;
};

export type RoutingInput = {
  city?: string;
  total: number;
  lineItems: LineItemInput[];
};

export type RoutingResult = {
  assignedWarehouse: string | null;
  priorityShipping: boolean;
  specialHandling: boolean;
  routingReasons: string[];
};

const NASHIK = "nashik";

export function applyRoutingRules(input: RoutingInput): RoutingResult {
  const reasons: string[] = [];
  let assignedWarehouse: string | null = null;
  let priorityShipping = false;
  let specialHandling = false;

  const city = (input.city ?? "").trim().toLowerCase();
  if (city === NASHIK) {
    assignedWarehouse = "Warehouse A";
    reasons.push("City is Nashik → assign to Warehouse A");
  }

  if (input.total > 5000) {
    priorityShipping = true;
    reasons.push("Order value exceeds ₹5,000 → priority shipping");
  }

  const hasFragile = input.lineItems.some((i) => i.fragile === true);
  if (hasFragile) {
    specialHandling = true;
    reasons.push("Contains fragile item(s) → special handling");
  }

  return {
    assignedWarehouse,
    priorityShipping,
    specialHandling,
    routingReasons: reasons,
  };
}
