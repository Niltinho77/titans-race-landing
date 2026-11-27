import Image from "next/image";
import { teamColor, teamInitials } from "@/lib/teamNames";

// Escudo da equipe (ou brasão da cidade). Sem logo, gera um escudo com as iniciais numa cor fixa.
export function TeamCrest({ name, logoUrl, size = 40 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = teamColor(name);
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" aria-hidden="true" className="shrink-0">
      <path d="M20 1 L38 6 V21 C38 32 30 39 20 43 C10 39 2 32 2 21 V6 Z" fill={color} />
      <path d="M20 4 L35 8 V21 C35 30 28.5 36 20 39.5 C11.5 36 5 30 5 21 V8 Z" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill="#fff"
      >
        {teamInitials(name)}
      </text>
    </svg>
  );
}
