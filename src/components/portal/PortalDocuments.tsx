import Link from "next/link";

const DOCUMENTS = [
  {
    href: "/docs/termo-responsabilidade.pdf",
    label: "Termo maior de idade",
  },
  {
    href: "/docs/termo-responsabilidade-menor.pdf",
    label: "Termo menor de idade",
  },
  {
    href: "/docs/regulamento.pdf",
    label: "Regulamento",
  },
];

export default function PortalDocuments() {
  return (
    <section className="border border-white/10 bg-zinc-950 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px] sm:tracking-[0.25em]">
            Documentos da prova
          </p>
          <h2 className="heading-adventure mt-2 text-2xl text-white sm:text-3xl">
            Termos para retirada do kit
          </h2>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[520px]">
          {DOCUMENTS.map((document) => (
            <Link
              key={document.href}
              href={document.href}
              target="_blank"
              className="border border-orange-500/35 bg-orange-500/10 px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100 hover:bg-orange-500/15 sm:text-[11px]"
            >
              {document.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
