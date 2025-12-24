// src/components/checkout/CheckoutScreen.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXTRAS,
  ExtraConfig,
  ExtraType,
  Modality,
  ModalityId,
} from "@/config/checkout";
import { motion } from "framer-motion";

type ParticipantExtra = {
  type: ExtraType;
  size?: string;
  quantity: number;
};

type ParticipantForm = {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  tshirtSize: string;
  emergencyName: string;
  emergencyPhone: string;
  healthInfo: string;
  extras: ParticipantExtra[];
};

type CheckoutScreenProps = {
  initialModality: Modality | null;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const STRIPE_FEE_PERCENT = 0.0399; // 3,99%
const STRIPE_FEE_FIXED = 39; // R$ 0,39 em centavos

function calculateFee(amountCents: number) {
  if (amountCents <= 0) {
    return { totalWithFee: 0, feeAmount: 0 };
  }
  const bruto = (amountCents + STRIPE_FEE_FIXED) / (1 - STRIPE_FEE_PERCENT);
  const totalWithFee = Math.round(bruto);
  const feeAmount = totalWithFee - amountCents;
  return { totalWithFee, feeAmount };
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

// CPF -> 000.000.000-00
function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9)}`;
}

// Telefone -> (99) 99999-9999
function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Data -> dd/mm/aaaa
function formatDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// validações simples pra liberar próximo passo
function isValidCPF(value: string): boolean {
  return onlyDigits(value).length === 11;
}

function isValidPhone(value: string): boolean {
  return onlyDigits(value).length === 11;
}

function isValidDate(value: string): boolean {
  return value.length === 10;
}

function isValidEmail(value: string): boolean {
  return value.includes("@") && value.includes(".");
}

const DEFAULT_TSHIRT_SIZES = ["PP", "P", "M", "G", "GG"];

// ✅ regra centralizada (duplas/equipes)
function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

function normalizeCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function CheckoutScreen({ initialModality }: CheckoutScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modality, setModality] = useState<Modality | null>(initialModality);
  const [tickets, setTickets] = useState<number>(1);
  const [participants, setParticipants] = useState<ParticipantForm[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ✅ cupom
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (!modality && initialModality) {
      setModality(initialModality);
    }
  }, [modality, initialModality]);

  // ✅ participantes por ticket (duplas/equipes)
  const participantsCount = useMemo(() => {
    if (!modality) return 0;
    const perTicket = getParticipantsPerTicket(modality.id as ModalityId);
    return tickets * perTicket;
  }, [modality, tickets]);

  const {
    ticketsTotal,
    extrasTotal,
    grandTotal,
    discountTotal,
    totalAfterDiscount,
    feeAmount,
    grandTotalWithFee,
  } = useMemo(() => {
    if (!modality) {
      return {
        ticketsTotal: 0,
        extrasTotal: 0,
        grandTotal: 0,
        discountTotal: 0,
        totalAfterDiscount: 0,
        feeAmount: 0,
        grandTotalWithFee: 0,
      };
    }

    const ticketsTotalCalc = tickets * modality.basePrice;

    let extrasTotalCalc = 0;
    for (const participant of participants) {
      for (const extra of participant.extras) {
        const config = EXTRAS.find((e) => e.id === extra.type);
        if (!config) continue;
        const quantity = extra.quantity ?? 1;
        extrasTotalCalc += config.price * quantity;
      }
    }

    const subtotal = ticketsTotalCalc + extrasTotalCalc;

    // ✅ desconto aplicado (prévia) — nunca maior que subtotal
    const discount = Math.min(discountAmount || 0, subtotal);
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);

    // ✅ taxa calculada sobre o total líquido após desconto
    const { totalWithFee, feeAmount } = calculateFee(subtotalAfterDiscount);

    return {
      ticketsTotal: ticketsTotalCalc,
      extrasTotal: extrasTotalCalc,
      grandTotal: subtotal,
      discountTotal: discount,
      totalAfterDiscount: subtotalAfterDiscount,
      feeAmount,
      grandTotalWithFee: totalWithFee,
    };
  }, [modality, tickets, participants, discountAmount]);

  const applyCoupon = async () => {
    const code = normalizeCoupon(couponCode);

    setCouponError(null);

    // vazio => apenas remove
    if (!code) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    if (!modality) return;

    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          modalityId: modality.id,
          subtotal: grandTotal, // ingressos + extras (em centavos)
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Cupom inválido.");
      }

      // esperado: { code, discountAmount, totalAfterDiscount }
      setAppliedCoupon(String(data.code || code));
      setDiscountAmount(Number(data.discountAmount) || 0);
    } catch (e: any) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponError(e?.message || "Não foi possível aplicar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(null);
  };

  useEffect(() => {
    // se mudou o carrinho, invalidamos a prévia do cupom (segurança/consistência)
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponError("O carrinho mudou. Aplique o cupom novamente.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, participantsCount, extrasTotal, modality?.id]);

  useEffect(() => {
    if (!participantsCount) {
      setParticipants([]);
      return;
    }

    setParticipants((prev) => {
      const clone = [...prev];

      if (clone.length < participantsCount) {
        const toAdd = participantsCount - clone.length;
        for (let i = 0; i < toAdd; i++) {
          clone.push(createEmptyParticipant());
        }
      } else if (clone.length > participantsCount) {
        clone.length = participantsCount;
      }

      return clone;
    });
  }, [participantsCount]);

  if (!modality) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/60 px-5 py-6 text-sm text-zinc-200">
        <p className="text-base text-zinc-100">
          Selecione uma modalidade na página inicial para iniciar o checkout.
        </p>
      </div>
    );
  }

  const handleParticipantChange = (
    index: number,
    field: keyof ParticipantForm,
    value: string
  ) => {
    setParticipants((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const handleExtraToggle = (
    participantIndex: number,
    extra: ExtraConfig,
    checked: boolean
  ) => {
    setParticipants((prev) => {
      const clone = [...prev];
      const p = { ...clone[participantIndex] };

      if (checked) {
        const already = p.extras.find((e) => e.type === extra.id);
        if (!already) {
          p.extras.push({
            type: extra.id,
            quantity: 1,
            size: extra.hasSize ? extra.sizes?.[0] : undefined,
          });
        }
      } else {
        p.extras = p.extras.filter((e) => e.type !== extra.id);
      }

      clone[participantIndex] = p;
      return clone;
    });
  };

  const handleExtraSizeChange = (
    participantIndex: number,
    extraType: ExtraType,
    size: string
  ) => {
    setParticipants((prev) => {
      const clone = [...prev];
      const p = { ...clone[participantIndex] };
      p.extras = p.extras.map((e) =>
        e.type === extraType ? { ...e, size } : e
      );
      clone[participantIndex] = p;
      return clone;
    });
  };

  const canGoToStep2 = tickets > 0 && modality;

  const canGoToStep3 =
    participants.length > 0 &&
    participants.every((p) => {
      return (
        p.fullName.trim().length > 3 &&
        isValidCPF(p.cpf) &&
        isValidDate(p.birthDate) &&
        isValidPhone(p.phone) &&
        isValidEmail(p.email)
      );
    });

  const canFinish = termsAccepted;

  const handleFinish = async () => {
    if (!modality) return;
    if (!termsAccepted) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const normalizedCoupon =
        appliedCoupon ?? normalizeCoupon(couponCode) ?? null;

      const payload = {
        modalityId: modality.id as ModalityId,
        tickets,
        participants: participants.map((p) => ({
          fullName: p.fullName,
          cpf: p.cpf,
          birthDate: p.birthDate,
          phone: p.phone,
          email: p.email,
          city: p.city,
          state: p.state,
          tshirtSize: p.tshirtSize,
          emergencyName: p.emergencyName,
          emergencyPhone: p.emergencyPhone,
          healthInfo: p.healthInfo,
          extras: p.extras,
        })),
        termsAccepted,
        couponCode: normalizedCoupon, // ✅ cupom no nível do pedido
      };

      const res = await fetch("/api/checkout/start-mp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao salvar inscrição.");
      }

      const data: { orderId: string; checkoutUrl?: string } = await res.json();

      setCreatedOrderId(data.orderId);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setSubmitError(
        "Inscrição registrada, mas não foi possível abrir o pagamento. Entre em contato com a organização."
      );
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro inesperado ao finalizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTeamMode = (modality.id as ModalityId) === "equipes";

  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-black/60 px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="heading-adventure text-2xl text-white md:text-3xl">
            Checkout Titans Race
          </h1>
          {isTeamMode && (
            <p className="mt-2 text-[12px] text-orange-200/90">
              Aviso: a equipe deve conter{" "}
              <span className="font-semibold">pelo menos 1 mulher</span>.
            </p>
          )}
        </div>

        <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 md:text-xs">
          {modality.name} · {tickets} {modality.ticketLabel}
        </p>
      </div>

      {/* Steps */}
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <StepBadge label="Modalidade & ingressos" active={step === 1} number={1} />
        <StepBadge label="Dados dos participantes" active={step === 2} number={2} />
        <StepBadge label="Extras & termos" active={step === 3} number={3} />
      </div>

      {/* Conteúdo dos steps */}
      <div className="mt-6 space-y-7">
        {step === 1 && (
          <Step1ModalityTickets
            modality={modality}
            tickets={tickets}
            setTickets={setTickets}
          />
        )}

        {step === 2 && (
          <Step2Participants
            modality={modality}
            participants={participants}
            onChange={handleParticipantChange}
          />
        )}

        {step === 3 && (
          <>
            <Step3ExtrasAndTerms
              participants={participants}
              onToggleExtra={handleExtraToggle}
              onChangeSize={handleExtraSizeChange}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
            />

            {/* ✅ CUPOM */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-300">
              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Cupom de desconto
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ex: NATAL10"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-60"
                  >
                    {couponLoading ? "Aplicando..." : "Aplicar"}
                  </button>

                  {(appliedCoupon || couponCode) && (
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {appliedCoupon && discountAmount > 0 && (
                <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
                  Cupom <span className="font-semibold">{appliedCoupon}</span>{" "}
                  aplicado. Desconto:{" "}
                  <span className="font-semibold">
                    {formatCurrency(discountAmount)}
                  </span>
                </p>
              )}

              {couponError && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  {couponError}
                </p>
              )}

              <p className="mt-2 text-[11px] text-zinc-500">
                O desconto é validado novamente no pagamento para evitar
                inconsistências.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Resumo financeiro */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Resumo financeiro
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              {tickets} {modality.ticketLabel}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Os valores abaixo já consideram todos os participantes e extras
              selecionados.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-left md:text-left">
            <p className="text-sm">
              Ingressos:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(ticketsTotal)}
              </span>
            </p>
            <p className="text-sm">
              Extras:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(extrasTotal)}
              </span>
            </p>
            <p className="text-sm">
              Subtotal:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(grandTotal)}
              </span>
            </p>

            {discountTotal > 0 && (
              <>
                <p className="text-sm">
                  Desconto:{" "}
                  <span className="font-semibold text-emerald-300">
                    -{formatCurrency(discountTotal)}
                  </span>
                </p>
                <p className="text-sm">
                  Subtotal após desconto:{" "}
                  <span className="font-semibold text-white">
                    {formatCurrency(totalAfterDiscount)}
                  </span>
                </p>
              </>
            )}

            <p className="text-sm">
              Taxa da plataforma de pagamento:{" "}
              <span className="font-semibold text-white">
                {formatCurrency(feeAmount)}
              </span>
            </p>
            <p className="text-sm">
              Total com taxas:{" "}
              <span className="font-semibold text-orange-400">
                {formatCurrency(grandTotalWithFee)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Navegação + mensagens */}
      <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-5 text-[11px] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 text-[11px] text-zinc-400 md:w-1/2">
          {submitError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200">
              {submitError}
            </p>
          )}

          {createdOrderId && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-200">
              Inscrição registrada com sucesso! Número do pedido:{" "}
              <span className="font-semibold">{createdOrderId}</span>. Você
              receberá todas as informações do evento no e-mail informado.
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <a
            href="/#inicio"
            className="w-full rounded-full border border-white/20 px-4 py-2 text-center font-medium uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5 md:w-auto"
          >
            Voltar para o início
          </a>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:justify-end md:gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as typeof step)}
                className="w-full rounded-full border border-white/20 px-4 py-2 font-medium uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5 md:w-auto"
              >
                Voltar
              </button>
            )}

            {step < 3 && (
              <button
                onClick={() => {
                  if (step === 1 && canGoToStep2) setStep(2);
                  if (step === 2 && canGoToStep3) setStep(3);
                }}
                disabled={
                  (step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3)
                }
                className="w-full rounded-full bg-orange-500 px-5 py-2 font-semibold uppercase tracking-[0.18em] text-black shadow-md transition enabled:hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                Próximo
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleFinish}
                disabled={!canFinish || isSubmitting || couponLoading}
                className="w-full rounded-full bg-orange-500 px-5 py-2 font-semibold uppercase tracking-[0.18em] text-black shadow-md transition enabled:hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {isSubmitting ? "Enviando..." : "Finalizar inscrição"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function createEmptyParticipant(): ParticipantForm {
  return {
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    tshirtSize: "M",
    emergencyName: "",
    emergencyPhone: "",
    healthInfo: "",
    extras: [],
  };
}

function StepBadge({
  label,
  active,
  number,
}: {
  label: string;
  active: boolean;
  number: number;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
        active
          ? "border-orange-500 bg-orange-500/10 text-orange-100"
          : "border-white/10 bg-black/60 text-zinc-500"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          active ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-300"
        }`}
      >
        {number}
      </span>
      <span>{label}</span>
    </div>
  );
}

