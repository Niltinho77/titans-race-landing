import { NextResponse } from "next/server";
import { searchTeams } from "@/lib/teams";

export const dynamic = "force-dynamic";

// Sugestões do campo "Sua equipe" (só nome, cidade e logo).
export async function GET(req: Request) {
  try {
    const query = new URL(req.url).searchParams.get("q") ?? "";
    return NextResponse.json({ teams: await searchTeams(query) });
  } catch (error) {
    console.error("Erro ao buscar equipes:", error);
    return NextResponse.json({ teams: [] });
  }
}
