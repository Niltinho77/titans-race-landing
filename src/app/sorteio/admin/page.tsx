"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type DrawStatus = "IDLE" | "FINISHED";
type DrawState = {
  status: DrawStatus;
  winnerFile: string | null;
  updatedAt: string | null;
};

type StateResp = {
  state: DrawState;
  imageFiles: string[];
  images: string[];
  winnerUrl: string | null;
};

type LeagueParticipant = {
  id: string;
  instagram: string;
  points: number;
  updatedAt: string;
};

type LeagueResp = {
  participants: LeagueParticipant[];
};

type WeeklyWinner = {
  id: string;
  week: string;
  file: string;
  url: string;
  createdAt: string;
};

type WeeklyWinnersResp = {
  winners: WeeklyWinner[];
};

const LEVELS = [
  { name: "Recruta", min: 0, max: 14 },
  { name: "Guerreiro", min: 15, max: 34 },
  { name: "Gladiador", min: 35, max: 59 },
  { name: "Titan", min: 60, max: null },
];

const MAX_UPLOAD_WIDTH = 1440;
const MAX_UPLOAD_HEIGHT = 1920;
const UPLOAD_QUALITY = 0.82;

function getLevel(points: number) {
  return (
    [...LEVELS]
      .reverse()
      .find((level) => points >= level.min) ?? LEVELS[0]
  );
}

