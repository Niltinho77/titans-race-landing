# Titans Race — Project Instructions

## O que é a Titans Race

A **Titans Race** é uma corrida de obstáculos realizada em Alegrete/RS, com foco em desafio físico, superação e experiência de adrenalina real. O slogan é **"CORRA • SUPERE • VENÇA"** e a essência da marca é força, superação e a sensação de conquista de verdade.

Este é o site da **2ª edição** da prova. A primeira edição já aconteceu e a segunda é a "volta dos Titans" — maior, mais forte e mais marcante.

---

## Organizador

- **Nome:** Nilton Cardoso — apelido: **Niltinho**
- Solo — sem sócio
- Militar do Exército em transição de carreira
- **Objetivo:** renda de R$ 25.000/mês e construir a Titans Race como marca forte, não só um evento
- **Cadência:** 2 edições por ano (março e novembro)

---

## Histórico — 1ª Edição (28/03/2026)

- **Participantes:** 180 no total — 150 pagantes + 30 brindes/parcerias (inscrições cortesia)
- **Resultado financeiro:** Prejuízo estimado de ~R$ 9.000 (custos não foram controlados rigorosamente)
- **Patrocínios:** R$ 3.000 no total (3 patrocinadores, R$ 1.000 cada)
- **Alcance:** Sucesso na cidade de Alegrete/RS e cidades vizinhas — boa repercussão regional
- **Aprendizado principal:** Falta de controle de custos. Na 2ª edição o foco é ter gestão financeira rigorosa.

## Redes Sociais

- **Instagram:** [@titansraceoficial](https://www.instagram.com/titansraceoficial) — criado em dezembro/2025
- Conta **verificada pelo Meta** (selo azul)
- **800 mil visualizações** nos últimos 30 dias (medido ~15 dias após a 1ª edição)
- Apenas **3% de anúncios pagos** — 97% orgânico — tração orgânica muito forte
- **UGC forte:** participantes marcam espontaneamente a conta após o evento
- **Destaques nos stories:** Patrocinadores, Mista, Kids
- **Hashtags usadas:** #ocr #titansrace #obstaclecourse #fy #alegrete #desafiodeverdade
- **Tom dos reels:** emocional e desafiador — *"Nem todo mundo entende o que acontece aqui. Mas quem vive… nunca esquece."*

## Local da Prova

- **Venue:** Baita Chão — área campestre em Alegrete/RS

---

## 2ª Edição — Dados e Estratégia

### Data e Lotes

- **Data da prova:** 15 de novembro de 2026
- **Lote Promocional:** 46 inscritos — **ENCERRADO** (ficou aberto por 3 dias; ao perceber queda nas vendas, foi fechado intencionalmente para criar escassez)
- **Próximo lote (2º Lote):** Abre em 18/04/2026 — preço acima do lote promocional, limitado a **100 vagas**

### Estratégia de Lotes

O organizador usa **escassez intencional**: fecha o lote quando as vendas desaceleram, mesmo antes de esgotar, para criar senso de urgência e valorizar os próximos lotes. Esse comportamento deve ser respeitado nas configurações do site.

### Patrocinadores

- **1ª edição:** 3 patrocinadores, R$ 1.000 cada (total R$ 3.000)
- **2ª edição:** 2 dos 3 patrocinadores anteriores devem retornar (ainda sem contato formal)
- O valor das cotas de patrocínio será reajustado, mas essa conversa ainda não aconteceu com os patrocinadores
- Um patrocinador da 1ª edição não deve retornar (razão não informada)

### Custos Previstos

Os custos planejados para a 2ª edição estão na **tabela "Titans Race" no Notion** do organizador. Consultar lá para dados financeiros detalhados.

---

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router) com React 19
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS v3
- **Animações:** Framer Motion
- **Ícones:** Lucide React
- **ORM:** Prisma com PostgreSQL (produção) e SQLite (desenvolvimento)
- **Pagamentos:** Mercado Pago, Stripe, PagBank, Asaas
- **E-mail:** Resend
- **Deploy:** Vercel (presumido pelo uso de Next.js)

---

## Estrutura do Projeto

