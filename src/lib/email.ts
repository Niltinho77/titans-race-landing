// src/lib/email.ts
import { Resend } from "resend";
import { BRAZIL_TIME_ZONE } from "@/lib/dateTime";
import { EVENT } from "@/config/event";
import { ensurePortalAccess, type PortalAccess } from "@/lib/portalAccess";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY não configurado. E-mails não serão enviados.");
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendOrderConfirmationParams = {
  to: string;
  participantName: string;
  orderId: string;
  modalityName: string;
  totalAmount: number; // em centavos
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const BRAND = {
  orange: "#F97316",
  bg: "#0A0A0A",
  card: "#141414",
  border: "#2A2A2A",
  text: "#F5F5F5",
  muted: "#A3A3A3",
  faint: "#737373",
};

function emailSection(title: string, body: string) {
  return `
  <tr><td style="padding: 0 28px 20px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 14px;">
      <tr><td style="padding: 20px 22px;">
        <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND.orange};">${title}</p>
        ${body}
      </td></tr>
    </table>
  </td></tr>`;
}

function emailButton(href: string, label: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND.orange}; color: #0A0A0A; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 999px; padding: 13px 24px; text-transform: uppercase; letter-spacing: 0.08em;">${label}</a>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted}; width: 42%;">${label}</td>
    <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">${value}</td>
  </tr>`;
}

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams
) {
  if (!resend || !fromEmail) {
    throw new Error("Resend não configurado corretamente.");
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://titansrace.com.br"
  ).replace(/\/+$/, "");

  const { to, participantName, orderId, modalityName, totalAmount } = params;
  const firstName = participantName.trim().split(/\s+/)[0] || participantName;
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const totalLabel = totalAmount > 0 ? formatCurrency(totalAmount) : "Cortesia";
  const portalUrl = `${siteUrl}/portal/login`;

  // Acesso ao Portal: cria uma senha provisória só para quem ainda não tem senha.
  // Se falhar, o e-mail sai mesmo assim, com o caminho para definir a senha.
  let access: PortalAccess | null = null;
  try {
    access = await ensurePortalAccess(to, participantName);
  } catch (error) {
    console.error("[email] Falha ao preparar o acesso ao portal:", error);
  }

  const passwordHtml = access?.temporaryPassword
    ? `<span style="display: inline-block; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 18px; letter-spacing: 0.08em; color: ${BRAND.text}; background: #0A0A0A; border: 1px dashed ${BRAND.orange}; border-radius: 8px; padding: 6px 12px;">${escapeHtml(access.temporaryPassword)}</span>`
    : `<span style="font-size: 13px; color: ${BRAND.text};">a mesma que você já usa no portal</span>`;

  const passwordHint = access?.temporaryPassword
    ? "Essa é uma senha provisória. Para trocar, entre no portal e use <strong>Definir ou recuperar senha</strong>."
    : "Esqueceu a senha? Use <strong>Definir ou recuperar senha</strong> na tela de login.";

  const docs = [
    { href: `${siteUrl}/docs/termo-responsabilidade.pdf`, label: "Termo de responsabilidade (maior de idade)" },
    { href: `${siteUrl}/docs/termo-responsabilidade-menor.pdf`, label: "Termo de responsabilidade (menor de idade)" },
    { href: `${siteUrl}/regulamento.pdf`, label: "Regulamento oficial" },
  ];

  const subject = `Inscrição confirmada na Titans Race · ${EVENT.dateLabel}`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bg};">
<div style="display: none; max-height: 0; overflow: hidden;">Sua vaga está garantida, ${escapeHtml(firstName)}. Veja seu acesso ao Portal do Atleta.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.bg};">
<tr><td align="center" style="padding: 24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: ${BRAND.text};">

  <!-- TOPO -->
  <tr><td align="center" style="padding: 8px 28px 0 28px;">
    <img src="${siteUrl}/pwa/icon-192.png" width="72" height="72" alt="Titans Race" style="display: block; border-radius: 16px; border: 0;" />
    <p style="margin: 14px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: 0.22em; color: ${BRAND.text};">TITANS RACE</p>
    <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; color: ${BRAND.orange};">CORRA • SUPERE • VENÇA</p>
  </td></tr>

  <!-- DESTAQUE -->
  <tr><td style="padding: 28px 28px 24px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1F1209 0%, #141414 60%); background-color: #1A120B; border: 1px solid rgba(249,115,22,0.45); border-radius: 18px;">
      <tr><td style="padding: 28px 24px; text-align: center;">
        <span style="display: inline-block; background: rgba(34,197,94,0.14); color: #4ADE80; border: 1px solid rgba(74,222,128,0.4); border-radius: 999px; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">✓ Inscrição confirmada</span>
        <h1 style="margin: 18px 0 8px 0; font-size: 28px; line-height: 1.2; font-weight: 900; color: ${BRAND.text};">Agora você é um Titan, ${escapeHtml(firstName)}!</h1>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${BRAND.muted};">Pagamento confirmado e vaga garantida na ${EVENT.editionLabel} da Titans Race. Prepare-se: lama, obstáculos e superação de verdade esperam por você.</p>
      </td></tr>
      <tr><td style="padding: 0 16px 20px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding: 6px; text-align: center;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND.faint};">Data</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: ${BRAND.orange};">${EVENT.dateLabel}</p>
            </td>
            <td width="50%" style="padding: 6px; text-align: center;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND.faint};">Local</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: ${BRAND.orange};">${EVENT.city}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  ${emailSection(
    "Sua inscrição",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow("Atleta", escapeHtml(participantName))}
      ${detailRow("Modalidade", escapeHtml(modalityName))}
      ${detailRow("Pedido", `#${shortOrderId}`)}
      ${detailRow("Valor", totalLabel)}
    </table>`
  )}

  ${emailSection(
    "Portal do Atleta",
    `<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: ${BRAND.muted};">No portal você acompanha e gerencia sua inscrição. Seus dados de acesso:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted}; width: 30%;">Login</td>
        <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600; word-break: break-all;">${escapeHtml(access?.login ?? to)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted};">Senha</td>
        <td style="padding: 6px 0;">${access ? passwordHtml : `<span style="font-size: 13px; color: ${BRAND.text};">crie a sua em <strong>Definir ou recuperar senha</strong></span>`}</td>
      </tr>
    </table>
    <p style="margin: 0 0 18px 0;">${emailButton(portalUrl, "Acessar o portal")}</p>
    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: ${BRAND.faint};">${access ? passwordHint : "Use o mesmo e-mail da inscrição."}</p>`
  )}

  ${emailSection(
    "Retirada do kit",
    `<p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: ${BRAND.muted};">Para retirar o kit, apresente obrigatoriamente:</p>
    <p style="margin: 0 0 6px 0; font-size: 14px; color: ${BRAND.text};"><span style="color: ${BRAND.orange}; font-weight: 800;">1.</span> Documento oficial com foto</p>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: ${BRAND.text};"><span style="color: ${BRAND.orange}; font-weight: 800;">2.</span> Termo de responsabilidade impresso e assinado (conforme a idade)</p>
    <p style="margin: 0; padding: 10px 12px; font-size: 13px; color: #FCA5A5; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px;">Sem o termo assinado, o kit não será entregue.</p>`
  )}

  ${emailSection(
    "Documentos da prova",
    `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: ${BRAND.muted};">Leia, imprima e leve no dia. Use o termo correspondente à idade do atleta.</p>
    ${docs
      .map(
        (doc) => `<p style="margin: 0 0 8px 0;"><a href="${doc.href}" style="display: block; padding: 11px 14px; font-size: 14px; font-weight: 600; color: ${BRAND.text}; text-decoration: none; background: #0A0A0A; border: 1px solid ${BRAND.border}; border-radius: 10px;"><span style="color: ${BRAND.orange};">↓</span>&nbsp; ${doc.label}</a></p>`
      )
      .join("")}`
  )}

  ${emailSection(
    "Próximos passos",
    `<p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${BRAND.muted};">Em breve você recebe o horário da largada, o endereço completo da arena, os detalhes da retirada do kit e as orientações para o dia da prova. Fique de olho no seu e-mail e no nosso Instagram.</p>`
  )}

  <!-- RODAPÉ -->
  <tr><td align="center" style="padding: 8px 28px 8px 28px;">
    <p style="margin: 0 0 14px 0;">
      <a href="https://wa.me/5555992234690" style="display: inline-block; margin: 0 6px 8px 6px; padding: 9px 16px; font-size: 12px; font-weight: 700; color: ${BRAND.text}; text-decoration: none; border: 1px solid ${BRAND.border}; border-radius: 999px;">WhatsApp</a>
      <a href="https://www.instagram.com/titansraceoficial" style="display: inline-block; margin: 0 6px 8px 6px; padding: 9px 16px; font-size: 12px; font-weight: 700; color: ${BRAND.text}; text-decoration: none; border: 1px solid ${BRAND.border}; border-radius: 999px;">@titansraceoficial</a>
    </p>
    <p style="margin: 0 0 6px 0; font-size: 12px; line-height: 1.6; color: ${BRAND.faint};">Dúvidas? Responda este e-mail ou fale com a organização pelo WhatsApp (55) 99223-4690.</p>
    <p style="margin: 0 0 24px 0; font-size: 11px; color: #525252;">Titans Race · ${EVENT.city} · Guarde este e-mail, o número do pedido pode ser solicitado no atendimento.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const passwordText = access?.temporaryPassword
    ? `Senha provisória: ${access.temporaryPassword}\n(Para trocar, use "Definir ou recuperar senha" na tela de login.)`
    : access
      ? `Senha: a mesma que você já usa no portal. Esqueceu? Use "Definir ou recuperar senha" na tela de login.`
      : `Senha: crie a sua em "Definir ou recuperar senha" na tela de login, com o mesmo e-mail da inscrição.`;

  const text = [
    `Inscrição confirmada, ${firstName}!`,
    ``,
    `Pagamento confirmado e vaga garantida na ${EVENT.editionLabel} da Titans Race (${EVENT.dateLabel}, ${EVENT.city}).`,
    ``,
    `SUA INSCRIÇÃO`,
    `Atleta: ${participantName}`,
    `Modalidade: ${modalityName}`,
    `Pedido: #${shortOrderId}`,
    `Valor: ${totalLabel}`,
    ``,
    `PORTAL DO ATLETA: ${portalUrl}`,
    `Login: ${access?.login ?? to}`,
    passwordText,
    ``,
    `RETIRADA DO KIT`,
    `Leve documento oficial com foto e o termo de responsabilidade impresso e assinado. Sem o termo assinado, o kit não será entregue.`,
    ``,
    `DOCUMENTOS`,
    ...docs.map((doc) => `${doc.label}: ${doc.href}`),
    ``,
    `Dúvidas? Responda este e-mail ou chame no WhatsApp (55) 99223-4690.`,
    `Titans Race · ${EVENT.city}`,
  ].join("\n");

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    // Senha provisória que o atleta nunca recebeu não deve ficar valendo.
    await access?.revert().catch(() => null);
    throw new Error(`Falha no envio pelo Resend: ${result.error.message}`);
  }
}

