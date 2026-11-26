import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizeEmail } from "@/lib/portalAuth";

// Sem caracteres que se confundem (0/O, 1/l/I).
const PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generateTemporaryPassword(length = 10) {
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

export type PortalAccess = {
  login: string;
  // Só vem preenchida quando a conta ainda não tinha senha. Senhas existentes nunca são trocadas.
  temporaryPassword: string | null;
  // Desfaz a senha provisória (usado se o e-mail com ela não for enviado).
  revert: () => Promise<void>;
};

const noop = async () => {};

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

// Garante que o atleta tenha acesso ao Portal com o e-mail da inscrição.
export async function ensurePortalAccess(email: string, name: string | null): Promise<PortalAccess> {
  const login = normalizeEmail(email);
  const existing = await prisma.portalUser.findUnique({
    where: { email: login },
    select: { id: true, passwordHash: true },
  });
  if (existing?.passwordHash) return { login, temporaryPassword: null, revert: noop };

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  let userId: string;
  if (existing) {
    // Só grava se a conta continuar sem senha (outra requisição pode ter definido uma).
    const updated = await prisma.portalUser.updateMany({
      where: { id: existing.id, passwordHash: null },
      data: { passwordHash, requiresPasswordSetup: false },
    });
    if (updated.count === 0) return { login, temporaryPassword: null, revert: noop };
    userId = existing.id;
  } else {
    try {
      const created = await prisma.portalUser.create({
        data: { email: login, name, role: "PARTICIPANT", passwordHash, requiresPasswordSetup: false },
        select: { id: true },
      });
      userId = created.id;
    } catch (error) {
      if (isUniqueViolation(error)) return { login, temporaryPassword: null, revert: noop };
      throw error;
    }
  }

  return {
    login,
    temporaryPassword,
    revert: async () => {
      await prisma.portalUser.updateMany({
        where: { id: userId, passwordHash },
        data: { passwordHash: null, requiresPasswordSetup: true },
      });
    },
  };
}
