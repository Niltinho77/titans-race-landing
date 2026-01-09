"use client";

import { useMemo, useState } from "react";
import { EXTRAS, MODALITIES, ExtraType, ModalityId } from "@/config/checkout";

type ParticipantExtraPayload = { type: ExtraType; size?: string; quantity: number };

type ParticipantPayload = {
  fullName: string;
  cpf: string;
  birthDate: string; // dd/mm/aaaa
  phone: string;
  email: string;
  city?: string;
  state?: string;
  tshirtSize: string;
  emergencyName?: string;
  emergencyPhone?: string;
  healthInfo?: string;
  extras: ParticipantExtraPayload[];
};

function emptyParticipant(): ParticipantPayload {
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

export default function ManualOrderPage() {
  const [adminKey, setAdminKey] = useState("");
  const [modalityId, setModalityId] = useState<ModalityId>("competicao");
  const [tickets, setTickets] = useState(1);
  const [ticketsDiscountPercent, setTicketsDiscountPercent] = useState(10);
  const [paidVia, setPaidVia] = useState("PIX_BOX");
  const [couponCode, setCouponCode] = useState("BOX10");

  const [participants, setParticipants] = useState<ParticipantPayload[]>([
    emptyParticipant(),
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const modality = useMemo(
    () => MODALITIES.find((m) => m.id === modalityId),
    [modalityId]
  );

  const perTicket = useMemo(() => {
    if (modalityId === "duplas") return 2;
    if (modalityId === "equipes") return 4;
    return 1;
  }, [modalityId]);

  const expectedParticipants = tickets * perTicket;

  const syncParticipantsCount = () => {
    setParticipants((prev) => {
      const clone = [...prev];
      if (clone.length < expectedParticipants) {
        for (let i = clone.length; i < expectedParticipants; i++) clone.push(emptyParticipant());
      } else if (clone.length > expectedParticipants) {
        clone.length = expectedParticipants;
      }
      return clone;
    });
  };

  const updateP = (i: number, key: keyof ParticipantPayload, value: any) => {
    setParticipants((prev) => {
      const clone = [...prev];
      clone[i] = { ...clone[i], [key]: value };
      return clone;
    });
  };

  const toggleExtra = (pi: number, type: ExtraType, checked: boolean) => {
    setParticipants((prev) => {
      const clone = [...prev];
      const p = { ...clone[pi] };

      if (checked) {
        const cfg = EXTRAS.find((e) => e.id === type);
        if (!p.extras.find((x) => x.type === type)) {
          p.extras = [
            ...p.extras,
            {
              type,
              quantity: 1,
              size: cfg?.hasSize ? cfg?.sizes?.[0] : undefined,
            },
          ];
        }
      } else {
        p.extras = p.extras.filter((x) => x.type !== type);
      }

      clone[pi] = p;
      return clone;
    });
  };

  const changeExtraSize = (pi: number, type: ExtraType, size: string) => {
    setParticipants((prev) => {
      const clone = [...prev];
      const p = { ...clone[pi] };
      p.extras = p.extras.map((x) => (x.type === type ? { ...x, size } : x));
      clone[pi] = p;
      return clone;
    });
  };

  const submit = async () => {
    setError(null);
    setResult(null);

    if (!adminKey.trim()) {
      setError("Informe a ADMIN KEY.");
      return;
    }

    if (!modality) {
      setError("Modalidade inválida.");
      return;
    }

    if (participants.length !== expectedParticipants) {
      setError(`Participantes precisa ser ${expectedParticipants}. Clique em “Ajustar participantes”.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({
          modalityId,
          tickets,
          paidVia: paidVia.trim(),
          couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
          ticketsDiscountPercent,
          participants,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar pedido manual.");
      }

      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Falha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin · Pedido manual (PIX / Box)</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Cria pedido como <b>PAID</b>, reserva BIB e envia e-mail.
      </p>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>Admin Key</label>
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_MANUAL_ORDER_KEY"
            type="password"
            style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label>Modalidade</label>
            <select
              value={modalityId}
              onChange={(e) => setModalityId(e.target.value as ModalityId)}
              style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
            >
              {MODALITIES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label>Ingressos</label>
            <input
              value={tickets}
              onChange={(e) => setTickets(Math.max(1, Number(e.target.value || 1)))}
              type="number"
              min={1}
              style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label>Desconto ingressos (%)</label>
            <input
              value={ticketsDiscountPercent}
              onChange={(e) => setTicketsDiscountPercent(Number(e.target.value || 0))}
              type="number"
              min={0}
              max={100}
              style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label>paidVia (rastreamento)</label>
            <input
              value={paidVia}
              onChange={(e) => setPaidVia(e.target.value)}
              placeholder="PIX_BOX_CROSSROSUL"
              style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label>couponCode (opcional)</label>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="BOX10"
              style={{ padding: 10, border: "1px solid #444", borderRadius: 8 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          <button
            onClick={syncParticipantsCount}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #444",
              cursor: "pointer",
            }}
          >
            Ajustar participantes ({participants.length} → {expectedParticipants})
          </button>
          <span style={{ opacity: 0.8 }}>
            {modalityId} · {tickets} ingresso(s) · {perTicket} por ingresso ⇒ <b>{expectedParticipants}</b> participantes
          </span>
        </div>

        <hr style={{ margin: "14px 0", opacity: 0.2 }} />

        {participants.map((p, i) => (
          <div key={i} style={{ border: "1px solid #333", borderRadius: 12, padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              Participante {i + 1}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <input placeholder="Nome completo" value={p.fullName} onChange={(e) => updateP(i, "fullName", e.target.value)} style={inp} />
              <input placeholder="CPF" value={p.cpf} onChange={(e) => updateP(i, "cpf", e.target.value)} style={inp} />
              <input placeholder="Nascimento (dd/mm/aaaa)" value={p.birthDate} onChange={(e) => updateP(i, "birthDate", e.target.value)} style={inp} />
              <input placeholder="Telefone" value={p.phone} onChange={(e) => updateP(i, "phone", e.target.value)} style={inp} />
              <input placeholder="Email" value={p.email} onChange={(e) => updateP(i, "email", e.target.value)} style={inp} />
              <input placeholder="Cidade" value={p.city ?? ""} onChange={(e) => updateP(i, "city", e.target.value)} style={inp} />
              <input placeholder="UF" value={p.state ?? ""} onChange={(e) => updateP(i, "state", e.target.value)} style={inp} />
              <input placeholder="Camiseta (PP/P/M/G/GG)" value={p.tshirtSize} onChange={(e) => updateP(i, "tshirtSize", e.target.value)} style={inp} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Extras</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                {EXTRAS.map((ex) => {
                  const sel = p.extras.find((x) => x.type === ex.id);
                  return (
                    <div key={ex.id} style={{ border: "1px solid #2b2b2b", borderRadius: 10, padding: 10 }}>
                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!sel}
                          onChange={(e) => toggleExtra(i, ex.id, e.target.checked)}
                        />
                        <b style={{ fontSize: 12 }}>{ex.name}</b>
                      </label>

                      {ex.hasSize && sel && ex.sizes?.length ? (
                        <select
                          value={sel.size ?? ex.sizes[0]}
                          onChange={(e) => changeExtraSize(i, ex.id, e.target.value)}
                          style={{ marginTop: 8, width: "100%", padding: 8, borderRadius: 8, border: "1px solid #444" }}
                        >
                          {ex.sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 10,
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "#ff5c0c",
            fontWeight: 700,
          }}
        >
          {loading ? "Enviando..." : "Criar pedido manual (PAID) e enviar email"}
        </button>

        {error ? (
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid #7a1f1f", background: "#2a0f0f" }}>
            {error}
          </div>
        ) : null}

        {result ? (
          <pre style={{ padding: 12, borderRadius: 12, border: "1px solid #333", background: "#111", overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: 10,
  border: "1px solid #444",
  borderRadius: 8,
};
