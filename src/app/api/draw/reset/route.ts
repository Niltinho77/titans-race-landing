import { NextResponse } from "next/server";
import { readState, writeState, nowIso } from "@/lib/drawStore";

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

    const next = {
      status: "IDLE" as const,
      winnerFile: null,
      updatedAt: nowIso(),
    };

    writeState(next);

    return NextResponse.json({ ok: true, state: next });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 401 });
  }
}
