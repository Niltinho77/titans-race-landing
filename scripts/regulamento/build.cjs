/* eslint-disable @typescript-eslint/no-require-imports */
// Gera public/regulamento.pdf a partir de scripts/regulamento/regulamento.html.
// Uso: node scripts/regulamento/build.cjs
// Requer o Playwright com Chromium (npx playwright install chromium). Defina PLAYWRIGHT_PATH se ele
// estiver instalado fora do projeto, ex.: PLAYWRIGHT_PATH=/Users/<voce>/node_modules/playwright
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

const root = path.resolve(__dirname, "../..");
const html = path.join(__dirname, "regulamento.html");
const outputs = [path.join(root, "public/regulamento.pdf"), path.join(root, "public/docs/REGULAMENTO.pdf")];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${html}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font-family:Arial;font-size:7.5px;color:#888;padding:0 16mm;display:flex;justify-content:space-between">
      <span>TITANS RACE · Regulamento oficial · 3ª edição · 14/03/2027</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  });
  for (const file of outputs) fs.writeFileSync(file, pdf);
  console.log(`PDF gerado (${Math.round(pdf.length / 1024)} KB): ${outputs.map((f) => path.relative(root, f)).join(", ")}`);
  await browser.close();
})();
