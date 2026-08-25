export type SponsorshipStatus = "available" | "reserved" | "hidden";

export type SponsorshipPackage = {
  id: string;
  name: string;
  price: number;
  status: SponsorshipStatus;
  badge: string;
  summary: string;
  highlight?: string;
  benefits: string[];
};

export type SponsorshipProperty = {
  id: string;
  name: string;
  price: number;
  image: string;
  type: "track" | "asset";
  exposure: string;
  status: SponsorshipStatus;
  sponsorCurrent?: string;
  summary: string;
  commercialLine?: string;
  benefits: string[];
};

export type ConfirmedSponsor = {
  id: string;
  name: string;
  logo?: string;
  category: string;
  property?: string;
  status: "confirmed" | "reserved";
  order: number;
};

export const sponsorshipPackages: SponsorshipPackage[] = [
  {
    id: "parceiro",
    name: "Parceiro",
    price: 500,
    status: "available",
    badge: "Entrada estratégica",
    summary:
      "Para empresas que querem presença oficial na Titans II com investimento enxuto e exposição em canais essenciais.",
    benefits: [
      "Logo pequeno na camiseta oficial da Titans Race II",
      "Logo no site oficial",
      'Presença no destaque "Parceiros" do Instagram',
      "Logo em banner coletivo nos gradis/arena",
      "Logo pequeno no painel de premiação",
      "Possibilidade de inserir folder, cupom, amostra ou brinde no kit atleta",
      "Participação em divulgação coletiva dos parceiros",
    ],
  },
  {
    id: "apoiador",
    name: "Apoiador",
    price: 1000,
    status: "available",
    badge: "Mais destaque",
    summary:
      "Para marcas que querem aparecer com mais força no evento, nos materiais oficiais e no relacionamento digital.",
    benefits: [
      "Logo de tamanho intermediário na camiseta oficial",
      "Logo com maior destaque no site",
      'Presença no destaque "Parceiros" do Instagram',
      "Logo maior nos banners coletivos",
      "Logo intermediário no painel de premiação",
      "Logo na sacola oficial do kit",
      "Possibilidade de incluir material ou brinde no kit",
      "1 apresentação individual nos Stories",
      "Marcações naturais em conteúdos relacionados ao evento",
    ],
  },
  {
    id: "master",
    name: "Master",
    price: 5000,
    status: "reserved",
    badge: "Reservado",
    highlight: "RESERVADO - ALTA ENERGIA",
    summary:
      "A posição Master da Titans Race II já está ocupada pela Alta Energia, com direito ao obstáculo premium Rede de Cargas.",
    benefits: [
      "Maior destaque na camiseta oficial",
      "Maior destaque nos banners",
      "Maior destaque no painel de premiação",
      "Logo em destaque na sacola do kit",
      "Destaque máximo no site e Instagram",
      "Presença recorrente em Stories",
      "1 Reel ou conteúdo principal em colaboração",
      "Possibilidade de ativação presencial",
      "Possibilidade de inserir materiais no kit",
      "Exclusividade de segmento",
      "Direito a um obstáculo premium exclusivo",
    ],
  },
];

