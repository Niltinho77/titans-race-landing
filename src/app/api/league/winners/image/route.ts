import { NextResponse } from "next/server";
import { readWinnerImage } from "@/lib/drawStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const image = await readWinnerImage(key);

  if (!image) {
    return NextResponse.json({ error: "Imagem nao encontrada." }, { status: 404 });
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
