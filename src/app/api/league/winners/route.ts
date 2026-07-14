import { NextResponse } from "next/server";
import {
  archiveWeeklyWinner,
  deleteWeeklyWinner,
  readState,
  readWeeklyWinners,
  winnerUrlFor,
} from "@/lib/drawStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function assertAdmin(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const secret = process.env.ADMIN_DRAW_KEY || "";

  if (!secret) throw new Error("ADMIN_DRAW_KEY nao configurada no ambiente.");
  if (key !== secret) throw new Error("Acesso negado.");
}

async function winnersResponse() {
  const winners = await readWeeklyWinners();
  return {
    winners: winners.map((winner) => ({
      ...winner,
      url: winnerUrlFor(winner.file),
    })),
  };
}

export async function GET() {
  return NextResponse.json(await winnersResponse());
}

export async function POST(req: Request) {
  try {
    assertAdmin(req);

    const body = (await req.json()) as {
      week?: string;
      sourceFile?: string;
    };
    const state = await readState();
    const sourceFile = body.sourceFile || state.winnerFile;

    if (!sourceFile) {
      return NextResponse.json(
        { error: "Nao ha vencedor atual para arquivar." },
        { status: 400 },
      );
    }

    await archiveWeeklyWinner(body.week || "", sourceFile);

    return NextResponse.json({ ok: true, ...(await winnersResponse()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Informe o vencedor para excluir." },
        { status: 400 },
      );
    }

    await deleteWeeklyWinner(id);

    return NextResponse.json({ ok: true, ...(await winnersResponse()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