```
src/
  app/
    page.tsx                    # Página principal (landing)
    layout.tsx                  # Layout global
    globals.css                 # Estilos globais
    checkout/                   # Fluxo de checkout
      page.tsx                  # Página de checkout
      sucesso/                  # Página de pagamento aprovado
      pendente/                 # Página de pagamento pendente
      falha/                    # Página de pagamento falho
    admin/
      inscricoes/               # Listagem e edição de inscrições
      manual-order/             # Criação manual de pedidos
    api/
      checkout/                 # Endpoints de criação de checkout (MP, Stripe, PagBank, Asaas)
      admin/                    # APIs administrativas
      mercadopago/webhook/      # Webhook do MP
      pagbank/webhook/          # Webhook do PagBank
      asaas/webhook/            # Webhook do Asaas
      stripe/webhook/           # Webhook do Stripe
      coupons/preview/          # Validação e preview de cupons
      draw/                     # Sorteio (state, start, reset)
      orders/[orderId]/status/  # Consulta de status de pedido
    sorteio/                    # Página pública do sorteio
    regulamento/                # Regulamento da prova
    politica-de-privacidade/    # Política de privacidade
  components/
    Hero.tsx                    # Seção hero com vídeo de fundo
    NavBar.tsx                  # Barra de navegação
    ExperienceGridSection.tsx   # Grid de modalidades
    RegistrationSection.tsx     # Seção de lotes/inscrições
    LocationSection.tsx         # Local e estrutura
    ContactSection.tsx          # Contato e WhatsApp
    SponsorsSection.tsx         # Patrocinadores
    Footer.tsx                  # Rodapé
    ObstaclesSection.tsx        # Obstáculos (em desenvolvimento)
    AboutSection.tsx            # Sobre a prova
    HighlightsSection.tsx       # Destaques
    checkout/
      CheckoutScreen.tsx        # Tela principal do checkout
  config/
    checkout.ts                 # Configuração central de modalidades, extras e taxas
  lib/
    prisma.ts                   # Cliente Prisma singleton
    mercadopago.ts              # Integração MP
    stripe.ts                   # Integração Stripe
    pagbank.ts                  # Integração PagBank
    asaas.ts                    # Integração Asaas
    email.ts                    # Envio de e-mails com Resend
    drawStore.ts                # Estado do sorteio (in-memory)
prisma/
  schema.prisma                 # Schema do banco de dados
  migrations/                   # Histórico de migrações
```

---

## Modalidades da Prova

Definidas em `src/config/checkout.ts`:

### Preços do Lote Promocional (encerrado — 46 inscritos)

| ID | Nome | Preço | Descrição |
|----|------|-------|-----------|
| `kids` | Kids | R$ 70,00 | Percurso adaptado para crianças, obstáculos seguros e monitorados |
| `duplas` | Duplas | R$ 290,00 por dupla | 2 participantes correndo juntos |
| `equipes` | Quartetos | R$ 580,00 por equipe | 4 participantes, mínimo 1 mulher na equipe |
| `competicao` | Solo | R$ 145,00 | Prova cronometrada, tempo, performance e ranking |
| `diversao` | Diversão | R$ 145,00 | Foco em experiência, lama, superação e boas histórias |

### Preços do 2º Lote em diante (a implementar)

Reajuste definido pelo organizador: **+R$ 10,00 em todas as modalidades, exceto Kids que sobe R$ 5,00**.

| ID | Nome | Preço Promocional | Preço 2º Lote | Lógica do reajuste |
|----|------|-------------------|---------------|--------------------|
| `kids` | Kids | R$ 70,00 | **R$ 75,00** | +R$5 por criança |
| `competicao` | Solo | R$ 145,00 | **R$ 155,00** | +R$10 por pessoa |
| `diversao` | Diversão | R$ 145,00 | **R$ 155,00** | +R$10 por pessoa |
| `duplas` | Duplas | R$ 290,00 | **R$ 310,00** | +R$10 × 2 pessoas |
| `equipes` | Quartetos | R$ 580,00 | **R$ 620,00** | +R$10 × 4 pessoas |

> Os preços dos lotes seguintes (3º Lote, Lote Final) ainda não foram definidos, mas a tendência é de novos reajustes a cada lote.

---

## Extras Disponíveis

| ID | Nome | Preço | Tamanhos |
|----|------|-------|---------|
| `camisa` | Camisa oficial Titans | R$ 59,00 | PP, P, M, G, GG |
| `luva` | Luva personalizada | R$ 30,00 | P, M, G |
| `meia` | Meias 3/4 de compressão | R$ 50,00 | P, M, G |

---

## Taxa de Pagamento

Taxa repassada ao cliente no checkout: **3,99% + R$ 0,39** por transação.

Definida em `src/config/checkout.ts`:
```ts
export const PAYMENT_FEE = {
  percent: 0.0399,
  fixed: 39, // centavos
};
```

---

## Banco de Dados (Prisma Schema)

### Models principais

- **Order** — Pedido de inscrição. Campos: modalidade, tickets, status, valores em centavos (total, ingressos, extras, taxa), cupom, dados de pagamento (MP, Stripe, PagBank, Asaas), e-mail de confirmação.
- **Participant** — Participante vinculado a um pedido. Campos: nome completo, CPF, data de nascimento, telefone, e-mail, cidade, estado, tamanho de camiseta, contato de emergência, informações de saúde, número do kit (bibNumber), índice de equipe (teamIndex).
- **ParticipantExtra** — Extra vinculado a um participante. Campos: tipo (camisa/luva/meia), tamanho, quantidade.
- **BibCounter** — Contador de números de kit por modalidade (kids, diversao, competicao, duplas, equipes).
- **Coupon** — Cupons de desconto. Tipos: PERCENT (%) ou FIXED (R$). Suporta validade, limite de uso, subtotal mínimo e restrição por modalidade.

