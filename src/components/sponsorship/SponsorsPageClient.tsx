"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Lock,
  MapPin,
  MessageCircle,
  Trophy,
  X,
} from "lucide-react";
import {
  allSelectableSponsorshipItems,
  confirmedSponsors,
  exclusiveAssets,
  formatCurrency,
  sponsorshipPackages,
  sponsorshipProperties,
  type SponsorshipPackage,
  type SponsorshipProperty,
} from "@/data/sponsorship";

const stats = [
  { label: "atletas na primeira edição", value: "+200", tone: "orange" },
  { label: "visualizações no Instagram", value: "825.137", tone: "white" },
  { label: "contas alcançadas", value: "37.501", tone: "white" },
  { label: "interações", value: "17.066", tone: "orange" },
  { label: "novos seguidores no período", value: "+959", tone: "white" },
  { label: "crescimento da base", value: "+30%", tone: "orange" },
  { label: "visitas ao perfil", value: "8.926", tone: "white" },
  { label: "cliques em links externos", value: "792", tone: "white" },
];

const cities = [
  { name: "Alegrete", value: "31,9%" },
  { name: "Uruguaiana", value: "13,7%" },
  { name: "Santa Maria", value: "9%" },
  { name: "Rosário do Sul", value: "5,5%" },
];

const gallery = [
  // Para trocar as fotos desta galeria, coloque os novos arquivos em:
  // public/patrocinadores/experiencia/
  // A ordem abaixo é exatamente a ordem que aparece no site.
  // Se quiser nomes mais simples no futuro, use:
  // 01-largada.jpg, 02-obstaculo-publico.jpg, 03-estrutura-marca.jpg,
  // 04-lama-superacao.jpg, 05-comunidade.jpg, 06-familia-kids.jpg
  {
    image: "/patrocinadores/experiencia/largada-titans.jpg",
    title: "Largada e atletas",
    copy: "Sua marca no momento em que a prova ganha vida.",
  },
  {
    image: "/patrocinadores/experiencia/EDITADAS-2524%20(1).jpg",
    title: "Obstáculos e público",
    copy: "Exposição em fotos, arena e pontos de passagem.",
  },
  {
    image: "/patrocinadores/experiencia/pneus.jpg",
    title: "Estruturas com marca",
    copy: "Banners e espaços visuais dentro da experiência.",
  },
  {
    image: "/patrocinadores/experiencia/EDITADAS-2673.jpg",
    title: "Lama e superação",
    copy: "Conteúdo forte para associar sua marca ao desafio.",
  },
  {
    image: "/patrocinadores/experiencia/EDITADAS-3185.jpg",
    title: "Comunidade esportiva",
    copy: "Conexão com atletas, torcida e público regional.",
  },
  {
    image: "/patrocinadores/experiencia/F5__1501.jpg",
    title: "Experiência para famílias",
    copy: "Presença também nos momentos de apoio e convivência.",
  },
];

const comparisonRows = [
  { label: "Camiseta", parceiro: "Logo pequeno", apoiador: "Logo intermediário", master: "Maior destaque" },
  { label: "Site", parceiro: "Logo", apoiador: "Maior destaque", master: "Destaque máximo" },
  { label: "Instagram", parceiro: "Destaque Parceiros", apoiador: "Destaque + Stories", master: "Destaque recorrente" },
  { label: "Banner nos gradis", parceiro: "Coletivo pequeno", apoiador: "Coletivo maior", master: "Maior destaque" },
  { label: "Painel de premiação", parceiro: "Pequeno", apoiador: "Intermediário", master: "Maior destaque" },
  { label: "Sacola do kit", parceiro: false, apoiador: true, master: "Destaque" },
  { label: "Material dentro do kit", parceiro: true, apoiador: true, master: true },
  { label: "Stories", parceiro: "Coletivo", apoiador: "1 individual", master: "Recorrente" },
  { label: "Conteúdo individual", parceiro: false, apoiador: false, master: "1 Reel/colab" },
  { label: "Ativação no evento", parceiro: false, apoiador: false, master: true },
  { label: "Obstáculo exclusivo", parceiro: false, apoiador: false, master: "Rede de Cargas" },
  { label: "Exclusividade de segmento", parceiro: false, apoiador: false, master: true },
];

type FormState = {
  empresa: string;
  responsavel: string;
  whatsapp: string;
  instagram: string;
  email: string;
  cidade: string;
  observacoes: string;
};

const initialForm: FormState = {
  empresa: "",
  responsavel: "",
  whatsapp: "",
  instagram: "",
  email: "",
  cidade: "",
  observacoes: "",
};

