/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const prisma = new PrismaClient();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function portalBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://titansrace.com.br"
  ).replace(/\/+$/, "");
}

async function sendSetupEmail({ to, name, setupUrl, expiresAt }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    throw new Error("RESEND_API_KEY e RESEND_FROM precisam estar configurados.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const expiresAtFormatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject: "Defina sua senha do Portal Titans Race",
    html: `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; background: #020617; padding: 24px;">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <div style="max-width: 560px; margin: 0 auto; background: #020617; border-radius: 16px; border: 1px solid rgba(148,163,184,0.4); padding: 24px;">
    <h1 style="color: #f97316; font-size: 20px; margin: 0 0 8px 0;">Portal do Inscrito Titans Race</h1>
    <p style="font-size: 14px;">Ol&aacute;${name ? `, <strong>${name}</strong>` : ""}.</p>
    <p style="font-size: 14px; color: #cbd5f5;">Criamos seu acesso ao portal para consultar e atualizar dados permitidos da sua inscri&ccedil;&atilde;o.</p>
    <p style="font-size: 14px; color: #cbd5f5;">Defina sua senha pelo bot&atilde;o abaixo. O link expira em ${expiresAtFormatted}.</p>
    <p style="margin: 24px 0;">
      <a href="${setupUrl}" style="display:inline-block;background:#f97316;color:#020617;font-size:13px;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 18px;text-transform:uppercase;letter-spacing:.08em;">Definir minha senha</a>
    </p>
    <p style="font-size:12px;color:#9ca3af;">Se voc&ecirc; n&atilde;o solicitou este acesso, ignore este e-mail.</p>
  </div>
</div>`,
  });
}

async function main() {
  const send = process.argv.includes("--send");
  const previewLinks = process.argv.includes("--preview");
  const adminOnly = process.argv.includes("--admin-only");
  const createAdminEmailArg = process.argv.find((arg) => arg.startsWith("--admin-email="));
  const adminEmail = createAdminEmailArg
    ? normalizeEmail(createAdminEmailArg.split("=")[1])
    : normalizeEmail(process.env.PORTAL_ADMIN_EMAIL || "");

  const paidParticipants = adminOnly
    ? []
    : await prisma.participant.findMany({
        where: {
          order: { status: "PAID" },
          email: { not: "" },
        },
        orderBy: { fullName: "asc" },
      });

  const participantByEmail = new Map();
  for (const participant of paidParticipants) {
    const email = normalizeEmail(participant.email);
    if (!email) continue;
    if (!participantByEmail.has(email)) participantByEmail.set(email, participant);
  }

  const usersToInvite = [];

  for (const [email, participant] of participantByEmail.entries()) {
    const user = await prisma.portalUser.upsert({
      where: { email },
      create: {
        email,
        name: participant.fullName,
        role: "PARTICIPANT",
        requiresPasswordSetup: true,
      },
      update: {
        name: participant.fullName,
      },
    });

    if (user.requiresPasswordSetup || !user.passwordHash) {
      usersToInvite.push(user);
    }
  }

  if (adminEmail) {
    const adminUser = await prisma.portalUser.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: "Admin Titans Race",
        role: "ADMIN",
        requiresPasswordSetup: true,
      },
      update: {
        role: "ADMIN",
      },
    });

    if (adminUser.requiresPasswordSetup || !adminUser.passwordHash) {
      usersToInvite.push(adminUser);
    }
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const generated = [];

  for (const user of usersToInvite) {
    const token = randomToken();
    await prisma.portalPasswordToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    const setupUrl = `${portalBaseUrl()}/portal/definir-senha?token=${token}`;
    generated.push({ email: user.email, role: user.role, setupUrl });

    if (send) {
      await sendSetupEmail({
        to: user.email,
        name: user.name,
        setupUrl,
        expiresAt,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        paidParticipants: paidParticipants.length,
        participantUsers: participantByEmail.size,
        generatedInvites: generated.length,
        sent: send,
        preview: previewLinks ? generated : [],
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
