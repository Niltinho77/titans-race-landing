import { NextResponse } from "next/server";
import { readWeekImage } from "@/lib/drawStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";

  if (!key) {
    return NextResponse.json({ error: "Imagem nao informada." }, { status: 400 });
  }

  try {
    const image = await readWeekImage(key);
    if (!image) {
      return NextResponse.json({ error: "Imagem nao encontrada." }, { status: 404 });
    }

    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar imagem." }, { status: 500 });
  }
}
