// src/lib/email.ts
import { Resend } from "resend";

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

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams
) {
  if (!resend || !fromEmail) {
    console.warn(
      "Resend não configurado corretamente. Pulando envio de e-mail."
    );
    return;
  }

  const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://titansrace.com.br";

  const { to, participantName, orderId, modalityName, totalAmount } = params;

  const totalFormatted = formatCurrency(totalAmount);

  const subject = `Confirmação de inscrição - Titans Race (${orderId.slice(
    0,
    8
  )})`;

  const html = `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; background: #020617; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #020617; border-radius: 16px; border: 1px solid rgba(148,163,184,0.4); padding: 24px;">

    <h1 style="color: #f97316; font-size: 20px; margin: 0 0 8px 0;">
      Inscrição confirmada — Titans Race
    </h1>

    <p style="color: #e5e5e5; font-size: 14px; margin: 0 0 16px 0;">
      Olá, <strong>${participantName}</strong>.
    </p>

    <p style="color: #cbd5f5; font-size: 14px; margin: 0 0 12px 0;">
      Sua inscrição na <strong>Titans Race</strong> foi registrada com sucesso e o pagamento foi confirmado.
    </p>

    <div style="margin-top: 16px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(34,197,94,0.5); background: rgba(22,163,74,0.08);">
      <p style="font-size: 12px; color: #a3e635; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 6px 0;">
        Detalhes da inscrição
      </p>
      <p style="font-size: 13px; color: #e5e5e5; margin: 0 0 4px 0;">
        <strong>Número do pedido:</strong> ${orderId}
      </p>
      <p style="font-size: 13px; color: #e5e5e5; margin: 0 0 4px 0;">
        <strong>Modalidade:</strong> ${modalityName}
      </p>
      <p style="font-size: 13px; color: #e5e5e5; margin: 0;">
        <strong>Valor total:</strong> ${totalFormatted}
      </p>
    </div>

    <!-- RETIRADA DE KIT -->
    <div style="margin-top: 18px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(249,115,22,0.5); background: rgba(15,23,42,0.9);">
      <p style="font-size: 13px; color: #fed7aa; margin: 0 0 6px 0;">
        <strong>Retirada do kit do atleta</strong>
      </p>
      <p style="font-size: 13px; color: #e5e5e5; margin: 0 0 6px 0;">
        A retirada do kit será realizada mediante apresentação obrigatória de:
      </p>
      <ul style="font-size: 13px; color: #e5e5e5; padding-left: 18px; margin: 0 0 6px 0;">
        <li>Documento oficial com foto;</li>
        <li>Termo de responsabilidade impresso e devidamente assinado (conforme a idade do participante).</li>
      </ul>
      <p style="font-size: 13px; color: #fca5a5; margin: 4px 0 0 0;">
        A retirada do kit não será autorizada sem a apresentação do termo assinado.
      </p>
    </div>

    <!-- DOCUMENTOS -->
    <div style="margin-top: 20px;">
      <p style="font-size: 13px; color: #cbd5f5; margin: 0 0 8px 0;">
        Abaixo estão os documentos oficiais da prova. Leia atentamente, imprima e leve no dia do evento:
      </p>

      <p style="font-size: 13px; margin: 0 0 4px 0;">
        <a href="${siteUrl}/docs/termo-responsabilidade.pdf" style="color: #f97316; text-decoration: underline;">
          Termo de Responsabilidade — Participante maior de idade
        </a>
      </p>

      <p style="font-size: 13px; margin: 0 0 4px 0;">
        <a href="${siteUrl}/docs/termo-responsabilidade-menor.pdf" style="color: #f97316; text-decoration: underline;">
          Termo de Responsabilidade — Participante menor de idade
        </a>
      </p>

      <p style="font-size: 13px; margin: 0 0 4px 0;">
        <a href="${siteUrl}/regulamento.pdf" style="color: #f97316; text-decoration: underline;">
          Regulamento oficial da Titans Race
        </a>
      </p>

      <p style="font-size: 12px; color: #9ca3af; margin: 6px 0 0 0;">
        Utilize o termo correspondente à idade do participante.
      </p>
    </div>

    <div style="margin-top: 20px;">
      <p style="font-size: 13px; color: #cbd5f5; margin: 0 0 8px 0;">
        Em breve você receberá novas comunicações contendo:
      </p>
      <ul style="font-size: 13px; color: #cbd5f5; padding-left: 18px; margin: 0 0 8px 0;">
        <li>Horário oficial da largada;</li>
        <li>Endereço completo da arena do evento;</li>
        <li>Informações detalhadas sobre a retirada do kit;</li>
        <li>Orientações gerais para o dia da prova.</li>
      </ul>
    </div>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
      Para sua organização, guarde o número do pedido. Ele poderá ser solicitado em atendimentos futuros.
    </p>

    <p style="font-size: 12px; color: #6b7280; margin-top: 18px;">
      Em caso de dúvidas, entre em contato com a organização da Titans Race respondendo este e-mail
      ou pelos canais oficiais divulgados.
    </p>

    <p style="font-size: 11px; color: #4b5563; margin-top: 18px;">
      Titans Race — Alegrete/RS
    </p>
  </div>
</div>
`;


  await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });
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
    console.warn("Resend nao configurado corretamente. Pulando envio de e-mail.");
    return;
  }

  const expiresAtFormatted = new Intl.DateTimeFormat("pt-BR", {
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
      Ol&aacute;${params.name ? `, <strong>${params.name}</strong>` : ""}.
    </p>

    <p style="color: #cbd5f5; font-size: 14px; margin: 0 0 12px 0;">
      Criamos o acesso ao portal para voc&ecirc; consultar e atualizar dados permitidos da sua inscri&ccedil;&atilde;o.
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

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject,
    html,
  });
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
