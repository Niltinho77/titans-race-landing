"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Camera,
  Crown,
  Flame,
  Medal,
  Shield,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type DrawStatus = "IDLE" | "FINISHED";
type DrawState = {
  status: DrawStatus;
  winnerFile: string | null;
  updatedAt: string | null;
};

type StateResp = {
  state: DrawState;
  images: string[];
  winnerUrl: string | null;
};

type LeagueResp = {
  participants: LeagueParticipant[];
};

type WeeklyWinner = {
  id: string;
  week: string;
  url: string;
};

type WeeklyWinnersResp = {
  winners: WeeklyWinner[];
};

type LeagueLevel = {
  name: "Recruta" | "Guerreiro" | "Gladiador" | "Titan";
  min: number;
  max: number | null;
  icon: React.ElementType;
  asset: string;
  accent: string;
  glow: string;
};

type LeagueParticipant = {
  instagram: string;
  points: number;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const LEVELS: LeagueLevel[] = [
  {
    name: "Recruta",
    min: 0,
    max: 14,
    icon: Shield,
    asset: "/sorteio/categorias/recruta.webp",
    accent: "from-zinc-500 to-zinc-200",
    glow: "shadow-zinc-500/20",
  },
  {
    name: "Guerreiro",
    min: 15,
    max: 34,
    icon: Flame,
    asset: "/sorteio/categorias/guerreiro.webp",
    accent: "from-orange-700 to-orange-300",
    glow: "shadow-orange-500/25",
  },
  {
    name: "Gladiador",
    min: 35,
    max: 59,
    icon: Medal,
    asset: "/sorteio/categorias/gladiador.webp",
    accent: "from-amber-500 to-yellow-200",
    glow: "shadow-amber-400/25",
  },
  {
    name: "Titan",
    min: 60,
    max: null,
    icon: Crown,
    asset: "/sorteio/categorias/titan.webp",
    accent: "from-emerald-400 to-cyan-200",
    glow: "shadow-emerald-400/25",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function getLevel(points: number) {
  return (
    [...LEVELS]
      .reverse()
      .find((level) => points >= level.min) ?? LEVELS[0]
  );
}

function getNextLevel(points: number) {
  return LEVELS.find((level) => level.min > points) ?? null;
}

function getProgress(points: number) {
  const current = getLevel(points);
  const next = getNextLevel(points);

  if (!next) {
    return 100;
  }

  const currentStart = current.min;
  const target = next.min;
  return clamp(((points - currentStart) / (target - currentStart)) * 100, 0, 100);
}

function formatLevelRange(level: LeagueLevel) {
  return level.max === null
    ? `${level.min}+ pontos`
    : `${level.min} a ${level.max} pontos`;
}

function LevelAsset({
  level,
  className = "h-9 w-9",
  imageClassName = "object-contain",
}: {
  level: LeagueLevel;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl ${className}`}
      title={level.name}
      aria-label={`Nível ${level.name}`}
    >
      <Image
        src={level.asset}
        alt={level.name}
        fill
        sizes="64px"
        className={imageClassName}
        unoptimized
      />
    </div>
  );
}

function useDrawAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  const ensure = () => {
    if (ctxRef.current) return ctxRef.current;
    const AudioCtx =
      window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioCtx) return null;
    ctxRef.current = new AudioCtx();
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
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1600, t);
    oscillator.frequency.exponentialRampToValueAtTime(900, t + 0.02);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.035);
  };

  const tada = () => {
    const ctx = ensure();
    if (!ctx || !unlockedRef.current) return;

    const t = ctx.currentTime;

    const playTone = (freq: number, at: number, dur: number, gainLevel: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(gainLevel, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + dur + 0.02);
    };

    playTone(523.25, t, 0.16, 0.16);
    playTone(659.25, t + 0.16, 0.22, 0.16);
    playTone(783.99, t + 0.38, 0.36, 0.14);
  };

  return { unlock, tick, tada };
}

export default function SorteioPublico() {
  const [data, setData] = useState<StateResp | null>(null);
  const [leagueParticipants, setLeagueParticipants] = useState<LeagueParticipant[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinner[]>([]);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerFlash, setWinnerFlash] = useState(false);
  const [soundOn] = useState(true);

  const lastUpdatedRef = useRef<string | null>(null);
  const audio = useDrawAudio();

  async function fetchState() {
    const response = await fetch("/api/draw/state", { cache: "no-store" });
    const json = (await response.json()) as StateResp;
    setData(json);
    return json;
  }

  async function fetchLeagueParticipants() {
    const response = await fetch("/api/league/participants", { cache: "no-store" });
    const json = (await response.json()) as LeagueResp;
    setLeagueParticipants(json.participants ?? []);
    setLeagueLoading(false);
  }

  async function fetchWeeklyWinners() {
    const response = await fetch("/api/league/winners", { cache: "no-store" });
    const json = (await response.json()) as WeeklyWinnersResp;
    setWeeklyWinners(json.winners ?? []);
  }

  async function runAnimation(images: string[], winnerUrl: string) {
    const winnerIndex = images.findIndex((image) => image === winnerUrl);
    if (winnerIndex < 0) return;

    setIsAnimating(true);
    setWinnerFlash(false);

    const totalImages = images.length;
    let current = Math.floor(Math.random() * totalImages);
    setActiveIndex(current);

    const totalMs = 8200;
    const start = performance.now();
    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const pickStep = (t: number) => {
      const maxStep = Math.round(8 - 6 * t);
      return randInt(1, clamp(maxStep, 2, 8));
    };

    while (true) {
      const now = performance.now();
      const raw = (now - start) / totalMs;
      const t = clamp(raw, 0, 1);
      const eased = easeOutCubic(t);
      const delay = Math.round(28 + 290 * eased);

      current = (current + pickStep(t)) % totalImages;
      setActiveIndex(current);

      if (soundOn) audio.tick();
      await sleep(delay);

      if (t >= 1) break;
    }

    const finalDelays = [220, 250, 290, 340, 420];
    let safety = 0;

    while (current !== winnerIndex && safety < totalImages + 12) {
      current = (current + 1) % totalImages;
      setActiveIndex(current);

      if (soundOn) audio.tick();

      const delay = finalDelays[Math.min(safety, finalDelays.length - 1)];
      await sleep(delay);
      safety++;
    }

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
        const json = await fetchState();

        if (
          !isAnimating &&
          json.state.status === "FINISHED" &&
          json.winnerUrl &&
          json.state.updatedAt &&
          json.state.updatedAt !== lastUpdatedRef.current
        ) {
          lastUpdatedRef.current = json.state.updatedAt;
          await runAnimation(json.images, json.winnerUrl);
        }

        await sleep(1000);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, soundOn]);

  useEffect(() => {
    let alive = true;

    async function loadLeague() {
      while (alive) {
        await fetchLeagueParticipants().catch(() => {
          if (alive) setLeagueLoading(false);
        });
        await fetchWeeklyWinners().catch(() => {});
        await sleep(15000);
      }
    }

    loadLeague();

    return () => {
      alive = false;
    };
  }, []);

  const totalImgs = data?.images?.length ?? 0;
  const winnerUrl = data?.winnerUrl ?? null;
  const gridImages = useMemo(() => data?.images ?? [], [data]);
  const showWinnerOnly =
    data?.state.status === "FINISHED" && !!winnerUrl && !isAnimating;

  const columnsMobile = useMemo(() => {
    if (totalImgs <= 12) return 4;
    if (totalImgs <= 20) return 5;
    return 6;
  }, [totalImgs]);

  const mosaicStyle: React.CSSProperties = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columnsMobile}, minmax(0, 1fr))`,
    }),
    [columnsMobile],
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
      onPointerDown={() => audio.unlock()}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#ff5c0c]/20 blur-[130px]" />
        <div className="absolute -bottom-56 right-0 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,92,12,0.12),rgba(5,5,5,0.96)_58%)]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 md:py-10">
        <LeagueHeader
          participants={leagueParticipants}
          isLoading={leagueLoading}
        />

        {showWinnerOnly && winnerUrl && (
          <WeeklyWinnerHighlight winnerUrl={winnerUrl} />
        )}

        <WeeklyWinnersArchive winners={weeklyWinners} />

        <SimpleRulesCard />

        <SimpleParticipantProgress
          participants={leagueParticipants}
          isLoading={leagueLoading}
        />
        <SimpleLeagueRanking
          participants={leagueParticipants}
          isLoading={leagueLoading}
        />

        <WeeklyDraw
          data={data}
          gridImages={gridImages}
          winnerUrl={winnerUrl}
          showWinnerOnly={showWinnerOnly}
          activeIndex={activeIndex}
          winnerFlash={winnerFlash}
          mosaicStyle={mosaicStyle}
        />
      </div>
    </main>
  );
}

function LeagueHeader({
  participants,
  isLoading,
}: {
  participants: LeagueParticipant[];
  isLoading: boolean;
}) {
  const topFive = useMemo(
    () => [...participants].sort((a, b) => b.points - a.points).slice(0, 5),
    [participants],
  );
  const statusLabel = "";
  const totalImgs = 0;
  const soundOn = false;
  const onToggleSound = () => {};
  const drawStatus: DrawStatus | undefined = undefined;

  return (
    <header className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur md:p-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-100">
          <Sparkles className="h-4 w-4 text-[#ff5c0c]" />
          Temporada semanal
        </div>

        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl md:text-7xl">
          Liga <span className="text-[#ff5c0c]">Titans</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-zinc-300 md:text-xl">
          Treinou, postou e marcou a Titans? Você já está no jogo.
        </p>

      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-[1.5rem] border border-white/10 bg-black/45 p-4 backdrop-blur"
      >
        <div className="grid gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Top 5
          </p>
          {isLoading ? (
            <p className="text-sm font-semibold text-zinc-400">Carregando...</p>
          ) : topFive.length === 0 ? (
            <p className="text-sm font-semibold text-zinc-400">Ranking vazio.</p>
          ) : (
            topFive.map((participant, index) => (
              <div
                key={participant.instagram}
                className="grid grid-cols-[32px_1fr_56px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <span className="text-sm font-black text-orange-200">
                  #{index + 1}
                </span>
                <span className="truncate text-sm font-black text-white">
                  {participant.instagram}
                </span>
                <span className="text-right text-sm font-black text-white">
                  {participant.points}
                </span>
              </div>
            ))
          )}
        </div>
        {false && (
        <div className="hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Sorteio semanal
            </p>
            <p className="mt-1 text-lg font-black text-white">{statusLabel}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Participações da semana:{" "}
              <span className="font-bold text-zinc-100">{totalImgs}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
              aria-label={soundOn ? "Desativar som" : "Ativar som"}
              title={soundOn ? "Som ligado" : "Som desligado"}
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
            <div
              className={[
                "h-2.5 w-2.5 rounded-full shadow-lg",
                drawStatus === "FINISHED"
                  ? "bg-emerald-400 shadow-emerald-400/60"
                  : "bg-[#ff5c0c] shadow-orange-500/60",
              ].join(" ")}
            />
          </div>
        </div>
        )}
      </motion.div>
    </header>
  );
}

/*
function RulesCard() {
  const rules = [
    {
      title: "Treinou",
      text: "Fez o treino do dia.",
      icon: Flame,
    },
    {
      title: "Postou",
      text: "Colocou nos stories.",
      icon: Camera,
    },
    {
      title: "Marcou",
      text: "Marcou a Titans e entrou na Liga.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff5c0c] text-black shadow-lg shadow-orange-500/30">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Como participar
          </p>
          <h2 className="text-2xl font-black text-white">
            Simples: treinou, postou, marcou
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
          <div
            key={rule.title}
            className="rounded-2xl border border-white/10 bg-black/35 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-lg font-black text-white">{rule.title}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-300">
              {rule.text}
            </p>
          </div>
        );
        })}
      </div>

      <p className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm font-semibold text-orange-100">
        Cada dia válido vale 1 ponto. Seus pontos sobem no ranking e ajudam no
        sorteio da semana.
      </p>
    </section>
  );
}

function LevelCards() {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
          Sistema de níveis
        </p>
        <h2 className="text-2xl font-black text-white">Conquistas da Liga</h2>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LEVELS.map((level) => {
          const Icon = level.icon;
          return (
            <div
              key={level.name}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl ${level.glow}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${level.accent}`}
              />
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${level.accent} text-black`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-black text-white">{level.name}</p>
                  <p className="text-xs font-semibold text-zinc-400">
                    {formatLevelRange(level)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ParticipantProgress({
  participants,
  isLoading,
}: {
  participants: LeagueParticipant[];
  isLoading: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Barra de XP
          </p>
          <h2 className="text-2xl font-black text-white">
            Seu avanço na Liga
          </h2>
        </div>
        <p className="text-xs font-medium text-zinc-400">
          Quanto mais treinos válidos, mais perto do nível Titan.
        </p>
      </div>

      {isLoading ? (
        <EmptyLeagueState text="Carregando participantes da Liga..." />
      ) : participants.length === 0 ? (
        <EmptyLeagueState text="A Liga ainda não tem pontuação registrada." />
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {participants.map((participant) => {
          const level = getLevel(participant.points);
          const nextLevel = getNextLevel(participant.points);
          const progress = getProgress(participant.points);
          return (
            <div
              key={participant.instagram}
              className="rounded-2xl border border-white/10 bg-black/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">
                    {participant.instagram}
                  </p>
                  <p className="text-xs font-semibold text-orange-200">
                    {level.name}
                  </p>
                </div>
                <div className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-100">
                  {participant.points} XP
                </div>
              </div>

              <XpBar progress={progress} className="mt-4 h-3" />

              <p className="mt-3 text-xs text-zinc-400">
                {nextLevel
                  ? `${Math.max(0, nextLevel.min - participant.points)} pontos para ${nextLevel.name}`
                  : "Nível máximo alcançado"}
              </p>
            </div>
          );
          })}
        </div>
      )}
    </section>
  );
}

function LeagueRanking({
  participants,
  isLoading,
}: {
  participants: LeagueParticipant[];
  isLoading: boolean;
}) {
  const ranking = useMemo(
    () => [...participants].sort((a, b) => b.points - a.points),
    [participants],
  );

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-200">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Placar geral
          </p>
          <h2 className="text-2xl font-black text-white">Ranking da Liga</h2>
        </div>
      </div>

      {isLoading ? (
        <EmptyLeagueState text="Carregando ranking..." />
      ) : ranking.length === 0 ? (
        <EmptyLeagueState text="O ranking aparece aqui quando a Liga começar a pontuar." />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          {ranking.map((participant, index) => {
          const level = getLevel(participant.points);
          return (
            <div
              key={participant.instagram}
              className="grid grid-cols-[48px_1fr] gap-3 border-b border-white/10 bg-white/[0.03] p-3 last:border-b-0 md:grid-cols-[64px_1.2fr_1fr_90px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/50 text-lg font-black text-orange-200">
                #{index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black text-white">
                  {participant.instagram}
                </p>
                <p className="text-xs font-semibold text-zinc-400 md:hidden">
                  {level.name} - {participant.points} pontos
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 md:block">
                  {level.name}
                </p>
                <XpBar progress={getProgress(participant.points)} className="mt-1 h-2" />
              </div>
              <div className="hidden text-right text-sm font-black text-white md:block">
                {participant.points} pts
              </div>
            </div>
          );
          })}
        </div>
      )}
    </section>
  );
}

*/
function EmptyLeagueState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-medium text-zinc-400">
      {text}
    </div>
  );
}

