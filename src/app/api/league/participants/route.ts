import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeagueParticipantPayload = {
  instagram?: unknown;
  points?: unknown;
  mode?: unknown;
};

function assertAdmin(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const secret = process.env.ADMIN_DRAW_KEY || "";

  if (!secret) throw new Error("ADMIN_DRAW_KEY não configurada no ambiente.");
  if (key !== secret) throw new Error("Acesso negado.");
}

function normalizeInstagram(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function normalizePoints(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
}

export async function GET() {
  const participants = await prisma.leagueParticipant.findMany({
    orderBy: [{ points: "desc" }, { instagram: "asc" }],
  });

  return NextResponse.json({
    participants: participants.map((participant) => ({
      id: participant.id,
      instagram: participant.instagram,
      points: participant.points,
      updatedAt: participant.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  try {
    assertAdmin(req);

    const body = (await req.json().catch(() => null)) as LeagueParticipantPayload | null;
    const instagram = normalizeInstagram(body?.instagram);
    const points = normalizePoints(body?.points);
    const mode =
      body?.mode === "set" ? "set" : body?.mode === "subtract" ? "subtract" : "add";

    if (!instagram) {
      return NextResponse.json({ error: "Informe o Instagram." }, { status: 400 });
    }

    if (points === null) {
      return NextResponse.json({ error: "Informe uma pontuação válida." }, { status: 400 });
    }

    const participant = await prisma.$transaction(async (tx) => {
      if (mode === "set") {
        return tx.leagueParticipant.upsert({
          where: { instagram },
          create: { instagram, points },
          update: { points },
        });
      }

      if (mode === "subtract") {
        const current = await tx.leagueParticipant.findUnique({
          where: { instagram },
        });
        const nextPoints = Math.max(0, (current?.points ?? 0) - points);

        return tx.leagueParticipant.upsert({
          where: { instagram },
          create: { instagram, points: nextPoints },
          update: { points: nextPoints },
        });
      }

      return tx.leagueParticipant.upsert({
        where: { instagram },
        create: { instagram, points },
        update: { points: { increment: points } },
      });
    });

    return NextResponse.json({
      ok: true,
      participant: {
        id: participant.id,
        instagram: participant.instagram,
        points: participant.points,
        updatedAt: participant.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const instagram = normalizeInstagram(url.searchParams.get("instagram"));

    if (!id && !instagram) {
      return NextResponse.json(
        { error: "Informe o participante para excluir." },
        { status: 400 },
      );
    }

    if (id) {
      await prisma.leagueParticipant.delete({ where: { id } });
    } else if (instagram) {
      await prisma.leagueParticipant.delete({ where: { instagram } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