type SendPortalPasswordSetupParams = {
  to: string;
  name?: string | null;
  setupUrl: string;
  expiresAt: Date;
};

export async function sendPortalPasswordSetupEmail(
  params: SendPortalPasswordSetupParams
) {
  if (!resend || !fromEmail) {
    throw new Error("Resend não configurado corretamente para enviar a senha do portal.");
  }

  const expiresAtFormatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(params.expiresAt);

  const subject = "Defina sua senha do Portal Titans Race";

  const html = `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; background: #020617; padding: 24px;">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <div style="max-width: 560px; margin: 0 auto; background: #020617; border-radius: 16px; border: 1px solid rgba(148,163,184,0.4); padding: 24px;">
    <h1 style="color: #f97316; font-size: 20px; margin: 0 0 8px 0;">
      Portal do Inscrito Titans Race
    </h1>

    <p style="color: #e5e5e5; font-size: 14px; margin: 0 0 16px 0;">
      Ol&aacute;${params.name ? `, <strong>${escapeHtml(params.name)}</strong>` : ""}.
    </p>

    <p style="color: #cbd5f5; font-size: 14px; margin: 0 0 12px 0;">
      Recebemos uma solicita&ccedil;&atilde;o para definir ou recuperar sua senha do Portal Titans Race.
    </p>

    <p style="color: #cbd5f5; font-size: 14px; margin: 0 0 18px 0;">
      Para come&ccedil;ar, defina sua senha pelo bot&atilde;o abaixo. Este link expira em ${expiresAtFormatted}.
    </p>

    <p style="margin: 24px 0;">
      <a href="${params.setupUrl}" style="display: inline-block; background: #f97316; color: #020617; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 999px; padding: 12px 18px; text-transform: uppercase; letter-spacing: 0.08em;">
        Definir minha senha
      </a>
    </p>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
      Se voc&ecirc; n&atilde;o solicitou este acesso, ignore este e-mail.
    </p>

    <p style="font-size: 11px; color: #4b5563; margin-top: 18px;">
      Titans Race
    </p>
  </div>
</div>
`;

  const result = await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject,
    html,
    text: `Olá${params.name ? `, ${params.name}` : ""}.\n\nPara definir ou recuperar sua senha do Portal Titans Race, acesse:\n${params.setupUrl}\n\nO link expira em ${expiresAtFormatted} (horário de Brasília).\nSe você não solicitou este acesso, ignore este e-mail.`,
  });

  if (result.error) {
    throw new Error(`Falha no envio da senha pelo Resend: ${result.error.message}`);
  }
  if (!result.data?.id) {
    throw new Error("Resend não confirmou o envio da senha do portal.");
  }
}

