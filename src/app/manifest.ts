import type { MetadataRoute } from "next";

// Transforma o site em app instalável (PWA): ícone na tela inicial e abre em tela cheia.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Titans Race",
    short_name: "Titans Race",
    description: "Corrida de obstáculos em Alegrete/RS. Corra. Supere. Vença.",
    start_url: "/?utm_source=app&utm_medium=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "pt-BR",
    categories: ["sports", "events"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Inscrever", url: "/#inscricoes", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "Portal do atleta", url: "/portal/login", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