function normalizeInstagramInput(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function nextWinnerWeekLabel(winners: WeeklyWinner[]) {
  const highestWeek = winners.reduce((highest, winner) => {
    const match = winner.week.match(/semana\s*(\d+)/i);
    if (!match) return highest;
    return Math.max(highest, Number(match[1]) || 0);
  }, 0);

  return `Semana ${highestWeek + 1}`;
}

async function fileToImage(file: File) {
  const url = URL.createObjectURL(file);

  try {
    const image = document.createElement("img");
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareUploadImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} nao e uma imagem.`);
  }

  if (file.type === "image/gif") {
    return file;
  }

  const image = await fileToImage(file);
  const scale = Math.min(
    1,
    MAX_UPLOAD_WIDTH / image.naturalWidth,
    MAX_UPLOAD_HEIGHT / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error(`Nao foi possivel preparar ${file.name}.`);

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", UPLOAD_QUALITY);
  });

  if (!blob) throw new Error(`Nao foi possivel compactar ${file.name}.`);

  const safeName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${safeName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function SorteioAdmin() {
  const [data, setData] = useState<StateResp | null>(null);
  const [participants, setParticipants] = useState<LeagueParticipant[]>([]);
  const [instagram, setInstagram] = useState("");
  const [points, setPoints] = useState("1");
  const [mode, setMode] = useState<"add" | "subtract" | "set">("add");
  const [busy, setBusy] = useState(false);
  const [pointsBusy, setPointsBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinner[]>([]);
  const [winnerWeek, setWinnerWeek] = useState("");
  const [selectedWinnerFile, setSelectedWinnerFile] = useState<File | null>(null);
  const [winnerFileInputKey, setWinnerFileInputKey] = useState(0);
  const [winnerBusy, setWinnerBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const key =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("key") || ""
      : "";

  const ranking = useMemo(
    () => [...participants].sort((a, b) => b.points - a.points),
    [participants],
  );
  const selectedInstagram = normalizeInstagramInput(instagram);
  const exactParticipant = useMemo(
    () =>
      participants.find(
        (participant) => participant.instagram === selectedInstagram,
      ) ?? null,
    [participants, selectedInstagram],
  );
  const instagramSuggestions = useMemo(() => {
    const query = selectedInstagram.replace(/^@/, "");
    if (!query) return ranking.slice(0, 6);

    return ranking
      .filter((participant) =>
        participant.instagram.replace(/^@/, "").includes(query),
      )
      .slice(0, 6);
  }, [ranking, selectedInstagram]);

  async function fetchState() {
    const response = await fetch("/api/draw/state", { cache: "no-store" });
    const json = (await response.json()) as StateResp;
    setData(json);
  }

  async function fetchParticipants() {
    const response = await fetch("/api/league/participants", {
      cache: "no-store",
    });
    const json = (await response.json()) as LeagueResp;
    setParticipants(json.participants ?? []);
  }

  async function fetchWeeklyWinners() {
    const response = await fetch("/api/league/winners", { cache: "no-store" });
    const json = (await response.json()) as WeeklyWinnersResp;
    const nextWinners = json.winners ?? [];
    setWeeklyWinners(nextWinners);
    setWinnerWeek((current) => current || nextWinnerWeekLabel(nextWinners));
  }

  useEffect(() => {
    fetchState().catch(() => {});
    fetchParticipants().catch(() => {});
    fetchWeeklyWinners().catch(() => {});
  }, []);

  async function start() {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      const response = await fetch(
        `/api/draw/start?key=${encodeURIComponent(key)}`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao sortear");
      await fetchState();
      setMsg("Sorteio finalizado. A página pública da Liga já vai fixar o vencedor.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      const response = await fetch(
        `/api/draw/reset?key=${encodeURIComponent(key)}`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao resetar");
      await fetchState();
      setMsg("Semana resetada. Envie as imagens da semana e sorteie novamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    if (!selectedFiles.length) {
      setMsg("Selecione pelo menos uma imagem.");
      return;
    }

    setUploadBusy(true);
    setMsg("");

    try {
      const formData = new FormData();
      const preparedFiles = await Promise.all(
        selectedFiles.map((file) => prepareUploadImage(file)),
      );
      preparedFiles.forEach((file) => formData.append("files", file));

      const response = await fetch(
        `/api/draw/images?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao enviar imagens");

      setSelectedFiles([]);
      await fetchState();
      setMsg("Imagens enviadas e otimizadas. A semana foi resetada para um novo sorteio.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function deleteImage(file: string) {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    const shouldDelete = window.confirm("Excluir esta imagem do sorteio?");
    if (!shouldDelete) return;

    setUploadBusy(true);
    setMsg("");

    try {
      const response = await fetch(
        `/api/draw/images?key=${encodeURIComponent(key)}&file=${encodeURIComponent(file)}`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao excluir imagem");

      await fetchState();
      setMsg("Imagem excluida. A semana foi resetada para um novo sorteio.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function clearImages() {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    const shouldClear = window.confirm("Excluir todas as imagens da semana?");
    if (!shouldClear) return;

    setUploadBusy(true);
    setMsg("");

    try {
      const response = await fetch(
        `/api/draw/images?key=${encodeURIComponent(key)}&all=1`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao limpar imagens");

      await fetchState();
      setMsg("Imagens da semana excluidas.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function clearImagesKeepingWinner() {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    if (!data?.winnerUrl) {
      setMsg("Sorteie um vencedor antes de limpar mantendo o destaque.");
      return;
    }

    const shouldClear = window.confirm(
      "Excluir todos os stories da semana e manter apenas o vencedor?",
    );
    if (!shouldClear) return;

    setUploadBusy(true);
    setMsg("");

    try {
      const response = await fetch(
        `/api/draw/images?key=${encodeURIComponent(key)}&all=1&keepWinner=1`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Erro ao limpar stories");

      await fetchState();
      setMsg("Stories da semana excluidos. Apenas o vencedor ficou em destaque.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function archiveCurrentWinner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    if (!selectedWinnerFile && !data?.state.winnerFile) {
      setMsg("Selecione uma foto ou sorteie um vencedor antes de salvar.");
      return;
    }

    const currentWinnerFile = data?.state.winnerFile ?? null;
    setWinnerBusy(true);
    setMsg("");

    try {
      const preparedWinnerFile = selectedWinnerFile
        ? await prepareUploadImage(selectedWinnerFile)
        : null;
      const requestBody = preparedWinnerFile
        ? (() => {
            const formData = new FormData();
            formData.append("week", winnerWeek);
            formData.append("file", preparedWinnerFile);
            return formData;
          })()
        : JSON.stringify({
            week: winnerWeek,
            sourceFile: currentWinnerFile,
          });

      const response = await fetch(
        `/api/league/winners?key=${encodeURIComponent(key)}`,
        preparedWinnerFile
          ? {
              method: "POST",
              body: requestBody,
            }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestBody,
            },
      );
      const json = (await response.json()) as WeeklyWinnersResp & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(json?.error || "Erro ao salvar vencedor");
      }

      const nextWinners = json.winners ?? [];
      setWeeklyWinners(nextWinners);
      setWinnerWeek(nextWinnerWeekLabel(nextWinners));
      setSelectedWinnerFile(null);
      setWinnerFileInputKey((current) => current + 1);
      setMsg("Vencedor salvo no historico da Liga.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setWinnerBusy(false);
    }
  }

  async function deleteArchivedWinner(winner: WeeklyWinner) {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    const shouldDelete = window.confirm(`Excluir vencedor ${winner.week}?`);
    if (!shouldDelete) return;

    setWinnerBusy(true);
    setMsg("");

    try {
      const response = await fetch(
        `/api/league/winners?key=${encodeURIComponent(key)}&id=${encodeURIComponent(winner.id)}`,
        { method: "DELETE" },
      );
      const json = (await response.json()) as WeeklyWinnersResp & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(json?.error || "Erro ao excluir vencedor");
      }

      setWeeklyWinners(json.winners ?? []);
      setMsg("Vencedor removido do historico.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setWinnerBusy(false);
    }
  }

  async function savePoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    setPointsBusy(true);
    setMsg("");
    try {
      const normalizedInstagram = normalizeInstagramInput(instagram);
      if (
        normalizedInstagram &&
        !exactParticipant &&
        !window.confirm(
          `${normalizedInstagram} ainda nao esta no ranking. Criar esse participante?`,
        )
      ) {
        return;
      }

      const response = await fetch(
        `/api/league/participants?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram: normalizedInstagram,
            points,
            mode,
          }),
        },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Erro ao lançar pontos");
      }

      await fetchParticipants();
      setInstagram("");
      setPoints("1");
      setMode("add");
      setMsg(
        mode === "add"
          ? "Pontos lançados na Liga."
          : mode === "subtract"
            ? "Pontos subtraídos da Liga."
            : "Pontuação atualizada na Liga.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    } finally {
      setPointsBusy(false);
    }
  }

  async function deleteParticipant(participant: LeagueParticipant) {
    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir ${participant.instagram} da Liga Titans?`,
    );
    if (!shouldDelete) return;

    setMsg("");
    try {
      const response = await fetch(
        `/api/league/participants?key=${encodeURIComponent(key)}&id=${encodeURIComponent(participant.id)}`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Erro ao excluir participante");
      }

      await fetchParticipants();
      setMsg(`${participant.instagram} foi excluído da Liga.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setMsg(message);
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
          Liga Titans
        </p>
        <h1 className="mt-2 text-3xl font-black">Admin da Liga Titans</h1>
        <p className="mt-1 text-sm text-white/70">
          Lance pontos por Instagram e controle o sorteio semanal. Acesso por
          chave na URL.
        </p>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-black">Lançar pontos</h2>
            <form onSubmit={savePoints} className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-white/60">
                  Instagram
                </label>
                <input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  list="league-participants"
                  placeholder="@atleta"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
                <datalist id="league-participants">
                  {participants.map((participant) => (
                    <option
                      key={participant.id}
                      value={participant.instagram}
                    />
                  ))}
                </datalist>
                <div className="mt-2 flex flex-wrap gap-2">
                  {instagramSuggestions.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => setInstagram(participant.instagram)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-bold transition",
                        participant.instagram === selectedInstagram
                          ? "border-orange-400 bg-orange-500/20 text-orange-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {participant.instagram} · {participant.points} pts
                    </button>
                  ))}
                </div>
                {selectedInstagram && exactParticipant && (
                  <p className="mt-2 text-xs font-semibold text-emerald-300">
                    Selecionado: {exactParticipant.instagram} ({exactParticipant.points} pts)
                  </p>
                )}
                {selectedInstagram && !exactParticipant && (
                  <p className="mt-2 text-xs font-semibold text-orange-200">
                    Instagram novo. Ao salvar, confirme antes de criar.
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <div>
                  <label className="text-xs font-semibold text-white/60">
                    Pontos
                  </label>
                  <input
                    value={points}
                    onChange={(event) => setPoints(event.target.value)}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60">
                    Operação
                  </label>
                  <select
                    value={mode}
                    onChange={(event) =>
                      setMode(event.target.value as "add" | "subtract" | "set")
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="add">Somar pontos</option>
                    <option value="subtract">Subtrair pontos</option>
                    <option value="set">Definir total</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={pointsBusy}
                className="rounded-xl bg-[#ff5c0c] px-4 py-2 font-bold text-black disabled:opacity-50"
              >
                {pointsBusy ? "Salvando..." : "Salvar pontos"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-black">Sorteio semanal</h2>
            <p className="mt-1 text-sm text-white/60">
              Envie as imagens pelo celular, confira a lista e rode o sorteio.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={start}
                disabled={busy}
                className="rounded-xl bg-[#ff5c0c] px-4 py-2 font-bold text-black disabled:opacity-50"
              >
                {busy ? "Aguarde..." : "Sortear vencedor da semana"}
              </button>

              <button
                onClick={reset}
                disabled={busy}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold disabled:opacity-50"
              >
                Resetar semana
              </button>

              <a
                href="/sorteio"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold"
              >
                Abrir Liga Titans
              </a>
            </div>

            {data && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
                <span className="font-semibold">Status:</span>{" "}
                <span className="text-white/80">{data.state.status}</span>
                {data.winnerUrl && (
                  <span className="ml-2 text-emerald-300">
                    - vencedor definido
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black">Fotos da semana</h2>
              <p className="mt-1 text-sm text-white/60">
                Selecione varias imagens da galeria do celular.
              </p>
            </div>
            {data && data.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.winnerUrl && (
                  <button
                    type="button"
                    onClick={clearImagesKeepingWinner}
                    disabled={uploadBusy}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 disabled:opacity-50"
                  >
                    Limpar stories e manter vencedor
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearImages}
                  disabled={uploadBusy}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-100 disabled:opacity-50"
                >
                  Limpar semana
                </button>
              </div>
            )}
          </div>

          <form onSubmit={uploadImages} className="mt-4 grid gap-3">
            <input
              key={winnerFileInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setSelectedFiles(Array.from(event.currentTarget.files ?? []))
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#ff5c0c] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-black"
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/50">
                {selectedFiles.length
                  ? `${selectedFiles.length} imagem(ns) selecionada(s)`
                  : "Nenhuma imagem selecionada"}
                {selectedFiles.length > 0
                  ? " - as fotos serao reduzidas antes do envio"
                  : ""}
              </p>
              <button
                type="submit"
                disabled={uploadBusy || selectedFiles.length === 0}
                className="rounded-xl bg-[#ff5c0c] px-4 py-2 font-bold text-black disabled:opacity-50"
              >
                {uploadBusy ? "Enviando..." : "Enviar fotos"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black">Vencedores por semana</h2>
              <p className="mt-1 text-sm text-white/60">
                Salve manualmente o vencedor atual no historico separado.
              </p>
            </div>
          </div>

          <form
            onSubmit={archiveCurrentWinner}
            className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]"
          >
            <input
              value={winnerWeek}
              onChange={(event) => setWinnerWeek(event.target.value)}
              placeholder="Semana 1"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setSelectedWinnerFile(event.currentTarget.files?.[0] ?? null)
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#ff5c0c] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-black"
            />
            <button
              type="submit"
              disabled={winnerBusy || (!selectedWinnerFile && !data?.state.winnerFile)}
              className="rounded-xl bg-[#ff5c0c] px-4 py-2 font-bold text-black disabled:opacity-50"
            >
              {winnerBusy ? "Salvando..." : "Salvar vencedor"}
            </button>
          </form>

          <p className="mt-2 text-xs text-white/50">
            {selectedWinnerFile
              ? `Foto selecionada: ${selectedWinnerFile.name}`
              : data?.winnerUrl
                ? "Sem foto selecionada: salva o vencedor atual do sorteio."
                : "Selecione a foto vencedora da semana."}
          </p>

          {weeklyWinners.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              Nenhum vencedor salvo ainda.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {weeklyWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                >
                  <div className="relative aspect-[9/16] w-full">
                    <Image
                      src={winner.url}
                      alt={winner.week}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="truncate text-sm font-black text-white">
                      {winner.week}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteArchivedWinner(winner)}
                      disabled={winnerBusy}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-100 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {msg && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            {msg}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-black">Ranking cadastrado</h2>

          {ranking.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              Nenhum participante pontuado ainda.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              {ranking.map((participant, index) => (
                <div
                  key={participant.id}
                  className="grid gap-2 border-b border-white/10 bg-black/25 p-3 text-sm last:border-b-0 sm:grid-cols-[56px_1fr_140px_90px_96px]"
                >
                  <div className="font-black text-orange-200">#{index + 1}</div>
                  <div className="font-bold">{participant.instagram}</div>
                  <div className="text-white/70">{getLevel(participant.points).name}</div>
                  <div className="font-black">{participant.points} pts</div>
                  <button
                    type="button"
                    onClick={() => deleteParticipant(participant)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {!data ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            Carregando imagens...
          </div>
        ) : (
          <section className="mt-6">
            <h2 className="text-lg font-black">Imagens do sorteio semanal</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {data.images.map((src, index) => (
                <div
                  key={src}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="relative aspect-[9/16] w-full">
                    <Image
                      src={src}
                      alt="Participante"
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {data.imageFiles?.[index] && (
                    <button
                      type="button"
                      onClick={() => deleteImage(data.imageFiles[index])}
                      disabled={uploadBusy}
                      className="absolute right-2 top-2 rounded-lg border border-red-500/30 bg-black/75 px-3 py-1 text-xs font-bold text-red-100 backdrop-blur disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
