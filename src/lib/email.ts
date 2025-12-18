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
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://titans-race-landing-production.up.railway.app";

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