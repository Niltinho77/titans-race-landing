// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter, Bebas_Neue } from "next/font/google";

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
        {children}
      </body>
    </html>
  );
}