function scrollToForm() {
  document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function statusLabel(status: string) {
  if (status === "reserved") return "Reservado";
  if (status === "hidden") return "Em confirmação";
  return "Disponível";
}

function statusClass(status: string) {
  if (status === "reserved") return "border-red-500/35 bg-red-500/10 text-red-200";
  if (status === "hidden") return "border-zinc-500/35 bg-zinc-500/10 text-zinc-300";
  return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
}

function whatsappUrl(form: FormState, selectedNames: string[], total: number) {
  const message = [
    "Olá! Tenho interesse em patrocinar a Titans Race II.",
    "",
    `Empresa: ${form.empresa}`,
    `Nome: ${form.responsavel}`,
    `Cota escolhida: ${selectedNames.join(", ") || "A definir"}`,
    "Propriedade: A definir",
    `Valor estimado: ${formatCurrency(total)}`,
  ].join("\n");

  return `https://wa.me/5555992234690?text=${encodeURIComponent(message)}`;
}

function ComparisonValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-300" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-zinc-600" />;
  return <span>{value}</span>;
}

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] uppercase tracking-[0.28em] text-orange-400">{eyebrow}</p>
      <h2 className="mt-3 heading-adventure text-3xl text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">{copy}</p>
    </div>
  );
}

function PackageCard({ item, featured }: { item: SponsorshipPackage; featured?: boolean }) {
  const reserved = item.status === "reserved";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={[
        "relative flex h-full flex-col overflow-hidden rounded-3xl border bg-zinc-950 p-5",
        featured ? "border-orange-500/45 shadow-[0_20px_70px_rgba(249,115,22,0.16)]" : "border-white/10",
        reserved ? "opacity-90" : "",
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-300 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
            {item.badge}
          </span>
          <h3 className="mt-4 heading-adventure text-3xl text-white">{item.name}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${statusClass(item.status)}`}>
          {statusLabel(item.status)}
        </span>
      </div>

      <p className="mt-4 text-3xl font-black text-orange-400">{formatCurrency(item.price)}</p>
      {item.highlight ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-red-200">{item.highlight}</p> : null}
      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{item.summary}</p>

      <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-zinc-200">
        {item.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={scrollToForm}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-100 transition hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-500"
        disabled={reserved}
      >
        {reserved ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        {reserved ? "Reservado" : "Tenho interesse"}
      </button>
    </motion.article>
  );
}

function PropertyCard({ item }: { item: SponsorshipProperty }) {
  const reserved = item.status === "reserved";
  const featured = item.id === "monkey-bar-argolas";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={[
        "group relative overflow-hidden rounded-3xl border bg-zinc-950",
        featured
          ? "border-orange-500/60 shadow-[0_24px_80px_rgba(249,115,22,0.18)]"
          : "border-white/10",
      ].join(" ")}
    >
      {featured ? (
        <div className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-orange-500 via-orange-300 to-transparent" />
      ) : null}

      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className={`absolute inset-0 ${featured ? "bg-gradient-to-t from-black/95 via-black/45 to-orange-950/10" : "bg-gradient-to-t from-black/90 via-black/35 to-transparent"}`} />
        <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusClass(item.status)}`}>
          {reserved && item.sponsorCurrent ? `Reservado - ${item.sponsorCurrent}` : statusLabel(item.status)}
        </span>
        {featured ? (
          <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
            Novo obstáculo
          </span>
        ) : null}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-orange-300">{item.exposure}</p>
          <h3 className="mt-1 heading-adventure text-2xl text-white">{item.name}</h3>
        </div>
      </div>

      <div className="p-5">
        {item.commercialLine ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">{item.commercialLine}</p> : null}
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.summary}</p>
        <p className={`mt-4 font-black ${featured ? "text-3xl text-orange-400" : "text-2xl text-white"}`}>{item.price > 0 ? formatCurrency(item.price) : "Cota Master"}</p>

        <ul className="mt-5 space-y-2 text-sm text-zinc-300">
          {item.benefits.slice(0, 5).map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={scrollToForm}
          disabled={reserved}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
        >
          {reserved ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {reserved ? "Indisponível" : "Tenho interesse"}
        </button>
      </div>
    </motion.article>
  );
}

export function SponsorsPageClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedItems = useMemo(
    () => allSelectableSponsorshipItems.filter((item) => selected.includes(item.id)),
    [selected],
  );
  const selectedNames = selectedItems.map((item) => item.name);
  const estimatedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const whatsUrl = whatsappUrl(form, selectedNames, estimatedTotal);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleItem(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/sponsorship/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          selectedItems,
          estimatedValue: estimatedTotal,
        }),
      });

      if (!response.ok) throw new Error("Falha ao enviar");

      setStatus("success");
      setMessage("Interesse enviado. A equipe Titans entrará em contato para confirmar disponibilidade e parceria.");
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar agora. Você ainda pode falar com a Titans pelo WhatsApp.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img src="/patrocinadores/experiencia/largada-titans.jpg" alt="Atletas da Titans Race largando com público ao redor" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/72 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.24),transparent_42%)]" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 md:pb-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-orange-300">Patrocínios Titans Race II</p>
            <h1 className="mt-4 heading-adventure text-5xl text-white sm:text-6xl md:text-7xl">Sua marca dentro da Titans Race II</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 md:text-lg">
              Associe sua empresa a uma experiência esportiva que conecta atletas, público e milhares de pessoas nas redes sociais.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={scrollToForm} className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-orange-400">
                Quero ser parceiro
                <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#oportunidades" className="inline-flex items-center justify-center rounded-full border border-white/25 px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10">
                Conhecer oportunidades
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-zinc-950 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Titans em números"
            title="Alcance, comunidade e força regional"
            copy="A primeira edição colocou a Titans no mapa regional e transformou a prova em conteúdo orgânico, conversas e presença digital."
          />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black p-4">
                <p className={`text-3xl font-black ${stat.tone === "orange" ? "text-orange-400" : "text-white"}`}>{stat.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-black p-5 md:grid-cols-[0.8fr_1.2fr] md:p-6">
            <div>
              <MapPin className="h-6 w-6 text-orange-400" />
              <h3 className="mt-3 text-lg font-bold text-white">Potencial regional</h3>
              <p className="mt-2 text-sm text-zinc-400">A audiência se concentra em Alegrete e cidades próximas, criando valor para marcas que atuam na Fronteira Oeste e região central.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {cities.map((city) => (
                <div key={city.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-zinc-300">{city.name}</span>
                    <strong className="text-lg text-white">{city.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-orange-200">48,8% das visualizações vieram de pessoas que ainda não seguiam o perfil.</p>
        </div>
      </section>

      <section className="border-t border-white/5 bg-black px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Experiência Titans"
            title="Sua marca aparece dentro da prova"
            copy="Fotos, vídeos, obstáculos, arena e momentos de conquista criam pontos reais de exposição para marcas parceiras."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <article key={item.title} className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/78 p-5 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-100">{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="oportunidades" className="border-t border-white/5 bg-zinc-950 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Cotas de patrocínio"
            title="Escolha o nível de presença da sua marca"
            copy="As cotas principais entregam exposição nos canais oficiais, materiais do evento e pontos de contato com atletas e público."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {sponsorshipPackages.map((item) => (
              <PackageCard key={item.id} item={item} featured={item.id === "apoiador"} />
            ))}
          </div>
          <p className="mt-5 text-sm text-zinc-400">Materiais para o kit atleta, como folder, cupom, amostra ou brinde, devem ser fornecidos pela empresa e aprovados previamente pela organização.</p>
        </div>
      </section>

      <section className="border-t border-white/5 bg-black px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Propriedades avulsas"
            title="Coloque sua marca dentro do desafio"
            copy="Além das cotas tradicionais, sua empresa pode ocupar com exclusividade alguns dos principais pontos da pista. Você pode contratar uma propriedade sozinha ou somar com uma cota."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sponsorshipProperties.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5 text-sm leading-relaxed text-orange-50">
            A Titans recebe a logo ou arte, produz o banner, instala no evento, retira após a prova e entrega o material ao patrocinador. O custo gráfico já está incluído no valor da propriedade.
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-zinc-950 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Comparativo"
            title="Compare as entregas"
            copy="Uma visão direta para entender onde cada cota aparece e qual nível de destaque sua empresa recebe."
          />
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
            <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300">
              <div className="p-3">Benefício</div>
              <div className="p-3 text-center">Parceiro</div>
              <div className="p-3 text-center text-orange-300">Apoiador</div>
              <div className="p-3 text-center">Master</div>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid grid-cols-4 border-b border-white/5 text-xs text-zinc-300 last:border-b-0">
                <div className="p-3 font-semibold text-white">{row.label}</div>
                <div className="p-3 text-center"><ComparisonValue value={row.parceiro} /></div>
                <div className="p-3 text-center"><ComparisonValue value={row.apoiador} /></div>
                <div className="p-3 text-center"><ComparisonValue value={row.master} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-black px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Ativos exclusivos"
            title="Outras formas de colocar sua marca na experiência"
            copy="Espaços únicos, limitados a uma empresa por edição, para gerar presença em momentos de contato direto com os atletas."
          />
          <div className="mx-auto mt-10 max-w-xl">
            {exclusiveAssets.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5 text-sm leading-relaxed text-orange-50">
            Propriedades da pista e ativos exclusivos podem ser contratados separadamente ou adicionados a uma cota. Não há desconto automático em combinações. Cada espaço fica indisponível assim que for reservado pela organização.
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-zinc-950 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            eyebrow="Prova social"
            title="Marcas que já fazem parte da Titans II"
            copy="Parceiros confirmados e propriedades reservadas nesta edição."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {confirmedSponsors.map((sponsor) => (
              <article key={sponsor.id} className="rounded-3xl border border-orange-500/30 bg-black p-6">
                <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white p-4 text-center">
                  {sponsor.logo ? <img src={sponsor.logo} alt={sponsor.name} className="max-h-16 object-contain" /> : <span className="text-xl font-black uppercase text-black">{sponsor.name}</span>}
                </div>
                <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-orange-300">{sponsor.category}</p>
                <h3 className="mt-2 text-xl font-bold text-white">{sponsor.name}</h3>
                {sponsor.property ? <p className="mt-2 text-sm text-zinc-400">Propriedade: {sponsor.property}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="formulario" className="border-t border-white/5 bg-black px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-orange-400">formulário de interesse</p>
            <h2 className="mt-3 heading-adventure text-3xl text-white md:text-5xl">Escolha como sua marca vai aparecer</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
              O envio não caracteriza contratação ou reserva definitiva. A equipe Titans entrará em contato para confirmar disponibilidade e parceria.
            </p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">Investimento de interesse</p>
              <p className="mt-2 text-4xl font-black text-orange-400">{formatCurrency(estimatedTotal)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-zinc-950 p-5 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <input required value={form.empresa} onChange={(e) => updateField("empresa", e.target.value)} placeholder="Nome da empresa" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
              <input required value={form.responsavel} onChange={(e) => updateField("responsavel", e.target.value)} placeholder="Nome do responsável" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
              <input required value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
              <input value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} placeholder="Instagram" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
              <input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="E-mail" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
              <input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} placeholder="Cidade" className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Cotas e propriedades de interesse</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {allSelectableSponsorshipItems.map((item) => {
                  const disabled = item.status !== "available";
                  const checked = selected.includes(item.id);
                  return (
                    <label key={item.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3 text-sm transition ${checked ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-black"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-orange-500/60"}`}>
                      <span>
                        <span className="block font-semibold text-white">{item.name}</span>
                        <span className="text-xs text-zinc-400">{formatCurrency(item.price)}</span>
                      </span>
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleItem(item.id)} className="h-5 w-5 accent-orange-500" />
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">Rede de Cargas - reservado para Alta Energia.</div>
            </div>

            <textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Observações" rows={4} className="mt-5 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500" />

            {message ? <p className={`mt-4 text-sm ${status === "success" ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}

            <button disabled={status === "sending"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-orange-400 disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-400">
              <Trophy className="h-4 w-4" />
              {status === "sending" ? "Enviando" : "Quero fazer parte da Titans II"}
            </button>
            <a href={whatsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/10">
              <MessageCircle className="h-4 w-4 text-orange-400" />
              Falar com a Titans no WhatsApp
            </a>
          </form>
        </div>
      </section>

      <section className="border-t border-white/5 bg-zinc-950 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionIntro
            eyebrow="FAQ"
            title="Perguntas rápidas"
            copy="Respostas diretas para facilitar a decisão antes do contato com a organização."
          />
          <div className="mt-10 divide-y divide-white/10 rounded-3xl border border-white/10 bg-black">
            {[
              ["Preciso comprar uma cota para patrocinar um obstáculo?", "Não. As propriedades podem ser contratadas separadamente."],
              ["Posso contratar uma cota e também um obstáculo?", "Sim. Exemplo: Apoiador R$ 1.000 + Monkey Bar R$ 1.000 = R$ 2.000."],
              ["Quem produz o banner?", "A Titans recebe a logo ou arte, produz, instala e retira os banners das propriedades exclusivas."],
              ["O banner fica comigo depois?", "Sim. Após o evento, o material será entregue à empresa."],
              ["Posso colocar brindes no kit?", "Sim. O material deve ser fornecido pelo patrocinador e aprovado previamente pela organização."],
              ["A reserva é feita automaticamente ao enviar o formulário?", "Não. A equipe Titans confirmará a disponibilidade e finalizará a parceria."],
            ].map(([question, answer]) => (
              <div key={question} className="p-5">
                <h3 className="font-bold text-white">{question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
