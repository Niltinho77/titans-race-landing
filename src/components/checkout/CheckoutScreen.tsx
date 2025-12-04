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

const DEFAULT_TSHIRT_SIZES = ["PP", "P", "M", "G", "GG"];

export function CheckoutScreen({ initialModality }: CheckoutScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modality, setModality] = useState<Modality | null>(initialModality);
  const [tickets, setTickets] = useState<number>(1);
  const [participants, setParticipants] = useState<ParticipantForm[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!modality && initialModality) {
      setModality(initialModality);
    }
  }, [modality, initialModality]);

  const participantsCount = useMemo(() => {
    if (!modality) return 0;
    if (modality.id === "duplas") {
      return tickets * 2;
    }
    return tickets;
  }, [modality, tickets]);

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
  const canGoToStep3 = participants.every(
    (p) =>
      p.fullName.trim() &&
      p.cpf.trim() &&
      p.birthDate.trim() &&
      p.phone.trim() &&
      p.email.trim()
  );

  const canFinish = termsAccepted;

  const handleFinish = () => {
    const payload = {
      modalityId: modality.id as ModalityId,
      tickets,
      participants,
      termsAccepted,
    };

    console.log("Checkout payload (visual):", payload);
    alert(
      "Fluxo visual concluído. Depois aqui vamos integrar com Stripe e backend."
    );
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/60 px-5 py-6 md:px-8 md:py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
        <h1 className="heading-adventure text-2xl text-white md:text-3xl">
          Checkout Titans Race
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          {modality.name} · {tickets} {modality.ticketLabel}
        </p>
      </div>

      {/* Steps */}
      <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <StepBadge label="Modalidade & ingressos" active={step === 1} number={1} />
        <StepBadge label="Dados dos participantes" active={step === 2} number={2} />
        <StepBadge label="Extras & termos" active={step === 3} number={3} />
      </div>

      {/* Conteúdo dos steps */}
      <div className="mt-8 space-y-8">
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
          <Step3ExtrasAndTerms
            participants={participants}
            onToggleExtra={handleExtraToggle}
            onChangeSize={handleExtraSizeChange}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
          />
        )}
      </div>

      {/* Navegação */}
      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-[11px] md:flex-row md:items-center md:justify-between">
        <div className="text-zinc-500">
          *Fluxo visual para apresentação. Integração com pagamento será
          conectada após aprovação do projeto.
        </div>

        <div className="flex justify-end gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as typeof step)}
              className="rounded-full border border-white/20 px-4 py-2 font-medium uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
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
              disabled={(step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3)}
              className="rounded-full bg-orange-500 px-5 py-2 font-semibold uppercase tracking-[0.18em] text-black shadow-md transition enabled:hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Próximo
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleFinish}
              disabled={!canFinish}
              className="rounded-full bg-orange-500 px-5 py-2 font-semibold uppercase tracking-[0.18em] text-black shadow-md transition enabled:hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Finalizar (visual)
            </button>
          )}
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
      className="grid gap-6 md:grid-cols-[1.6fr_1fr]"
    >
      <div>
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
          Para duplas: cada ingresso corresponde a uma dupla (2 participantes).
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="heading-adventure text-xl text-white md:text-2xl">
        Dados dos participantes
      </h2>
      <p className="text-sm text-zinc-300">
        Preencha os dados de cada participante. Em duplas, cada inscrito deve
        ter seus dados completos para identificação, kit e número de peito.
      </p>

      <div className="space-y-4">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
              Participante {index + 1} · {modality.name}
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
                onChange={(v) => onChange(index, "cpf", v)}
              />
              <Input
                label="Data de nascimento"
                placeholder="dd/mm/aaaa"
                value={participant.birthDate}
                onChange={(v) => onChange(index, "birthDate", v)}
              />
              <Input
                label="Telefone / WhatsApp"
                value={participant.phone}
                onChange={(v) => onChange(index, "phone", v)}
              />
              <Input
                label="E-mail"
                value={participant.email}
                onChange={(v) => onChange(index, "email", v)}
              />
              <Input
                label="Cidade / UF"
                value={participant.city}
                onChange={(v) => onChange(index, "city", v)}
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
                onChange={(v) => onChange(index, "emergencyPhone", v)}
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
        ))}
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
  onToggleExtra: (participantIndex: number, extra: ExtraConfig, checked: boolean) => void;
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
              Participante {index + 1} · {participant.fullName || "Nome não preenchido"}
            </p>

            <div className="grid gap-3 md:grid-cols-3">
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
                      <div>
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
          de responsabilidade da prova.
        </p>

        <div className="mt-3 flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border border-white/20 bg-black"
          />
          <label htmlFor="terms" className="text-[11px] leading-relaxed">
            Declaro que li e aceito o{" "}
            <a href="/regulamento" className="text-orange-400 underline">
              regulamento
            </a>{" "}
            e o termo de responsabilidade da Titans Race, estou apto(a) a
            participar da prova e ciente dos riscos inerentes à atividade.
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="text-zinc-400">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
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
        className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}