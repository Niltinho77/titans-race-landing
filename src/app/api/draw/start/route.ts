import { NextResponse } from "next/server";
import {
  listWeekImages,
  nowIso,
  pickWinner,
  readState,
  writeState,
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

export async function POST(req: Request) {
  try {
    assertAdmin(req);

    const files = await listWeekImages();
    if (files.length < 2) {
      return NextResponse.json(
        { error: "Envie pelo menos 2 imagens para o sorteio semanal." },
        { status: 400 },
      );
    }

    const current = await readState();
    if (current.status === "FINISHED" && current.winnerFile) {
      return NextResponse.json({
        ok: true,
        state: current,
        winnerFile: current.winnerFile,
      });
    }

    const winnerFile = pickWinner(files);
    const next = {
      status: "FINISHED" as const,
      winnerFile,
      updatedAt: nowIso(),
    };

    await writeState(next);

    return NextResponse.json({ ok: true, state: next, winnerFile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