type SponsorshipLeadEmailItem = {
  id: string;
  name: string;
  price: number;
};

type SendSponsorshipLeadNotificationParams = {
  to: string;
  company: string;
  responsibleName: string;
  phone: string;
  email: string;
  instagram?: string | null;
  city?: string | null;
  selectedItems: SponsorshipLeadEmailItem[];
  estimatedValue: number;
  notes?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrencyFromReais(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export async function sendSponsorshipLeadNotificationEmail(
  params: SendSponsorshipLeadNotificationParams
) {
  if (!resend || !fromEmail) {
    console.warn("Resend nao configurado corretamente. Pulando envio de lead de patrocinio.");
    return;
  }

  const itemsHtml =
    params.selectedItems.length > 0
      ? params.selectedItems
          .map(
            (item) => `
              <li style="margin: 0 0 6px 0;">
                <strong>${escapeHtml(item.name)}</strong> - ${formatCurrencyFromReais(item.price)}
              </li>`
          )
          .join("")
      : '<li style="margin: 0 0 6px 0;">Nenhuma opção selecionada.</li>';

  const whatsappLink = `https://wa.me/55${params.phone.replace(/\D/g, "")}`;
  const subject = `Novo interessado em patrocinar a Titans II - ${params.company}`;

  const html = `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; background: #020617; padding: 24px;">
  <div style="max-width: 620px; margin: 0 auto; background: #020617; border-radius: 16px; border: 1px solid rgba(249,115,22,0.35); padding: 24px;">
    <p style="font-size: 11px; color: #fb923c; text-transform: uppercase; letter-spacing: 0.16em; margin: 0 0 8px 0;">
      Lead de patrocínio
    </p>

    <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0;">
      Nova empresa interessada na Titans Race II
    </h1>

    <div style="padding: 14px; border-radius: 14px; background: rgba(249,115,22,0.10); border: 1px solid rgba(249,115,22,0.25); margin-bottom: 18px;">
      <p style="font-size: 13px; color: #fed7aa; margin: 0 0 4px 0;">Investimento de interesse</p>
      <p style="font-size: 28px; color: #fb923c; font-weight: 800; margin: 0;">
        ${formatCurrencyFromReais(params.estimatedValue)}
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e5e5e5;">
      <tr><td style="padding: 7px 0; color: #9ca3af;">Empresa</td><td style="padding: 7px 0;"><strong>${escapeHtml(params.company)}</strong></td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Responsável</td><td style="padding: 7px 0;">${escapeHtml(params.responsibleName)}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">WhatsApp</td><td style="padding: 7px 0;"><a href="${whatsappLink}" style="color: #fb923c;">${escapeHtml(params.phone)}</a></td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">E-mail</td><td style="padding: 7px 0;"><a href="mailto:${escapeHtml(params.email)}" style="color: #fb923c;">${escapeHtml(params.email)}</a></td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Instagram</td><td style="padding: 7px 0;">${escapeHtml(params.instagram || "-")}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Cidade</td><td style="padding: 7px 0;">${escapeHtml(params.city || "-")}</td></tr>
    </table>

    <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(148,163,184,0.20);">
      <p style="font-size: 13px; color: #fb923c; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 10px 0;">
        Opções selecionadas
      </p>
      <ul style="font-size: 14px; color: #e5e5e5; padding-left: 18px; margin: 0;">
        ${itemsHtml}
      </ul>
    </div>

    <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(148,163,184,0.20);">
      <p style="font-size: 13px; color: #9ca3af; margin: 0 0 6px 0;">Observações</p>
      <p style="font-size: 14px; color: #e5e5e5; margin: 0; white-space: pre-wrap;">${escapeHtml(params.notes || "-")}</p>
    </div>

    <p style="margin: 24px 0 0 0;">
      <a href="${whatsappLink}" style="display: inline-block; background: #f97316; color: #020617; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 999px; padding: 12px 18px; text-transform: uppercase; letter-spacing: 0.08em;">
        Chamar no WhatsApp
      </a>
    </p>

    <p style="font-size: 11px; color: #6b7280; margin-top: 20px;">
      Este e-mail foi gerado automaticamente pelo formulário de patrocínio da Titans Race II.
    </p>
  </div>
</div>
`;

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject,
    html,
    replyTo: params.email,
  });
}