### Status de pedido

Os pedidos podem ter os seguintes valores no campo `status`:
- `PENDING` — Padrão, aguardando pagamento
- `PAID` / `CONFIRMED` — Pagamento aprovado (varia por gateway)
- Demais status conforme webhook dos gateways de pagamento

---

## Lotes de Inscrição

Sistema de lotes com estado visual configurável diretamente em `src/components/RegistrationSection.tsx`:

```ts
const SOLD_OUT_LOT_ID = "lotePromocional";   // lote esgotado
const NEXT_OPEN_LOT_ID = "lote2";            // próximo lote a abrir
const NEXT_LOT_NAME = "2º Lote";
const NEXT_LOT_OPENS_AT_ISO = "2026-04-18T23:59:59-03:00"; // data de abertura
```

Lotes disponíveis: Lote Promocional, 2º Lote, 3º Lote, Lote Final.

**Estado atual (13/04/2026):** Lote Promocional esgotado, 2º Lote abre em 18/04/2026.

---

## Modalidades no Grid (ExperienceGridSection)

Para habilitar um tile de modalidade para checkout, edite `ENABLED_TILES` em `src/components/ExperienceGridSection.tsx`:

```ts
const ENABLED_TILES = [""]; // adicione o id da modalidade para habilitar
```

O tile de `contato` está sempre habilitado (WhatsApp).

---

## Gateways de Pagamento

O sistema suporta múltiplos gateways simultaneamente:

| Gateway | Endpoint de checkout | Webhook |
|---------|---------------------|---------|
| Mercado Pago | `/api/checkout/start-mp` | `/api/mercadopago/webhook` |
| Stripe | `/api/checkout/start` | `/api/stripe/webhook` |
| PagBank | `/api/checkout/start-pagbank` | `/api/pagbank/webhook` |
| Asaas | `/api/checkout/start-asaas` | `/api/asaas/webhook` |

---

## Contato e Canais Oficiais

- **WhatsApp organização:** (55) 99223-4690
- **E-mail oficial:** contato@titansrace.com.br
- **Grupo oficial WhatsApp:** https://chat.whatsapp.com/I6hYJ3lR7iqAneNCoEYJdN
- **WhatsApp link direto:** https://wa.me/5555992234690

---

## Local da Prova (site)

A Titans Race acontece em **área campestre de Alegrete/RS**, com:
- Terreno variado
- Setores de lama
- Desafios naturais e áreas abertas
- Estacionamento, hidratação, área pós-prova e ambulância no local

---

## Obstáculos (em desenvolvimento)

Os obstáculos oficiais mapeados até agora:
- Muro de Escalada
- Rampa de Corda
- Lama dos Titãs
- Carga do Guerreiro
- Fogo & Fumaça

---

## Identidade Visual

- **Paleta:** Preto como cor base, laranja (`orange-500` / `#F97316`) como cor de destaque
- **Tipografia de destaque:** `heading-adventure` (fonte aventura/bold), `font-titan`
- **Estilo:** Dark, imersivo, com gradientes, backdrop blur e animações suaves (Framer Motion)
- **Tom de voz:** Épico, direto, desafiador — "você contra você", "sem desculpas", "seja um Titan"

---

## Área Administrativa

- `/admin/inscricoes` — Lista todas as inscrições com filtros
- `/admin/inscricoes/participante/[id]` — Detalhe e edição de participante
- `/admin/manual-order` — Criação manual de pedido (sem pagamento online)
- `/api/admin/export-inscricoes` — Exportação de inscrições (CSV/Excel)

---

## Sorteio

- `/sorteio` — Página pública do sorteio (para atletas assistirem)
- `/sorteio/admin` — Painel de controle do sorteio (para a organização)
- `/api/draw/` — APIs de estado, início e reset do sorteio (estado in-memory via `drawStore.ts`)

---

## Comandos Úteis

```bash
npm run dev      # Servidor de desenvolvimento em localhost:3000
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Lint com ESLint
```

---

## Variáveis de Ambiente Necessárias

- `DATABASE_URL` — URL do banco PostgreSQL
- Credenciais dos gateways: Mercado Pago, Stripe, PagBank, Asaas
- Credenciais do Resend (e-mail)
- Demais secrets conforme cada gateway

---

## Valores e Preços (todos em centavos no código)

Todos os valores monetários são armazenados e calculados em **centavos** no banco de dados e na lógica de negócio. Apenas na exibição ao usuário são convertidos para reais (dividir por 100).
