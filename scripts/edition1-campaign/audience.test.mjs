import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAudience,
  hasRegistrationEvidence,
  normalizePhone,
  parseParticipantCopy,
} from "./audience.mjs";

test("normaliza telefone com código do Brasil", () => {
  assert.equal(normalizePhone("+55 (55) 99999-1234"), "55999991234");
});

test("reconhece evidência de inscrição", () => {
  assert.equal(hasRegistrationEvidence({ status: "PAID", participants: [] }), true);
  assert.equal(hasRegistrationEvidence({ status: "OVERDUE", participants: [] }), false);
  assert.equal(hasRegistrationEvidence({ status: "PENDING", paidAt: new Date(), participants: [] }), true);
});

test("exclui por CPF, e-mail ou telefone e deduplica o destinatário", () => {
  const old = [
    { fullName: "Já inscrita", cpf: "123.456.789-09", email: "antigo@example.test", phone: "" },
    { fullName: "Disponível", cpf: "98765432100", email: "VOLTA@example.test", phone: "" },
    { fullName: "Mesmo e-mail", cpf: "", email: "volta@example.test", phone: "11911112222" },
    { fullName: "Sem contato", cpf: "", email: "", phone: "11999998888" },
  ];
  const current = [{
    status: "PAID",
    participants: [{ cpf: "12345678909", email: "novo@example.test", phone: "" }],
  }];
  const result = buildAudience(old, current);
  assert.deepEqual(result.recipients, [{ email: "volta@example.test", name: "Disponível" }]);
  assert.equal(result.summary.matchedCurrentEdition, 1);
  assert.equal(result.summary.eligibleWithoutEmail, 1);
  assert.equal(result.summary.duplicateEmailSuppressed, 1);
});

test("lê o COPY do pg_restore sem expor a estrutura ao chamador", () => {
  const sql = 'COPY public."Participant" (id, "fullName", cpf, phone, email) FROM stdin;\n1\tAna\\tSilva\t123\t5555\tANA@example.test\n\\.\n';
  assert.deepEqual(parseParticipantCopy(sql), [{
    id: "1",
    fullName: "Ana\tSilva",
    cpf: "123",
    phone: "5555",
    email: "ANA@example.test",
  }]);
});