function Step1ModalityTickets({
  modality,
  tickets,
  setTickets,
}: {
  modality: Modality;
  tickets: number;
  setTickets: (v: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 md:grid-cols-[1.6fr_1fr]"
    >
      <div className="min-w-0">
        <h2 className="heading-adventure text-xl text-white md:text-2xl">
          {modality.name}
        </h2>
        <p className="mt-3 text-sm text-zinc-300">{modality.description}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200">
        <p className="text-xs text-zinc-400">Quantidade de ingressos</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTickets(Math.max(1, tickets - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black text-lg text-zinc-200 hover:bg-white/5"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-lg font-semibold text-white">
            {tickets}
          </span>
          <button
            type="button"
            onClick={() => setTickets(tickets + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black text-lg text-zinc-200 hover:bg-white/5"
          >
            +
          </button>
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">
          {modality.id === "duplas"
            ? "Para duplas: cada ingresso corresponde a 2 participantes."
            : modality.id === "equipes"
            ? "Para equipes: cada ingresso corresponde a 4 participantes."
            : "Quantidade de ingressos para esta modalidade."}
        </p>
      </div>
    </motion.div>
  );
}

function Step2Participants({
  modality,
  participants,
  onChange,
}: {
  modality: Modality;
  participants: ParticipantForm[];
  onChange: (index: number, field: keyof ParticipantForm, value: string) => void;
}) {
  const isTeamMode = (modality.id as ModalityId) === "equipes";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <h2 className="heading-adventure text-xl text-white md:text-2xl">
        Dados dos participantes
      </h2>

      <p className="text-sm text-zinc-300">
        Preencha os dados de cada participante.
        {modality.id === "duplas" &&
          " Em duplas, cada ingresso corresponde a 2 participantes."}
        {isTeamMode &&
          " Em equipes, cada ingresso corresponde a 4 participantes."}
      </p>

      {isTeamMode && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3 text-xs text-orange-100">
          Atenção: a equipe deve conter{" "}
          <span className="font-semibold">pelo menos 1 mulher</span>. A
          verificação é por declaração do responsável no ato da inscrição.
        </div>
      )}

      <div className="space-y-4">
        {participants.map((participant, index) => {
          const teamSize = 4;
          const teamNumber = isTeamMode ? Math.floor(index / teamSize) + 1 : null;
          const memberNumber = isTeamMode ? (index % teamSize) + 1 : index + 1;

          return (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-black/70 p-4"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                {isTeamMode
                  ? `Equipe ${teamNumber} · Integrante ${memberNumber}/${teamSize}`
                  : `Participante ${index + 1} · ${modality.name}`}
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Nome completo"
                  value={participant.fullName}
                  onChange={(v) => onChange(index, "fullName", v)}
                />
                <Input
                  label="CPF"
                  value={participant.cpf}
                  onChange={(v) => onChange(index, "cpf", formatCPF(v))}
                  maxLength={14}
                  inputMode="numeric"
                />
                <Input
                  label="Data de nascimento"
                  placeholder="dd/mm/aaaa"
                  value={participant.birthDate}
                  onChange={(v) => onChange(index, "birthDate", formatDate(v))}
                  maxLength={10}
                  inputMode="numeric"
                />
                <Input
                  label="Telefone / WhatsApp"
                  value={participant.phone}
                  onChange={(v) => onChange(index, "phone", formatPhone(v))}
                  maxLength={15}
                  inputMode="tel"
                />
                <Input
                  label="E-mail"
                  value={participant.email}
                  onChange={(v) => onChange(index, "email", v)}
                  type="email"
                />
                <Input
                  label="Cidade"
                  value={participant.city}
                  onChange={(v) => onChange(index, "city", v)}
                />
                <Input
                  label="UF"
                  value={participant.state}
                  onChange={(v) =>
                    onChange(index, "state", v.toUpperCase().slice(0, 2))
                  }
                  maxLength={2}
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Select
                  label="Tamanho da camiseta"
                  value={participant.tshirtSize}
                  onChange={(v) => onChange(index, "tshirtSize", v)}
                  options={DEFAULT_TSHIRT_SIZES}
                />
                <Input
                  label="Contato de emergência"
                  value={participant.emergencyName}
                  onChange={(v) => onChange(index, "emergencyName", v)}
                />
                <Input
                  label="Telefone do contato"
                  value={participant.emergencyPhone}
                  onChange={(v) =>
                    onChange(index, "emergencyPhone", formatPhone(v))
                  }
                  maxLength={15}
                  inputMode="tel"
                />
              </div>

              <div className="mt-4">
                <label className="text-xs text-zinc-400">
                  Condição de saúde relevante (opcional)
                </label>
                <textarea
                  value={participant.healthInfo}
                  onChange={(e) => onChange(index, "healthInfo", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Step3ExtrasAndTerms({
  participants,
  onToggleExtra,
  onChangeSize,
  termsAccepted,
  setTermsAccepted,
}: {
  participants: ParticipantForm[];
  onToggleExtra: (
    participantIndex: number,
    extra: ExtraConfig,
    checked: boolean
  ) => void;
  onChangeSize: (participantIndex: number, extraType: ExtraType, size: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="heading-adventure text-xl text-white md:text-2xl">
        Extras & termos
      </h2>

      <p className="text-sm text-zinc-300">
        Opcionalmente, adicione itens extras para cada participante. Em seguida,
        leia e aceite o regulamento e o termo de responsabilidade para concluir
        o pedido.
      </p>

      <div className="space-y-4">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
              Participante {index + 1} ·{" "}
              {participant.fullName || "Nome não preenchido"}
            </p>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {EXTRAS.map((extra) => {
                const isSelected = participant.extras.some(
                  (e) => e.type === extra.id
                );
                const selectedExtra = participant.extras.find(
                  (e) => e.type === extra.id
                );

                return (
                  <div
                    key={extra.id}
                    className="rounded-xl border border-white/10 bg-black/60 p-3 text-xs"
                  >
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          onToggleExtra(index, extra, e.target.checked)
                        }
                        className="mt-1 h-3.5 w-3.5 rounded border border-white/20 bg-black"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100">
                          {extra.name}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {extra.description}
                        </p>
                      </div>
                    </label>

                    {extra.hasSize && isSelected && extra.sizes && (
                      <div className="mt-2">
                        <label className="text-[11px] text-zinc-400">
                          Tamanho
                        </label>
                        <select
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/80 px-2 py-1 text-[11px] text-zinc-100 outline-none focus:border-orange-500"
                          value={selectedExtra?.size ?? extra.sizes[0]}
                          onChange={(e) =>
                            onChangeSize(index, extra.id, e.target.value)
                          }
                        >
                          {extra.sizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-300">
        <p className="text-[11px] text-zinc-400">
          Antes de finalizar, é necessário concordar com o regulamento e o termo
          de responsabilidade da prova. Você pode acessar os documentos nos links
          abaixo:
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 text-[11px]">
          <a
            href="/docs/regulamento.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-orange-300 hover:bg-white/5"
          >
            Ver regulamento (PDF)
          </a>

          <a
            href="/docs/termo-responsabilidade.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-orange-300 hover:bg-white/5"
          >
            Ver termo de responsabilidade (PDF)
          </a>
        </div>

        <div className="mt-3 flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border border-white/20 bg-black"
          />
          <label htmlFor="terms" className="text-[11px] leading-relaxed">
            Declaro que li e aceito o regulamento e o termo de responsabilidade
            da Titans Race, estou apto(a) a participar da prova e ciente dos
            riscos inerentes à atividade.
          </label>
        </div>
      </div>
    </motion.div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="text-zinc-400">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}