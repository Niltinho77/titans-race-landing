import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

export type DrawStatus = "IDLE" | "FINISHED";

export type DrawState = {
  status: DrawStatus;
  winnerFile: string | null;
  updatedAt: string | null;
};

export type WeeklyWinner = {
  id: string;
  week: string;
  file: string;
  createdAt: string;
};

const STATE_PATH = path.join(process.cwd(), "data", "draw-state.json");
const WINNERS_PATH = path.join(process.cwd(), "data", "weekly-winners.json");
const WEEK_FOLDER = path.join(process.cwd(), "public", "sorteio", "semana");
const WINNERS_FOLDER = path.join(
  process.cwd(),
  "public",
  "sorteio",
  "vencedores",
);
const BUCKET_WEEK_PREFIX = "sorteio/semana/";
const BUCKET_WINNERS_PREFIX = "sorteio/vencedores/";
const BUCKET_STATE_KEY = "sorteio/draw-state.json";
const BUCKET_WINNERS_KEY = "sorteio/weekly-winners.json";
const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

let s3Client: S3Client | null = null;

function bucketConfig() {
  const bucket = process.env.DRAW_BUCKET_NAME || process.env.BUCKET || "";
  const endpoint = process.env.DRAW_BUCKET_ENDPOINT || process.env.ENDPOINT || "";
  const region = process.env.DRAW_BUCKET_REGION || process.env.REGION || "auto";
  const accessKeyId =
    process.env.DRAW_BUCKET_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || "";
  const secretAccessKey =
    process.env.DRAW_BUCKET_SECRET_ACCESS_KEY ||
    process.env.SECRET_ACCESS_KEY ||
    "";

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return null;

  return { bucket, endpoint, region, accessKeyId, secretAccessKey };
}

export function isBucketStorageEnabled() {
  return bucketConfig() !== null;
}

function s3() {
  const config = bucketConfig();
  if (!config) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return { client: s3Client, bucket: config.bucket };
}

function initialState(): DrawState {
  return { status: "IDLE", winnerFile: null, updatedAt: null };
}

function ensureStateFile() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(initialState(), null, 2), "utf-8");
  }
}

function readLocalState(): DrawState {
  ensureStateFile();
  const raw = fs.readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw) as DrawState;
}

function writeLocalState(next: DrawState) {
  ensureStateFile();
  fs.writeFileSync(STATE_PATH, JSON.stringify(next, null, 2), "utf-8");
}

