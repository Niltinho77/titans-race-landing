import type { Metadata } from "next";
import "./globals.css";
import { Montserrat, Permanent_Marker } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
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
          ${montserrat.variable} 
          ${permanentMarker.variable}
          bg-titans-bg text-titans-text
          min-h-screen
        `}
      >
        {children}
      </body>
    </html>
  );
}