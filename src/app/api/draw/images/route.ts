import { NextResponse } from "next/server";
import {
  deleteAllWeekImages,
  deleteWeekImage,
  listWeekImages,
  nowIso,
  publicUrlFor,
  saveWeekImages,
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

function imagesResponse(files: string[]) {
  return {
    images: files.map((file) => ({
      file,
      url: publicUrlFor(file),
    })),
  };
}

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const files = await listWeekImages();
    return NextResponse.json(imagesResponse(files));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    assertAdmin(req);

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    await saveWeekImages(files);
    await writeState({
      status: "IDLE",
      winnerFile: null,
      updatedAt: nowIso(),
    });

    const nextFiles = await listWeekImages();
    return NextResponse.json({ ok: true, ...imagesResponse(nextFiles) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    const all = url.searchParams.get("all") === "1";

    if (all) {
      await deleteAllWeekImages();
    } else if (file) {
      await deleteWeekImage(file);
    } else {
      return NextResponse.json(
        { error: "Informe a imagem para excluir." },
        { status: 400 },
      );
    }

    await writeState({
      status: "IDLE",
      winnerFile: null,
      updatedAt: nowIso(),
    });

    const files = await listWeekImages();
    return NextResponse.json({ ok: true, ...imagesResponse(files) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
