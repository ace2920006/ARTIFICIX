export function generateOrderNumber(): string {
  const part = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${Date.now()}-${part}`;
}
