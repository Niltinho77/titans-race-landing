import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { GROUP_DISCOUNT } from "@/config/lots";
import { INSTALLMENTS } from "@/config/checkout";

const reais = (cents: number) => `R$ ${Math.round(cents / 100)}`;

// Respostas baseadas no regulamento oficial (public/regulamento.pdf).
const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Qual a idade mínima?",
    a: (
      <>
        Solo, Duplas e Quartetos: 16 anos completos até o dia da prova. Diversão: qualquer idade, com o acompanhamento
        do responsável. Kids: de 2 a 13 anos. Menores de 18 precisam do{" "}
        <a href="/termo-responsabilidade-menor.pdf" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
          termo de responsabilidade
        </a>{" "}
        assinado pelo responsável.
      </>
    ),
  },
  {
    q: "Qual a distância e como são os obstáculos?",
    a: "O percurso tem de 5 a 6 km, com muros, cordas, redes, pneus, rampas, lama e água. Solo, Duplas e Quartetos têm cronometragem; na Diversão não há cronômetro e os obstáculos são opcionais. O percurso Kids tem cerca de 1 km, em pista própria e segura.",
  },
  {
    q: "Que horas é a largada?",
    a: "O horário da largada e da retirada de kit é divulgado no grupo oficial do WhatsApp e no Instagram nas semanas antes da prova. Recomendamos chegar 1h30 antes.",
  },
  {
    q: "O que preciso levar?",
    a: "Para retirar o kit: documento com foto e o termo de responsabilidade assinado. Vá com roupa e tênis que possam sujar e leve uma muda de roupa para depois.",
  },
  {
    q: "Até quando a inscrição inclui camiseta?",
    a: "Inscrições feitas até 14/02 incluem a camiseta oficial. No Lote Extra (15/02 a 07/03) a inscrição não inclui camiseta nem itens extras.",
  },
  {
    q: "Tem desconto para grupo ou assessoria?",
    a: `Sim. A partir de ${GROUP_DISCOUNT.minParticipants} atletas no mesmo pedido, cada um ganha ${reais(GROUP_DISCOUNT.perPerson)} de desconto. Grupo com modalidades diferentes? Fale com a gente no WhatsApp.`,
  },
  {
    q: "Como posso pagar?",
    a: `Pix ou cartão de crédito, direto no site. No cartão, dá para parcelar em até ${INSTALLMENTS.maxCount}x: é só escolher as parcelas na hora de finalizar a inscrição.`,
  },
  {
    q: "Posso transferir minha inscrição para outra pessoa?",
    a: "Sim. A transferência é feita pelo Portal do Atleta, dentro do prazo divulgado pela organização.",
  },
  {
    q: "Posso cancelar e pedir reembolso?",
    a: "Sim, em até 7 dias após a compra (direito de arrependimento das compras online). Depois desse prazo não há reembolso, mas você pode transferir a inscrição para outra pessoa.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative bg-black px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-400">Dúvidas</p>
        <h2 className="heading-adventure mt-2 text-4xl leading-none text-white md:text-6xl">Perguntas frequentes</h2>

        <div className="mt-8 divide-y divide-white/10 rounded-3xl border border-white/10 bg-zinc-950">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-white md:text-base">
                {q}
                <ChevronDown className="h-5 w-5 shrink-0 text-orange-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="pb-5 text-sm leading-relaxed text-zinc-400">{a}</div>
            </details>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Todas as regras no{" "}
          <a href="/regulamento.pdf" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-orange-400">
            regulamento oficial
          </a>
          .
        </p>
      </div>
    </section>
  );
}
