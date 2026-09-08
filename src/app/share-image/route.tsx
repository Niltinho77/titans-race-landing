import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const logo = await readFile(join(process.cwd(), "public/icon.png"));

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#000", color: "#fff", borderBottom: "6px solid #f97316" }}>
        {/* The original brand artwork is contained without cropping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="" width={216} height={270} />
        <div style={{ display: "flex", marginTop: 12, fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>TITANS RACE</div>
        <div style={{ display: "flex", marginTop: 10, fontSize: 15, letterSpacing: 3, color: "#fb923c" }}>ALEGRETE / RS</div>
      </div>
    ),
    { width: 400, height: 400 },
  );
}
