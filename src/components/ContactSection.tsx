// src/components/ContactSection.tsx
"use client";

import { motion } from "framer-motion";
import { MessageCircle, Mail, Users } from "lucide-react";

export function ContactSection() {
  return (
    <section
      id="contato"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr]">
        {/* COLUNA ESQUERDA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="heading-adventure text-3xl text-white md:text-5xl">
            Contato & WhatsApp
          </h2>

          <p className="mt-4 text-sm text-zinc-300 md:text-base">
            Canal direto com a organização da Titans Race para dúvidas,
            parcerias, patrocínios e informações gerais sobre a prova.
          </p>

          <div className="mt-8 space-y-3 text-sm text-zinc-200">
            <div className="flex items-center gap-3 text-xs md:text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60">
                <MessageCircle className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-zinc-400">WhatsApp (organização)</p>
                <p className="font-medium text-zinc-100">
                  (+55) (00) 00000-0000
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs md:text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60">
                <Mail className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-zinc-400">E-mail oficial</p>
                <p className="font-medium text-zinc-100">
                  contato@titansrace.com.br
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs md:text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60">
                <Users className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-zinc-400">Grupo oficial Titans Race</p>
                <p className="font-medium text-zinc-100">
                  Link será disponibilizado na versão final
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* COLUNA DIREITA – CTAs */}
        <motion.div
          className="flex flex-col justify-center gap-3 text-sm text-zinc-200"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <a
            href="https://wa.me/0000000000000"
            className="block w-full rounded-full bg-orange-500 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-lg transition hover:bg-orange-400"
          >
            Falar no WhatsApp
          </a>

          <a
            href="#"
            className="block w-full rounded-full border border-white/20 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/5"
          >
            Entrar no grupo oficial
          </a>

          <p className="mt-3 text-[11px] text-zinc-500">
            *Links e contatos são ilustrativos nesta fase de apresentação do
            projeto.
          </p>
        </motion.div>
      </div>
    </section>
  );
}