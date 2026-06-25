import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liga Titans",
  description: "Ranking, níveis e sorteio semanal da Liga Titans.",
};

export default function SorteioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
