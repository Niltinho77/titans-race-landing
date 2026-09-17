// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter, Bebas_Neue } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://titansrace.com.br"),
  title: "Titans Race - Alegrete",
  description: "Corrida de obstáculos Titans Race - Alegrete/RS",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Titans Race",
    title: "Titans Race | Corrida de obstáculos",
    description: "Corra. Supere. Vença. Viva o desafio em Alegrete/RS. Escolha sua modalidade e garanta sua inscrição.",
    images: [{
      url: "/share-image?v=1",
      width: 400,
      height: 400,
      type: "image/png",
      alt: "Titans Race — Alegrete/RS",
    }],
  },
  twitter: {
    card: "summary",
    title: "Titans Race | Corrida de obstáculos",
    description: "Corra. Supere. Vença. Viva o desafio em Alegrete/RS.",
    images: [{ url: "/share-image?v=1", alt: "Titans Race — Alegrete/RS" }],
  },
  icons: {
    icon: {
      url: "/icon.png?v=1",
      type: "image/png",
    },
    shortcut: "/icon.png?v=1",
    apple: "/icon.png?v=1",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`
          ${inter.variable}
          ${bebas.variable}
          min-h-screen
        `}
      >
        <AnalyticsTracker />
        <MicrosoftClarity />
        {children}
      </body>
    </html>
  );
}