function SimpleRulesCard() {
  const rules = [
    { title: "Treinou", text: "+1 ponto", icon: Flame },
    { title: "Postou", text: "story", icon: Camera },
    { title: "Marcou", text: "@titans", icon: Sparkles },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {rules.map((rule) => {
        const Icon = rule.icon;
        return (
          <div
            key={rule.title}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black text-white">{rule.title}</p>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                {rule.text}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function WeeklyWinnerHighlight({ winnerUrl }: { winnerUrl: string }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-emerald-300/25 bg-emerald-400/[0.08] shadow-2xl shadow-emerald-950/25">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative min-h-[420px] overflow-hidden bg-black md:min-h-[520px]">
          <Image
            src={winnerUrl}
            alt="Vencedor da semana"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-black/65 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
            <Trophy className="h-4 w-4 text-[#ff5c0c]" />
            Vencedor da semana
          </div>
        </div>

        <div className="flex flex-col justify-center p-5 md:p-8 lg:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Destaque da Liga Titans
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase text-white md:text-5xl">
            Campeao da semana
          </h2>
          <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-zinc-300 md:text-lg">
            O story vencedor fica fixado aqui ate o proximo sorteio semanal.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Status
              </p>
              <p className="mt-1 text-xl font-black text-emerald-200">
                Vencedor definido
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Premio
              </p>
              <p className="mt-1 text-xl font-black text-orange-100">
                Destaque na Liga
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyWinnersArchive({ winners }: { winners: WeeklyWinner[] }) {
  if (!winners.length) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200">
          <Crown className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-black text-white">Vencedores</h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {winners.map((winner) => (
          <div
            key={winner.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
          >
            <div className="relative aspect-[9/16] w-full bg-black">
              <Image
                src={winner.url}
                alt={winner.week}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                <p className="text-lg font-black text-white">{winner.week}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimpleParticipantProgress({
  participants,
  isLoading,
}: {
  participants: LeagueParticipant[];
  isLoading: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-white">Pontos</h2>
        <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-100">
          níveis
        </span>
      </div>

      {isLoading ? (
        <EmptyLeagueState text="Carregando participantes..." />
      ) : participants.length === 0 ? (
        <EmptyLeagueState text="Sem pontos registrados ainda." />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEVELS.map((level) => {
              return (
                <div
                  key={level.name}
                  className="rounded-2xl border border-white/10 bg-black/35 p-3"
                >
                  <LevelAsset level={level} className="mb-2 h-10 w-10" />
                  <p className="text-sm font-black text-white">{level.name}</p>
                  <p className="text-[11px] font-semibold text-zinc-500">
                    {formatLevelRange(level)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {participants.map((participant) => (
              <ParticipantScoreCard
                key={participant.instagram}
                participant={participant}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ParticipantScoreCard({
  participant,
}: {
  participant: LeagueParticipant;
}) {
  const level = getLevel(participant.points);
  const nextLevel = getNextLevel(participant.points);
  const progress = getProgress(participant.points);
  const pointsToNext = nextLevel
    ? Math.max(0, nextLevel.min - participant.points)
    : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black text-white">
            {participant.instagram}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <LevelAsset
              level={level}
              className={`h-11 w-11 shadow-lg ${level.glow}`}
            />
            <p className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-100">
              {level.name}
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2 text-right">
          <p className="text-4xl font-black leading-none text-white sm:text-5xl">
            {participant.points}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            pontos
          </p>
        </div>
      </div>

      <XpBar progress={progress} className="mt-5 h-4" />

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="text-xs font-semibold text-zinc-400">
          Próximo nível
        </span>
        <span className="text-sm font-black text-orange-200">
          {nextLevel ? `faltam ${pointsToNext} pts` : "nível máximo"}
        </span>
      </div>
    </div>
  );
}

function SimpleLeagueRanking({
  participants,
  isLoading,
}: {
  participants: LeagueParticipant[];
  isLoading: boolean;
}) {
  const ranking = useMemo(
    () => [...participants].sort((a, b) => b.points - a.points),
    [participants],
  );

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-200">
          <Award className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-black text-white">Ranking</h2>
      </div>

      {isLoading ? (
        <EmptyLeagueState text="Carregando ranking..." />
      ) : ranking.length === 0 ? (
        <EmptyLeagueState text="Ranking vazio." />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          {ranking.map((participant, index) => {
            const level = getLevel(participant.points);
            const nextLevel = getNextLevel(participant.points);
            const pointsToNext = nextLevel
              ? Math.max(0, nextLevel.min - participant.points)
              : 0;

            return (
              <div
                key={participant.instagram}
                className="grid grid-cols-[40px_minmax(0,1fr)_56px] items-center gap-2 border-b border-white/10 bg-white/[0.03] p-3 last:border-b-0 md:grid-cols-[56px_minmax(0,1fr)_140px_minmax(0,1fr)_92px] md:gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/50 text-base font-black text-orange-200">
                  #{index + 1}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">
                    {participant.instagram}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-orange-200 md:hidden">
                    <LevelAsset level={level} className="h-5 w-5 rounded-md" />
                    <span>{level.name}</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-2">
                    <LevelAsset level={level} className="h-8 w-8 rounded-lg" />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      {level.name}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-black text-orange-200">
                    {nextLevel ? `faltam ${pointsToNext}` : "máximo"}
                  </p>
                </div>
                <div className="min-w-0 text-right md:col-start-5 md:row-start-1">
                  <p className="whitespace-nowrap text-xl font-black leading-none text-white md:text-2xl">
                    {participant.points}
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 md:text-[10px] md:tracking-[0.18em]">
                    pts
                  </p>
                </div>
                <div className="col-span-3 md:col-span-1 md:col-start-4 md:row-start-1">
                  <XpBar
                    progress={getProgress(participant.points)}
                    className="mt-1 h-2.5 md:mt-0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WeeklyDraw({
  data,
  gridImages,
  winnerUrl,
  showWinnerOnly,
  activeIndex,
  winnerFlash,
  mosaicStyle,
}: {
  data: StateResp | null;
  gridImages: string[];
  winnerUrl: string | null;
  showWinnerOnly: boolean;
  activeIndex: number;
  winnerFlash: boolean;
  mosaicStyle: React.CSSProperties;
}) {
  return (
    <section className="rounded-[1.5rem] border border-orange-400/20 bg-orange-500/[0.06] p-4 shadow-2xl shadow-orange-950/30 md:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            Sorteio semanal da Liga
          </p>
          <h2 className="text-3xl font-black text-white">
            Sorteio da semana
          </h2>
        </div>
        <p className="text-xs font-medium text-zinc-400">
          Quem pontuou na semana aparece na disputa.
        </p>
      </div>

      {!data ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-6 text-sm text-zinc-300">
          Carregando imagens...
        </div>
      ) : showWinnerOnly && winnerUrl ? (
        <WinnerCard winnerUrl={winnerUrl} />
      ) : (
        <DrawMosaic
          gridImages={gridImages}
          activeIndex={activeIndex}
          winnerFlash={winnerFlash}
          mosaicStyle={mosaicStyle}
        />
      )}
    </section>
  );
}

function WinnerCard({ winnerUrl }: { winnerUrl: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto mt-6 max-w-md"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
        <Trophy className="h-4 w-4 text-[#ff5c0c]" />
        Vencedor da semana
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/70 bg-black shadow-[0_0_0_6px_rgba(52,211,153,0.12),0_0_80px_rgba(255,92,12,0.22)]">
        <div className="relative aspect-[9/16] w-full">
          <Image
            src={winnerUrl}
            alt="Vencedor da semana"
            fill
            sizes="(min-width: 768px) 448px, 90vw"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-12 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-[#ff5c0c]/25 blur-[60px]" />
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-200">
            Card épico desbloqueado
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            Campeão da semana
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function DrawMosaic({
  gridImages,
  activeIndex,
  winnerFlash,
  mosaicStyle,
}: {
  gridImages: string[];
  activeIndex: number;
  winnerFlash: boolean;
  mosaicStyle: React.CSSProperties;
}) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/45 p-2 md:p-3">
      <div className="h-[68vh] md:h-[62vh]">
        <div className="grid h-full gap-1.5 md:gap-2" style={mosaicStyle}>
          {gridImages.map((src, idx) => {
            const isActive = idx === activeIndex;

            return (
              <motion.div
                key={src}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                animate={
                  isActive
                    ? {
                        transform: "scale(1.03)",
                        boxShadow:
                          "0 0 0 4px rgba(255,92,12,0.95), 0 0 40px rgba(255,92,12,0.55), 0 0 90px rgba(255,92,12,0.22)",
                        borderColor: "rgba(255,92,12,0.95)",
                      }
                    : {
                        transform: "scale(1)",
                        boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                        borderColor: "rgba(255,255,255,0.10)",
                      }
                }
                transition={{ duration: 0.09 }}
              >
                <Image
                  src={src}
                  alt="Participante"
                  fill
                  sizes="(min-width: 768px) 14vw, 18vw"
                  className="object-cover"
                  unoptimized
                />

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="pointer-events-none absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.08 }}
                    >
                      <div className="absolute inset-0 bg-[#ff5c0c]/18" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,92,12,0.25),rgba(0,0,0,0)_62%)]" />
                      <div className="absolute inset-0 rounded-xl border-[3px] border-[#ff5c0c]" />
                      <div className="absolute left-1 top-1 rounded-md bg-[#ff5c0c] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-lg">
                        seleção
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isActive && winnerFlash && (
                    <motion.div
                      className="pointer-events-none absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="absolute inset-0 bg-[#ff5c0c]/28" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function XpBar({
  progress,
  className = "",
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border border-white/10 bg-black/60 ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#ff5c0c] via-yellow-300 to-emerald-300 shadow-[0_0_18px_rgba(255,92,12,0.55)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
