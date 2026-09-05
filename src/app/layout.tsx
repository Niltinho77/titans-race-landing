// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter, Bebas_Neue } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

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
  title: "Titans Race - Alegrete",
  description: "Corrida de obstáculos Titans Race - Alegrete/RS",
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
        {children}
      </body>
    </html>
  );
}
