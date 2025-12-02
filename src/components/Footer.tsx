// src/components/Footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-6 text-[11px] text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <span>© {new Date().getFullYear()} Titans Race · Alegrete/RS</span>
        <div className="flex gap-4">
          <Link href="/regulamento" className="hover:text-[#F5E04E]">
            Regulamento
          </Link>
          <Link href="/politica-de-privacidade" className="hover:text-[#F5E04E]">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
