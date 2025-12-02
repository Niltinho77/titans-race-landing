// src/components/NavBar.tsx
import Link from "next/link";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#destaques", label: "A Prova" },
  { href: "#local", label: "Local" },
  { href: "#inscricoes", label: "Inscrições" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#contato", label: "Contato" },
];

export function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="#inicio" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#361259] text-xs font-bold text-white">
            TR
          </div>
          <span className="font-giz text-lg text-white tracking-wide">
            TITANS RACE
          </span>
        </Link>

        <nav className="hidden gap-6 text-xs font-medium text-zinc-200 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="uppercase tracking-[0.18em] text-[10px] hover:text-[#F5E04E] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#inscricoes"
          className="hidden rounded-full bg-[#F5E04E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-lg md:inline-block"
        >
          Inscreva-se
        </a>
      </div>
    </header>
  );
}
