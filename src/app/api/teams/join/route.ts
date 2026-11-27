import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RANKING, teamChangeIsOpen } from "@/config/ranking";
import { parseTeamChoice } from "@/lib/teamNames";
import { resolveTeamChoice } from "@/lib/teams";

const NOT_FOUND = "Não encontramos inscrição com esse CPF e e-mail. Use os mesmos dados da inscrição.";

// Quem já se inscreveu escolhe (ou troca) a equipe informando CPF e e-mail da inscrição.
export async function POST(req: Request) {
  if (!teamChangeIsOpen()) {
    return NextResponse.json(
      { error: `A escolha de equipe encerrou em ${RANKING.closesLabel}.` },
      { status: 403 },
    );
  }
  try {
    const body = await req.json().catch(() => null);
    const cpf = String(body?.cpf ?? "").replace(/\D/g, "");
    const email = String(body?.email ?? "").trim().toLowerCase();
    const choice = parseTeamChoice(body?.team);
    if (cpf.length !== 11 || !email.includes("@")) {
      return NextResponse.json({ error: "Informe o CPF e o e-mail da inscrição." }, { status: 400 });
    }
    if (!choice) {
      return NextResponse.json({ error: "Escolha a sua equipe." }, { status: 400 });
    }

    const participants = await prisma.participant.findMany({
      where: {
        cpf,
        email: { equals: email, mode: "insensitive" },
        order: { status: { in: ["PAID", "PENDING"] } },
      },
      select: { id: true, fullName: true, teamId: true },
    });
    if (participants.length === 0) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const teamId = await resolveTeamChoice(choice);
    if (!teamId) {
      return NextResponse.json({ error: "Equipe não encontrada. Tente de novo." }, { status: 400 });
    }
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });

    const changed = participants.filter((participant) => participant.teamId !== teamId);
    if (changed.length > 0) {
      await prisma.$transaction([
        prisma.participant.updateMany({
          where: { id: { in: changed.map((participant) => participant.id) } },
          data: { teamId, teamJoinedAt: new Date() },
        }),
        prisma.participantChangeLog.createMany({
          data: changed.map((participant) => ({
            participantId: participant.id,
            action: "TEAM_CHANGE",
            beforeJson: { teamId: participant.teamId },
            afterJson: { teamId },
          })),
        }),
      ]);
    }

    return NextResponse.json({
      firstName: participants[0].fullName.trim().split(/\s+/)[0],
      teamName: team?.name ?? "",
    });
  } catch (error) {
    console.error("Erro ao escolher equipe:", error);
    return NextResponse.json({ error: "Não foi possível salvar agora. Tente de novo." }, { status: 500 });
  }
}
