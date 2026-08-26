import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const trackedUrl =
  "https://titansrace.com.br/?utm_source=panfleto&utm_medium=qrcode&utm_campaign=panfleto_2026";
const outputDirectory = path.join(process.cwd(), "public", "materiais");

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });

  const options = {
    errorCorrectionLevel: "H",
    margin: 4,
    color: { dark: "#000000", light: "#FFFFFF" },
  };

  await Promise.all([
    QRCode.toFile(path.join(outputDirectory, "qr-code-panfleto-titans-race.svg"), trackedUrl, {
      ...options,
      type: "svg",
      width: 1600,
    }),
    QRCode.toFile(path.join(outputDirectory, "qr-code-panfleto-titans-race.png"), trackedUrl, {
      ...options,
      type: "png",
      width: 1600,
    }),
  ]);

  console.log(`QR Code criado para: ${trackedUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
