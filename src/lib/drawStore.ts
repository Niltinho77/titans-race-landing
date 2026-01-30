import fs from "fs";
import path from "path";
import crypto from "crypto";

export type DrawStatus = "IDLE" | "FINISHED";

export type DrawState = {
  status: DrawStatus;
  winnerFile: string | null; // nome do arquivo na pasta public/sorteio/semana
  updatedAt: string | null;
};

const STATE_PATH = path.join(process.cwd(), "data", "draw-state.json");
const WEEK_FOLDER = path.join(process.cwd(), "public", "sorteio", "semana");

function ensureStateFile() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(STATE_PATH)) {
    const init: DrawState = { status: "IDLE", winnerFile: null, updatedAt: null };
    fs.writeFileSync(STATE_PATH, JSON.stringify(init, null, 2), "utf-8");
  }
}

export function readState(): DrawState {
  ensureStateFile();
  const raw = fs.readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw) as DrawState;
}

export function writeState(next: DrawState) {
  ensureStateFile();
  fs.writeFileSync(STATE_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export function listWeekImages(): string[] {
  if (!fs.existsSync(WEEK_FOLDER)) return [];
  return fs
    .readdirSync(WEEK_FOLDER)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

export function pickWinner(files: string[]): string {
  if (!files.length) throw new Error("Sem imagens em public/sorteio/semana.");
  // Aleatoriedade criptográfica (CSPRNG)
  const idx = crypto.randomInt(0, files.length);
  return files[idx];
}

export function nowIso() {
  return new Date().toISOString();
}

export function publicUrlFor(file: string) {
  return `/sorteio/semana/${encodeURIComponent(file)}`;
}
