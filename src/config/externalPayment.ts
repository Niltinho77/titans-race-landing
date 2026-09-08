// Explicit allowlist: ordinary 100% coupons remain complimentary.
export const EXTERNAL_PAYMENT_COUPONS = ["GABRIELEDUPLAS", "SOLOPORFORA100"] as const;

export function isExternalPaymentCoupon(code?: string | null): boolean {
  return EXTERNAL_PAYMENT_COUPONS.some((value) => value === code?.trim().toUpperCase());
}

export function isExternalPaymentOrder(order: { asaasPaymentStatus: string | null }): boolean {
  return order.asaasPaymentStatus === "EXTERNAL_PENDING" || order.asaasPaymentStatus === "EXTERNAL_PAID";
}