function ensureWinnersFile() {
  const dir = path.dirname(WINNERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(WINNERS_PATH)) {
    fs.writeFileSync(WINNERS_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function readLocalWinners(): WeeklyWinner[] {
  ensureWinnersFile();
  const raw = fs.readFileSync(WINNERS_PATH, "utf-8");
  return JSON.parse(raw) as WeeklyWinner[];
}

function writeLocalWinners(next: WeeklyWinner[]) {
  ensureWinnersFile();
  fs.writeFileSync(WINNERS_PATH, JSON.stringify(next, null, 2), "utf-8");
}

function listLocalWeekImages(): string[] {
  if (!fs.existsSync(WEEK_FOLDER)) return [];
  return fs
    .readdirSync(WEEK_FOLDER)
    .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

function safeLocalFilename(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path
    .basename(name, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${Date.now()}-${crypto.randomUUID()}-${base || "imagem"}${ext || ".jpg"}`;
}

function safeBucketKey(name: string) {
  return `${BUCKET_WEEK_PREFIX}${safeLocalFilename(name)}`;
}

function safeWinnerFilename(name: string) {
  return safeLocalFilename(name);
}

function safeWinnerBucketKey(name: string) {
  return `${BUCKET_WINNERS_PREFIX}${safeWinnerFilename(name)}`;
}

function isImageFile(file: File) {
  if (IMAGE_CONTENT_TYPES.has(file.type)) return true;
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
}

async function bodyToBuffer(body: unknown) {
  if (!body) return Buffer.alloc(0);

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const webStream = body as ReadableStream<Uint8Array>;
  if (typeof webStream.getReader === "function") {
    const reader = webStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  }

  return Buffer.alloc(0);
}

export async function readState(): Promise<DrawState> {
  const storage = s3();
  if (!storage) return readLocalState();

  try {
    const response = await storage.client.send(
      new GetObjectCommand({
        Bucket: storage.bucket,
        Key: BUCKET_STATE_KEY,
      }),
    );
    const raw = (await bodyToBuffer(response.Body)).toString("utf-8");
    return JSON.parse(raw) as DrawState;
  } catch {
    return initialState();
  }
}

export async function writeState(next: DrawState) {
  const storage = s3();
  if (!storage) {
    writeLocalState(next);
    return;
  }

  await storage.client.send(
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: BUCKET_STATE_KEY,
      Body: JSON.stringify(next, null, 2),
      ContentType: "application/json",
    }),
  );
}

export async function readWeeklyWinners(): Promise<WeeklyWinner[]> {
  const storage = s3();
  if (!storage) return readLocalWinners();

  try {
    const response = await storage.client.send(
      new GetObjectCommand({
        Bucket: storage.bucket,
        Key: BUCKET_WINNERS_KEY,
      }),
    );
    const raw = (await bodyToBuffer(response.Body)).toString("utf-8");
    return JSON.parse(raw) as WeeklyWinner[];
  } catch {
    return [];
  }
}

export async function writeWeeklyWinners(next: WeeklyWinner[]) {
  const storage = s3();
  if (!storage) {
    writeLocalWinners(next);
    return;
  }

  await storage.client.send(
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: BUCKET_WINNERS_KEY,
      Body: JSON.stringify(next, null, 2),
      ContentType: "application/json",
    }),
  );
}

export async function listWeekImages(): Promise<string[]> {
  const storage = s3();
  if (!storage) return listLocalWeekImages();

  const files: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await storage.client.send(
      new ListObjectsV2Command({
        Bucket: storage.bucket,
        Prefix: BUCKET_WEEK_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (object.Key && /\.(png|jpg|jpeg|webp|gif)$/i.test(object.Key)) {
        files.push(object.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files.sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

export async function saveWeekImages(files: File[]) {
  const validFiles = files.filter(isImageFile);
  if (!validFiles.length) throw new Error("Selecione pelo menos uma imagem valida.");

  const storage = s3();

  if (!storage) {
    if (!fs.existsSync(WEEK_FOLDER)) fs.mkdirSync(WEEK_FOLDER, { recursive: true });

    for (const file of validFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(WEEK_FOLDER, safeLocalFilename(file.name)), buffer);
    }

    return;
  }

  await Promise.all(
    validFiles.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      await storage.client.send(
        new PutObjectCommand({
          Bucket: storage.bucket,
          Key: safeBucketKey(file.name),
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        }),
      );
    }),
  );
}

export async function deleteWeekImage(file: string) {
  const storage = s3();
  if (!storage) {
    const target = path.resolve(WEEK_FOLDER, file);
    const root = path.resolve(WEEK_FOLDER);
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Imagem invalida.");
    }
    if (fs.existsSync(target)) fs.unlinkSync(target);
    return;
  }

  if (!file.startsWith(BUCKET_WEEK_PREFIX)) throw new Error("Imagem invalida.");

  await storage.client.send(
    new DeleteObjectCommand({
      Bucket: storage.bucket,
      Key: file,
    }),
  );
}

export async function deleteAllWeekImages() {
  const files = await listWeekImages();
  await Promise.all(files.map((file) => deleteWeekImage(file)));
}

export async function deleteWeekImagesExcept(keepFile: string) {
  const files = await listWeekImages();
  const filesToDelete = files.filter((file) => file !== keepFile);
  await Promise.all(filesToDelete.map((file) => deleteWeekImage(file)));
}

export async function archiveWeeklyWinner(week: string, sourceFile: string) {
  const cleanedWeek = week.trim();
  if (!cleanedWeek) throw new Error("Informe a semana do vencedor.");

  const sourceImage = await readWeekImage(sourceFile);
  if (!sourceImage) throw new Error("Imagem vencedora nao encontrada.");

  return saveWeeklyWinnerImage({
    week: cleanedWeek,
    body: sourceImage.body,
    contentType: sourceImage.contentType,
    originalName: sourceFile,
  });
}

export async function saveUploadedWeeklyWinner(week: string, file: File) {
  const cleanedWeek = week.trim();
  if (!cleanedWeek) throw new Error("Informe a semana do vencedor.");
  if (!isImageFile(file)) throw new Error("Selecione uma imagem valida.");

  return saveWeeklyWinnerImage({
    week: cleanedWeek,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type || contentTypeFor(file.name),
    originalName: file.name,
  });
}

async function saveWeeklyWinnerImage({
  week,
  body,
  contentType,
  originalName,
}: {
  week: string;
  body: Buffer;
  contentType: string;
  originalName: string;
}) {
  const extension = path.extname(originalName) || ".jpg";
  const targetName = safeWinnerFilename(`${week}${extension}`);
  const storage = s3();
  const targetFile = storage ? safeWinnerBucketKey(targetName) : targetName;

  if (!storage) {
    if (!fs.existsSync(WINNERS_FOLDER)) {
      fs.mkdirSync(WINNERS_FOLDER, { recursive: true });
    }
    fs.writeFileSync(path.join(WINNERS_FOLDER, targetFile), body);
  } else {
    await storage.client.send(
      new PutObjectCommand({
        Bucket: storage.bucket,
        Key: targetFile,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  const winners = await readWeeklyWinners();
  const nextWinner: WeeklyWinner = {
    id: crypto.randomUUID(),
    week,
    file: targetFile,
    createdAt: nowIso(),
  };

  await writeWeeklyWinners([nextWinner, ...winners]);
  return nextWinner;
}

export async function deleteWeeklyWinner(id: string) {
  const winners = await readWeeklyWinners();
  const winner = winners.find((item) => item.id === id);
  if (!winner) throw new Error("Vencedor nao encontrado.");

  const storage = s3();
  if (!storage) {
    const target = path.resolve(WINNERS_FOLDER, winner.file);
    const root = path.resolve(WINNERS_FOLDER);
    const relative = path.relative(root, target);
    if (!relative.startsWith("..") && !path.isAbsolute(relative) && fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  } else if (winner.file.startsWith(BUCKET_WINNERS_PREFIX)) {
    await storage.client.send(
      new DeleteObjectCommand({
        Bucket: storage.bucket,
        Key: winner.file,
      }),
    );
  }

  await writeWeeklyWinners(winners.filter((item) => item.id !== id));
}

export async function readWeekImage(file: string) {
  const storage = s3();
  if (!storage) {
    const target = path.resolve(WEEK_FOLDER, file);
    const root = path.resolve(WEEK_FOLDER);
    const relative = path.relative(root, target);
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      !fs.existsSync(target)
    ) {
      return null;
    }

    return {
      body: fs.readFileSync(target),
      contentType: contentTypeFor(file),
    };
  }

  if (!file.startsWith(BUCKET_WEEK_PREFIX)) return null;

  const response = await storage.client.send(
    new GetObjectCommand({
      Bucket: storage.bucket,
      Key: file,
    }),
  );

  return {
    body: await bodyToBuffer(response.Body),
    contentType: response.ContentType || contentTypeFor(file),
  };
}

export async function readWinnerImage(file: string) {
  const storage = s3();
  if (!storage) {
    const target = path.resolve(WINNERS_FOLDER, file);
    const root = path.resolve(WINNERS_FOLDER);
    const relative = path.relative(root, target);
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      !fs.existsSync(target)
    ) {
      return null;
    }

    return {
      body: fs.readFileSync(target),
      contentType: contentTypeFor(file),
    };
  }

  if (!file.startsWith(BUCKET_WINNERS_PREFIX)) return null;

  const response = await storage.client.send(
    new GetObjectCommand({
      Bucket: storage.bucket,
      Key: file,
    }),
  );

  return {
    body: await bodyToBuffer(response.Body),
    contentType: response.ContentType || contentTypeFor(file),
  };
}

export function pickWinner(files: string[]): string {
  if (!files.length) throw new Error("Sem imagens no sorteio semanal.");
  const idx = crypto.randomInt(0, files.length);
  return files[idx];
}

export function nowIso() {
  return new Date().toISOString();
}

export function publicUrlFor(file: string) {
  return `/api/draw/image?key=${encodeURIComponent(file)}`;
}

export function winnerUrlFor(file: string) {
  return `/api/league/winners/image?key=${encodeURIComponent(file)}`;
}

export function displayNameFor(file: string) {
  return file.split("/").pop() || file;
}

function contentTypeFor(file: string) {
  if (/\.png$/i.test(file)) return "image/png";
  if (/\.webp$/i.test(file)) return "image/webp";
  if (/\.gif$/i.test(file)) return "image/gif";
  return "image/jpeg";
}
