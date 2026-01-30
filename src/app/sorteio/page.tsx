"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";

type DrawStatus = "IDLE" | "FINISHED";
type DrawState = { status: DrawStatus; winnerFile: string | null; updatedAt: string | null };

type StateResp = {
  state: DrawState;
  images: string[];
  winnerUrl: string | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * ✅ Audio simples via WebAudio (sem arquivos)
 * - "tick" a cada troca do seletor
 * - "ta-dã" quando para no vencedor
 *
 * Obs.: browsers bloqueiam autoplay. Primeiro som só toca
 * depois de alguma interação do usuário (clique/toque).
 */
function useDrawAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  const ensure = () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return null;
    ctxRef.current = new Ctx();
    return ctxRef.current;
  };

  const unlock = async () => {
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    unlockedRef.current = true;
  };

  const tick = () => {
    const ctx = ensure();
    if (!ctx || !unlockedRef.current) return;

    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "square";
    o.frequency.setValueAtTime(1600, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.02);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    o.connect(g);
    g.connect(ctx.destination);

    o.start(t);
    o.stop(t + 0.035);
  };

  const tada = () => {
    const ctx = ensure();
    if (!ctx || !unlockedRef.current) return;

    const t = ctx.currentTime;

    // 2 tons rápidos + sustain curto
    const playTone = (freq: number, at: number, dur: number, gain: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(at);
      o.stop(at + dur + 0.02);
    };

    playTone(523.25, t, 0.18, 0.18); // C5
    playTone(659.25, t + 0.18, 0.22, 0.18); // E5
    playTone(783.99, t + 0.40, 0.35, 0.16); // G5
  };

  return { unlock, tick, tada };
}

