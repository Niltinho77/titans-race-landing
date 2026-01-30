import { NextResponse } from "next/server";
import { listWeekImages, publicUrlFor, readState } from "@/lib/drawStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = readState();
  const files = listWeekImages();

  const images = files.map(publicUrlFor);
  const winnerUrl = state.winnerFile ? publicUrlFor(state.winnerFile) : null;

  return NextResponse.json({
    state,
    images,
    winnerUrl,
  });
}
