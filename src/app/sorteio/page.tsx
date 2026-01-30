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
 * Áudio via WebAudio (sem arquivos):
 * - tick a cada troca do seletor
 * - tada ao parar no vencedor
 * Obs.: precisa de 1 interação do usuário para liberar áudio.
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
    g.gain.exponentialRampToValueAtTime(0.10, t + 0.008);
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

    playTone(523.25, t, 0.16, 0.16); // C5
    playTone(659.25, t + 0.16, 0.22, 0.16); // E5
    playTone(783.99, t + 0.38, 0.36, 0.14); // G5
  };

  return { unlock, tick, tada };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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

  // ✅ roleta com aleatoriedade + desaceleração + mais tempo
  async function runAnimation(images: string[], winnerUrl: string) {
    const winnerIndex = images.findIndex((x) => x === winnerUrl);
    if (winnerIndex < 0) return;

    setIsAnimating(true);
    setWinnerFlash(false);

    const n = images.length;

    // começa em um ponto aleatório
    let cur = Math.floor(Math.random() * n);
    setActiveIndex(cur);

    // Duração total do giro
    const totalMs = 8200;
    const start = performance.now();

    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // desaceleração
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    // passo aleatório: início “salta” mais; final “salta” pouco
    const pickStep = (t: number) => {
      const maxStep = Math.round(8 - 6 * t); // 8 -> 2
      return randInt(1, clamp(maxStep, 2, 8));
    };

    // Loop principal
    while (true) {
      const now = performance.now();
      const raw = (now - start) / totalMs;
      const t = clamp(raw, 0, 1);
      const e = easeOutCubic(t);

      // Delay cresce: rápido -> lento
      const delay = Math.round(28 + 290 * e);

      const step = pickStep(t);
      cur = (cur + step) % n;
      setActiveIndex(cur);

      if (soundOn) audio.tick();
      await sleep(delay);

      if (t >= 1) break;
    }

    // Final dramático: 1 a 1 até vencer
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
      const first = await fetchState();
      lastUpdatedRef.current = first.state.updatedAt;

      while (alive) {
        const j = await fetchState();

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
  const totalImgs = data?.images?.length ?? 0;

  // ✅ Durante o sorteio: mostramos TODAS em mosaico
  // ✅ Quando finaliza: vencedor grande
  const gridImages = useMemo(() => {
    if (!data) return [];
    return data.images;
  }, [data]);

  const winnerUrl = data?.winnerUrl ?? null;

  // ✅ Ajuste automático de colunas no mobile pra caber tudo
  // (quanto mais imagens, mais colunas, e as miniaturas ficam menores)
  const columnsMobile = useMemo(() => {
    if (totalImgs <= 12) return 4;
    if (totalImgs <= 20) return 5;
    return 6;
  }, [totalImgs]);

  // Tailwind não aceita grid-cols dinâmico direto, então usamos style inline para gridTemplateColumns
  const mosaicStyle: React.CSSProperties = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columnsMobile}, minmax(0, 1fr))`,
    }),
    [columnsMobile]
  );

  const statusLabel =
    data?.state.status === "IDLE" ? "Aguardando" : data?.state.status === "FINISHED" ? "Finalizado" : "—";

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-black text-white"
      onPointerDown={() => audio.unlock()}
    >
      {/* Fundo com glow laranja */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff5c0c]/18 blur-[120px]" />
        <div className="absolute -bottom-52 left-10 h-[520px] w-[520px] rounded-full bg-[#ff5c0c]/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,92,12,0.08),rgba(0,0,0,0.92)_55%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:py-12">
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

           
          </div>

          {/* Card de status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:w-[420px]"
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
                    {data.state.status === "FINISHED" && winnerUrl && (
                      <span className="ml-2 text-emerald-300">— vencedor definido</span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-white/55">
                    Participações da semana: <span className="text-white/80">{totalImgs}</span>
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
                      data?.state.status === "IDLE" ? "bg-[#ff5c0c]" : "bg-emerald-400",
                    ].join(" ")}
                    title="Indicador"
                  />
                </div>
              </div>
            )}

           
          </motion.div>
        </div>

        {/* Conteúdo */}
        {!data ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
            Carregando imagens…
          </div>
        ) : (
          <>
            {/* ✅ Modo vencedor grande */}
            {showWinnerOnly && winnerUrl ? (
              <section className="mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto max-w-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      <Trophy className="h-4 w-4 text-[#ff5c0c]" />
                      Vencedor da semana
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl border border-emerald-300/60 bg-white/5 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]">
                    <img src={winnerUrl} alt="Vencedor" className="aspect-[9/16] w-full object-cover" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    <div className="pointer-events-none absolute -top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#ff5c0c]/20 blur-[55px]" />

                    <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Titans Race • #ff5c0c
                    </div>
                  </div>
                </motion.div>
              </section>
            ) : (
              /* ✅ Mosaico compacto que cabe no viewport */
              <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-white/60">
                   
                  </div>

                  
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-2 md:p-3">
                  {/* container com altura fixa pra caber no mobile */}
                  <div className="h-[70vh] md:h-[62vh]">
                    <div
                      className="grid h-full gap-1.5 md:gap-2"
                      style={mosaicStyle}
                    >
                      {gridImages.map((src, idx) => {
                        const isActive = idx === activeIndex;

                        return (
                          <motion.div
                            key={src}
                            className={[
                              "relative overflow-hidden rounded-xl border bg-black/20",
                              "border-white/10",
                              isActive ? "border-[#ff5c0c]" : "",
                            ].join(" ")}
                            animate={
                              isActive
                                ? {
                                    boxShadow: "0 0 0 3px rgba(255,92,12,0.22)",
                                  }
                                : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
                            }
                            transition={{ duration: 0.08 }}
                          >
                            {/* miniatura quadrada pra caber muita coisa */}
                            <img
                              src={src}
                              alt="Participante"
                              className="h-full w-full object-cover"
                            />

                            {/* Flash de vitória ao parar */}
                            <AnimatePresence>
                              {isActive && winnerFlash && (
                                <motion.div
                                  className="pointer-events-none absolute inset-0"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="absolute inset-0 bg-[#ff5c0c]/20" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Rodapé */}
            <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 md:flex-row md:items-center">
              <div>
                <span className="text-white/75">Titans Race</span> • Sorteio semanal (atividade física)
              </div>
              <div className="text-white/55">
                Preto & laranja: <span className="font-semibold text-[#ff5c0c]">#ff5c0c</span>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