export default function SorteioPublico() {
  const [data, setData] = useState<StateResp | null>(null);

  // seletor “rodando”
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  // “flash” quando para no vencedor
  const [winnerFlash, setWinnerFlash] = useState(false);

  // som on/off
  const [soundOn, setSoundOn] = useState(true);

  // para detectar transição IDLE -> FINISHED
  const lastUpdatedRef = useRef<string | null>(null);

  const audio = useDrawAudio();

  async function fetchState() {
    const r = await fetch("/api/draw/state", { cache: "no-store" });
    const j = (await r.json()) as StateResp;
    setData(j);
    return j;
  }

  async function runAnimation(images: string[], winnerUrl: string) {
    const winnerIndex = images.findIndex((x) => x === winnerUrl);
    if (winnerIndex < 0) return;

    setIsAnimating(true);
    setWinnerFlash(false);

    const n = images.length;

    // começa em um ponto aleatório
    let cur = Math.floor(Math.random() * n);
    setActiveIndex(cur);

    // ✅ DURAÇÃO TOTAL DO GIRO (ajuste aqui)
    const totalMs = 8200; // mais tempo e mais "sorteio"
    const start = performance.now();

    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    // passos aleatórios:
    // - início: pulos maiores (mistura geral)
    // - final: pulos menores (tensão e precisão)
    const pickStep = (t: number) => {
      const maxStep = Math.round(8 - 6 * t); // 8 → 2
      return randInt(1, clamp(maxStep, 2, 8));
    };

    // desaceleração bonita
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    // Loop principal: roda pelo tempo total, com delay crescendo
    while (true) {
      const now = performance.now();
      const raw = (now - start) / totalMs;
      const t = clamp(raw, 0, 1);
      const e = easeOutCubic(t);

      // Delay: rápido -> devagar
      const delay = Math.round(28 + 290 * e); // ~28ms até ~318ms

      // pulo aleatório controlado
      const step = pickStep(t);
      cur = (cur + step) % n;
      setActiveIndex(cur);

      if (soundOn) audio.tick();

      await sleep(delay);
      if (t >= 1) break;
    }

    // Final dramático: encaixa no vencedor 1 a 1
    const finalDelays = [220, 250, 290, 340, 420];

    let safety = 0;
    while (cur !== winnerIndex && safety < n + 12) {
      cur = (cur + 1) % n;
      setActiveIndex(cur);

      if (soundOn) audio.tick();

      const d = finalDelays[Math.min(safety, finalDelays.length - 1)];
      await sleep(d);

      safety++;
    }

    // vitória
    await sleep(160);
    setWinnerFlash(true);
    if (soundOn) audio.tada();
    await sleep(650);

    setIsAnimating(false);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      // primeira carga
      const first = await fetchState();
      lastUpdatedRef.current = first.state.updatedAt;

      // polling 1s
      while (alive) {
        const j = await fetchState();

        // detecta “novo vencedor” (updatedAt mudou)
        if (
          !isAnimating &&
          j.state.status === "FINISHED" &&
          j.winnerUrl &&
          j.state.updatedAt &&
          j.state.updatedAt !== lastUpdatedRef.current
        ) {
          lastUpdatedRef.current = j.state.updatedAt;
          await runAnimation(j.images, j.winnerUrl);
        }

        await sleep(1000);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, soundOn]);

  const showWinnerOnly = data?.state.status === "FINISHED" && !!data?.winnerUrl && !isAnimating;

  const imagesToRender = useMemo(() => {
    if (!data) return [];
    if (showWinnerOnly) return [data.winnerUrl!];
    return data.images;
  }, [data, showWinnerOnly]);

  const statusLabel =
    data?.state.status === "IDLE"
      ? "Aguardando"
      : data?.state.status === "FINISHED"
      ? "Finalizado"
      : "—";

  const totalImgs = data?.images?.length ?? 0;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-black text-white"
      onPointerDown={() => audio.unlock()} // desbloqueia áudio com 1 toque/clique
    >
      {/* Fundo com glow laranja */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff5c0c]/18 blur-[120px]" />
        <div className="absolute -bottom-52 left-10 h-[520px] w-[520px] rounded-full bg-[#ff5c0c]/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,92,12,0.08),rgba(0,0,0,0.92)_55%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/75"
            >
              <Sparkles className="h-4 w-4 text-[#ff5c0c]" />
              Titans Race • Sorteio
            </motion.div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl">
              Sorteio ao vivo <span className="text-[#ff5c0c]">•</span>
            </h1>

            <p className="mt-2 text-sm text-white/70 md:text-[15px]">
              Acompanhe o sorteio semanal. Após finalizar, o vencedor fica fixo aqui durante a semana.
            </p>
          </div>

          {/* Card de status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:w-[380px]"
          >
            {!data ? (
              <div className="text-sm text-white/70">Carregando status…</div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">Status</div>
                  <div className="mt-1 text-sm font-semibold">
                    {statusLabel}
                    {data.state.status === "IDLE" && (
                      <span className="ml-2 text-white/50">— aguardando iniciar</span>
                    )}
                    {data.state.status === "FINISHED" && data.winnerUrl && (
                      <span className="ml-2 text-emerald-300">— vencedor definido</span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-white/55">
                    Participações da semana:{" "}
                    <span className="text-white/80">{totalImgs}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSoundOn((s) => !s)}
                    className="rounded-full border border-white/10 bg-black/40 p-2 text-white/80 transition hover:bg-black/60"
                    aria-label={soundOn ? "Desativar som" : "Ativar som"}
                    title={soundOn ? "Som ligado" : "Som desligado"}
                  >
                    {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>

                  <div
                    className={[
                      "mt-1 h-2 w-2 rounded-full",
                      data.state.status === "IDLE" ? "bg-[#ff5c0c]" : "bg-emerald-400",
                    ].join(" ")}
                    title="Indicador"
                  />
                </div>
              </div>
            )}

            {/* microtexto: desbloqueio áudio */}
           
          </motion.div>
        </div>

        {/* Conteúdo */}
        {!data ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
            Carregando imagens…
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imagesToRender.map((src, idx) => {
                const isActive = !showWinnerOnly && idx === activeIndex;
                const isWinnerOnly = showWinnerOnly;

                return (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={[
                      "group relative overflow-hidden rounded-3xl border bg-white/5",
                      "border-white/10",
                      "shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                      isActive
                        ? "border-[#ff5c0c] shadow-[0_0_0_4px_rgba(255,92,12,0.22)]"
                        : "",
                      isWinnerOnly
                        ? "border-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]"
                        : "",
                    ].join(" ")}
                  >
                    <img
                      src={src}
                      alt="Participante"
                      className="aspect-[9/16] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                    {/* Seletor ativo */}
                    {isActive && (
                      <motion.div
                        layoutId="selector"
                        className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-[#ff5c0c]"
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.08 }}
                      />
                    )}

                    {/* Flash de vitória quando para */}
                    <AnimatePresence>
                      {isActive && winnerFlash && (
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-3xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="absolute inset-0 bg-[#ff5c0c]/18" />
                          <div className="absolute -top-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#ff5c0c]/30 blur-[40px]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Badge vencedor da semana */}
                    {isWinnerOnly && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                        <Trophy className="h-4 w-4 text-[#ff5c0c]" />
                        Vencedor da semana
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 md:flex-row md:items-center">
              <div>
                <span className="text-white/75">Titans Race</span> • Sorteio semanal
              </div>
              
            </div>
          </>
        )}
      </div>
    </main>
  );
}
