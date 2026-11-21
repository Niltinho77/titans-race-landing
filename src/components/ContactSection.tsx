// src/components/ContactSection.tsx
"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, Users } from "lucide-react";

const CHANNELS = [
  {
    href: "https://wa.me/5555992234690?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20Titans%20Race.",
    label: "WhatsApp",
    detail: "(55) 99223-4690",
    icon: MessageCircle,
    primary: true,
  },
  {
    href: "https://chat.whatsapp.com/I6hYJ3lR7iqAneNCoEYJdN",
    label: "Grupo oficial",
    detail: "Novidades e avisos da prova",
    icon: Users,
    primary: false,
  },
  {
    href: "mailto:contato@titansrace.com.br",
    label: "E-mail",
    detail: "contato@titansrace.com.br",
    icon: Mail,
    primary: false,
  },
];

export function ContactSection() {
  return (
    <section id="contato" className="relative isolate overflow-hidden bg-black px-4 py-20 md:py-28">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/images/ed2/grade-lama.webp)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/90 to-black" aria-hidden="true" />

      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="heading-adventure text-4xl leading-none text-white md:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ficou alguma <span className="text-orange-500">dúvida?</span>
        </motion.h2>
        <p className="mt-3 text-sm text-zinc-400 md:text-base">Fale direto com a organização.</p>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {CHANNELS.map(({ href, label, detail, icon: Icon, primary }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-4 rounded-2xl border p-5 transition ${
                primary
                  ? "border-orange-500 bg-orange-500 text-black hover:bg-orange-400"
                  : "border-white/10 bg-white/[0.03] text-white hover:border-orange-500/50"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  primary ? "bg-black/15" : "bg-white/5 text-orange-400"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold uppercase tracking-[0.12em]">{label}</span>
                <span className={`block truncate text-xs ${primary ? "text-black/70" : "text-zinc-400"}`}>{detail}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
