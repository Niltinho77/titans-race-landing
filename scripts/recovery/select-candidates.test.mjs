import test from "node:test";
import assert from "node:assert/strict";
import { selectCandidates } from "./select-candidates.mjs";
const now = new Date("2026-09-04T15:00:00Z");
const person = { fullName: "Atleta de teste", email: "atleta@example.test", cpf: "123.456.789-09", phone: "(55) 99999-1234" };
const order = (id, changes = {}) => ({ id, modalityId: "competicao", status: "FAILED", createdAt: "2026-09-01T15:00:00Z", updatedAt: "2026-09-01T15:00:00Z", participants: [{ ...person }], ...changes });
const select = (orders) => selectCandidates(orders, { now });

test("pedido falhou mas outra tentativa foi paga: nenhum candidato", () => {
  const result = select([order("failed"), order("paid", { status: "PAID" })]);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.excluded[0].reason, "pagamento_ou_inscricao_confirmada");
});
test("pagamento antigo também exclui tentativa recente", () => {
  assert.equal(select([order("failed"), order("paid", { status: "PAID", createdAt: "2026-01-01", updatedAt: "2026-01-01" })]).candidates.length, 0);
});
test("CPF liga tentativas com e-mails diferentes e telefone normaliza +55", () => {
  const result = select([order("failed"), order("paid", { status: "CONFIRMED", participants: [{ ...person, email: "outro@example.test", cpf: "12345678909", phone: "+55 55 99999-1234" }] })]);
  assert.equal(result.candidates.length, 0);
});
test("mesmo telefone bloqueia e-mail e CPF diferentes", () => {
  assert.equal(select([order("failed"), order("paid", { status: "PAID", participants: [{ ...person, cpf: "98765432100", email: "outro@example.test", phone: "+55 55 99999-1234" }] })]).candidates.length, 0);
});
test("várias falhas geram um único contato com e-mail normalizado", () => {
  const result = select([order("one"), order("two", { participants: [{ ...person, email: "  ATLETA@EXAMPLE.TEST " }] })]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].email, person.email);
  assert.equal(result.candidates[0].relatedOrderIds.length, 2);
});
test("nova tentativa reinicia a espera de 24 horas", () => {
  assert.equal(select([order("old"), order("new", { createdAt: "2026-09-04T14:00:00Z", updatedAt: "2026-09-04T14:00:00Z" })]).excluded[0].reason, "tentativa_ou_atualizacao_recente");
});
test("paidAt e status bruto protegem contra webhook que regride status", () => {
  for (const evidence of [{ paidAt: now }, { mpPaymentStatus: "approved" }, { asaasPaymentStatus: "RECEIVED" }, { confirmationEmailSentAt: now }]) {
    assert.equal(select([order("one", evidence)]).candidates.length, 0);
  }
});
test("estorno do Mercado Pago não é confundido com falha recuperável", () => {
  assert.equal(select([order("one", { mpPaymentStatus: "refunded" })]).excluded[0].reason, "estorno_ou_contestacao");
});
test("pendente e pagamento em análise não entram na lista de candidatos", () => {
  assert.equal(select([order("one", { status: "PENDING" })]).review[0].reason, "conferir_pagamentos_pendentes_no_gateway");
  assert.equal(select([order("one", { status: "PENDING", mpPaymentStatus: "in_process" })]).excluded[0].reason, "pagamento_em_analise_ou_autorizado");
});
test("equipe com vários contatos exige revisão e membro pago suprime o grupo", () => {
  const team = order("team", { participants: [person, { ...person, email: "equipe@example.test", cpf: "98765432100", phone: "11912345678" }] });
  assert.equal(select([team]).review[0].reason, "contato_do_comprador_ambiguo_ou_invalido");
  assert.equal(select([team, order("paid", { status: "PAID", participants: [team.participants[1]] })]).candidates.length, 0);
});
test("ligações transitivas entre tentativas são respeitadas", () => {
  const bridge = { ...person, email: "ponte@example.test" };
  const paid = { ...bridge, cpf: "98765432100", phone: "11912345678" };
  assert.equal(select([order("one"), order("two", { participants: [bridge] }), order("three", { status: "PAID", participants: [paid] })]).excluded.length, 1);
});
test("não agrupa desconhecidos por valores vazios e não recupera tentativas antigas", () => {
  const result = select([order("invalid", { participants: [{ email: "", cpf: "", phone: "" }] }), order("ok"), order("old", { createdAt: "2026-01-01", updatedAt: "2026-01-01", participants: [{ ...person, email: "antigo@example.test", cpf: "", phone: "" }] })]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.review.length, 1);
  assert.equal(result.excluded[0].reason, "fora_da_janela");
});
