import { NextResponse } from "next/server";
import { listWeekImages, pickWinner, readState, writeState, nowIso } from "@/lib/drawStore";

export const dynamic = "force-dynamic";

function assertAdmin(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const secret = process.env.ADMIN_DRAW_KEY || "";

  if (!secret) throw new Error("ADMIN_DRAW_KEY não configurada no ambiente.");
  if (key !== secret) throw new Error("Acesso negado.");
}

export async function POST(req: Request) {
  try {
    assertAdmin(req);

    const files = listWeekImages();
    if (files.length < 2) {
      return NextResponse.json(
        { error: "Coloque pelo menos 2 imagens em public/sorteio/semana/." },
        { status: 400 }
      );
    }

    const current = readState();
    // Evita “sortear de novo” sem reset
    if (current.status === "FINISHED" && current.winnerFile) {
      return NextResponse.json({ ok: true, state: current, winnerFile: current.winnerFile });
    }

    const winnerFile = pickWinner(files);

    const next = {
      status: "FINISHED" as const,
      winnerFile,
      updatedAt: nowIso(),
    };

    writeState(next);

    return NextResponse.json({ ok: true, state: next, winnerFile });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 401 });
  }
}
