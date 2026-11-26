type RecoveryOrder = {
  id: string;
  status: string;
  createdAt: Date;
};

export function isSalesRecoveryOrder(
  order: RecoveryOrder,
  manualOrderIds: ReadonlySet<string>,
  now = Date.now()
) {
  if (["FAILED", "OVERDUE", "CANCELED"].includes(order.status)) return true;
  if (order.status !== "PENDING") return false;
  return manualOrderIds.has(order.id) || order.createdAt.getTime() <= now - 30 * 60 * 1000;
}
