import { NextResponse } from "next/server";
import { getSoldOutLotIds } from "@/lib/lotPricing";

export const dynamic = "force-dynamic";

// Lotes que já completaram as vagas. O site usa para trocar de lote na hora.
export async function GET() {
  const soldOut = await getSoldOutLotIds();
  return NextResponse.json(
    { soldOut },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } },
  );
}
