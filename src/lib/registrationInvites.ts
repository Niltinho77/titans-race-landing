import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

export const INVITE_ERROR = "Convite inválido, expirado, cancelado ou já utilizado.";

export function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isInviteToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

// A reserva e o pedido são gravados na mesma transação. O UPDATE condicional
// impede dois pedidos mesmo quando o mesmo link é usado simultaneamente.
export async function claimRegistrationInvite(
  tx: Prisma.TransactionClient,
  token: string,
  modalityId: string,
  tickets: number,
) {
  if (!isInviteToken(token) || tickets !== 1) throw new Error(INVITE_ERROR);
  const tokenHash = hashInviteToken(token);
  const result = await tx.registrationInvite.updateMany({
    where: { tokenHash, modalityId, claimedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { claimedAt: new Date() },
  });
  if (result.count !== 1) throw new Error(INVITE_ERROR);
  return tokenHash;
}
