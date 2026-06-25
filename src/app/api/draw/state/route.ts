import { NextResponse } from "next/server";
import { listWeekImages, publicUrlFor, readState } from "@/lib/drawStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const state = await readState();
  const files = await listWeekImages();

  const images = files.map(publicUrlFor);
  const winnerUrl = state.winnerFile ? publicUrlFor(state.winnerFile) : null;

  return NextResponse.json({
    state,
    imageFiles: files,
    images,
    winnerUrl,
  });
}
