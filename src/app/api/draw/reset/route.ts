import { NextResponse } from "next/server";
import { nowIso, writeState } from "@/lib/drawStore";

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

    const next = {
      status: "IDLE" as const,
      winnerFile: null,
      updatedAt: nowIso(),
    };

    await writeState(next);

    return NextResponse.json({ ok: true, state: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
