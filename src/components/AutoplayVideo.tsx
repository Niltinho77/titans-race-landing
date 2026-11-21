"use client";

import { useEffect, useRef } from "react";

// Vídeo de fundo que toca sozinho no celular.
// O React não escreve o atributo `muted` no HTML do servidor, e o Safari/Chrome só deixam
// tocar sozinho vídeo mudo. Aqui garantimos o mudo e chamamos play(); se o celular estiver
// em modo economia (que bloqueia autoplay), tentamos de novo no primeiro toque ou rolagem.
export function AutoplayVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const tryPlay = () => {
      if (!video.paused) return;
      video.play().catch(() => {});
    };
    const events = ["touchstart", "scroll", "click", "keydown"] as const;
    const onInteraction = () => {
      tryPlay();
      events.forEach((name) => window.removeEventListener(name, onInteraction));
    };

    tryPlay();
    video.addEventListener("canplay", tryPlay, { once: true });
    events.forEach((name) => window.addEventListener(name, onInteraction, { passive: true }));
    const onVisible = () => document.visibilityState === "visible" && tryPlay();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      video.removeEventListener("canplay", tryPlay);
      events.forEach((name) => window.removeEventListener(name, onInteraction));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      aria-hidden="true"
      disablePictureInPicture
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
