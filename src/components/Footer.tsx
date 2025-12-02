import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/95 py-6 px-4 text-[11px] text-titans-text/60">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Titans Race · Alegrete/RS</span>
        <div className="flex items-center gap-4">
          <Link href="/regulamento" className="hover:text-titans-accent">
            Regulamento
          </Link>
          <Link href="/politica-de-privacidade" className="hover:text-titans-accent">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}