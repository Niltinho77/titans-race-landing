import { NextResponse } from "next/server";
import { sendSponsorshipLeadNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type SelectedItem = {
  id: string;
  name: string;
  price: number;
  status?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const empresa = clean(body.empresa);
    const responsavel = clean(body.responsavel);
    const telefone = clean(body.whatsapp);
    const email = clean(body.email);
    const instagram = clean(body.instagram);
    const cidade = clean(body.cidade);
    const observacoes = clean(body.observacoes);
    const selectedItems = Array.isArray(body.selectedItems)
      ? (body.selectedItems as SelectedItem[]).filter((item) => item?.id && item?.name)
      : [];

    if (!empresa || !responsavel || !telefone || !email) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes." },
        { status: 400 },
      );
    }

    const estimatedValue = selectedItems.reduce((sum, item) => {
      return sum + (Number.isFinite(item.price) ? item.price : 0);
    }, 0);

    const packageIds = selectedItems
      .filter((item) => ["parceiro", "apoiador", "master"].includes(item.id))
      .map((item) => item.id);
    const propertyIds = selectedItems
      .filter((item) => !["parceiro", "apoiador", "master"].includes(item.id))
      .map((item) => item.id);

    const lead = await prisma.sponsorshipLead.create({
      data: {
        company: empresa,
        responsibleName: responsavel,
        phone: telefone,
        email,
        instagram: instagram || null,
        city: cidade || null,
        selectedPackages: packageIds,
        selectedProperties: propertyIds,
        selectedItems,
        estimatedValue,
        notes: observacoes || null,
      },
    });

    try {
      await sendSponsorshipLeadNotificationEmail({
        to: "niltoncardoso77@gmail.com",
        company: empresa,
        responsibleName: responsavel,
        phone: telefone,
        email,
        instagram: instagram || null,
        city: cidade || null,
        selectedItems,
        estimatedValue,
        notes: observacoes || null,
      });
    } catch (emailError) {
      console.error("sponsorship lead notification email error", emailError);
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("sponsorship lead error", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o interesse." },
      { status: 500 },
    );
  }
}
