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

const LEVELS = [
  { name: "Recruta", min: 0, max: 14 },
  { name: "Guerreiro", min: 15, max: 34 },
  { name: "Gladiador", min: 35, max: 59 },
  { name: "Titan", min: 60, max: null },
];

function getLevel(points: number) {
  return (
    [...LEVELS]
      .reverse()
      .find((level) => points >= level.min) ?? LEVELS[0]
  );
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
  const [msg, setMsg] = useState("");

  const key =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("key") || ""
      : "";

  const ranking = useMemo(
    () => [...participants].sort((a, b) => b.points - a.points),
    [participants],
  );

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

  useEffect(() => {
    fetchState().catch(() => {});
    fetchParticipants().catch(() => {});
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
      selectedFiles.forEach((file) => formData.append("files", file));

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
      setMsg("Imagens enviadas. A semana foi resetada para um novo sorteio.");
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

  async function savePoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!key) {
      setMsg("Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");
      return;
    }

    setPointsBusy(true);
    setMsg("");
    try {
      const response = await fetch(
        `/api/league/participants?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram,
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
                  placeholder="@atleta"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
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
              <button
                type="button"
                onClick={clearImages}
                disabled={uploadBusy}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-100 disabled:opacity-50"
              >
                Limpar semana
              </button>
            )}
          </div>

          <form onSubmit={uploadImages} className="mt-4 grid gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
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