export const sponsorshipProperties: SponsorshipProperty[] = [
  {
    id: "largada-titans",
    name: "Largada Titans",
    price: 2000,
    image: "/patrocinadores/experiencia/largada-titans.jpg",
    type: "track",
    exposure: "Máxima exposição",
    status: "available",
    commercialLine: "Largada Titans apresentada por [Empresa]",
    summary:
      "Pórtico próprio da Titans com estrutura de eucalipto e banners. A marca ocupa com exclusividade o primeiro impacto visual da prova.",
    benefits: [
      "Marca exclusiva no pórtico de largada",
      "Produção do banner incluída",
      "Instalação feita pela Titans",
      "Logo no site e destaque Parceiros",
      "Painel de premiação",
      "Possibilidade de material no kit",
      "Conteúdo apresentando o patrocinador da largada",
      "Banner entregue à empresa após o evento",
    ],
  },
  {
    id: "rede-de-cargas",
    name: "Rede de Cargas",
    price: 0,
    image: "/patrocinadores/experiencia/rede-cargas.jpg",
    type: "track",
    exposure: "Maior visibilidade entre os obstáculos",
    status: "reserved",
    sponsorCurrent: "Alta Energia",
    commercialLine: "Rede de Cargas - Alta Energia",
    summary:
      "O atleta passa duas vezes pelo obstáculo, uma por baixo e outra por cima, gerando presença forte em fotos e vídeos.",
    benefits: [
      "Propriedade premium vinculada à cota Master",
      "Exposição recorrente em conteúdos oficiais",
      "Exclusividade de segmento",
    ],
  },
  {
    id: "pneu-cima-baixo",
    name: "Pneu Cima/Baixo",
    price: 1000,
    image: "/patrocinadores/experiencia/pneus.jpg",
    type: "track",
    exposure: "Boa exposição",
    status: "available",
    summary:
      "Obstáculo visual, fácil de entender e com boa chance de aparecer em fotos de atletas durante a prova.",
    benefits: [
      "Banner exclusivo no obstáculo",
      "Produção do banner incluída",
      "Instalação feita pela Titans",
      "Logo no site e destaque Parceiros",
      "Possibilidade de material no kit",
      "Marcações quando o obstáculo aparecer como protagonista",
      "Banner entregue à empresa após o evento",
    ],
  },
  {
    id: "monkey-bar",
    name: "Monkey Bar",
    price: 1000,
    image: "/patrocinadores/experiencia/monkey-bar.png",
    type: "track",
    exposure: "Exposição média",
    status: "available",
    summary:
      "Um ponto técnico da pista, associado a força, desafio e superação. Ideal para marcas que querem presença em um obstáculo marcante.",
    benefits: [
      "Banner exclusivo",
      "Banner produzido pela Titans",
      "Instalação feita pela Titans",
      "Logo no site e destaque Parceiros",
      "Possibilidade de material no kit",
      "Marcações naturais relacionadas ao obstáculo",
      "Banner entregue ao patrocinador após o evento",
    ],
  },
  {
    id: "pegboard",
    name: "Pegboard",
    price: 1000,
    image: "/patrocinadores/experiencia/pegboard.jpg",
    type: "track",
    exposure: "Exposição média",
    status: "available",
    summary:
      "Obstáculo de força e precisão, com comunicação visual dedicada para deixar claro onde a marca aparece na pista.",
    benefits: [
      "Banner exclusivo",
      "Banner produzido pela Titans",
      "Instalação feita pela Titans",
      "Logo no site e destaque Parceiros",
      "Possibilidade de material no kit",
      "Marcações naturais relacionadas ao obstáculo",
      "Banner entregue ao patrocinador após o evento",
    ],
  },
  {
    id: "monkey-bar-argolas",
    name: "Novo Monkey de Argolas",
    price: 1500,
    image: "/patrocinadores/experiencia/monkey-argolas.jpg",
    type: "track",
    exposure: "Novo obstáculo Titans II",
    status: "available",
    commercialLine: "Novo obstáculo Titans II apresentado por [Empresa]",
    summary:
      "Novo obstáculo com aproximadamente 6 metros de comprimento, criado para gerar impacto visual e conteúdo de apresentação.",
    benefits: [
      "Exclusividade da marca",
      "Banner grande",
      "Produção incluída",
      "Instalação feita pela Titans",
      "Logo no site e destaque Parceiros",
      "Possibilidade de material no kit",
      "Conteúdo de apresentação do novo obstáculo",
      "Banner entregue à empresa após o evento",
    ],
  },
];

export const exclusiveAssets: SponsorshipProperty[] = [
  {
    id: "pulseira-oficial",
    name: "Pulseira Oficial Titans II",
    price: 1000,
    image: "/patrocinadores/experiencia/JBS_8180.jpg",
    type: "asset",
    exposure: "Exclusividade total",
    status: "available",
    summary:
      "A logo da empresa será impressa nas pulseiras de identificação utilizadas pelos atletas durante o evento.",
    benefits: [
      "Logo em todas as pulseiras",
      "Exclusividade desse espaço",
      "Logo no site",
      "Destaque Parceiros",
      "Story apresentando a parceria",
    ],
  },
];

export const confirmedSponsors: ConfirmedSponsor[] = [
  {
    id: "alta-energia",
    name: "Alta Energia",
    category: "Patrocinador Master",
    property: "Rede de Cargas",
    status: "confirmed",
    order: 1,
  },
];

export const allSelectableSponsorshipItems = [
  ...sponsorshipPackages,
  ...sponsorshipProperties,
  ...exclusiveAssets,
]
  .filter((item) => item.id !== "rede-de-cargas")
  .map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    status: item.status,
  }));

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
