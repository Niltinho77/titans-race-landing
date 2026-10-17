# Convites de inscrição

O fechamento público permanece em `src/config/registration.ts`. Convites autorizam exclusivamente o checkout Asaas a criar um pedido na modalidade escolhida, com um ingresso (1 atleta, 2 na dupla ou 4 no quarteto). Não há vínculo prévio com CPF.

## Publicação

1. Aplicar a migração aditiva `20261017020000_registration_invites` com `npx prisma migrate deploy` no banco do ambiente.
2. Gerar o cliente Prisma com `npx prisma generate` e publicar a aplicação normalmente.
3. Entrar como administrador e acessar `/admin/convites`, também disponível no botão **Convites** do portal.

A migração cria somente a tabela de convites, seus índices e sua relação com pedidos. Não altera inscrições existentes nem a data de encerramento.

## Operação

Informe uma identificação interna, modalidade e validade entre 1 e 168 horas (padrão: 24). Copie o link exibido e envie ao atleta. O link completo é exibido somente na criação; o banco armazena seu hash. Se perder um link disponível, cancele o convite e emita outro.

O formulário e o pagamento usam preços, extras e cupons atuais do checkout. Cada convite gera no máximo um pedido, inclusive em acessos simultâneos. A reserva ocorre junto da criação do pedido em uma transação. Erros anteriores à gravação não consomem o convite.

Depois de iniciado, o link mostra somente a opção de continuar a mesma cobrança pendente, sem expor os dados cadastrais. Ele não cria outro pedido. Quem receber o link compartilhado pode utilizá-lo primeiro ou continuar esse mesmo pagamento.

Convites disponíveis podem ser cancelados pelo painel. Convites usados não são liberados novamente, inclusive após falha, cancelamento ou expiração do pagamento. Antes de emitir um novo convite nesses casos, confira no Asaas se a cobrança anterior ainda pode ser paga. Falhas de comunicação com o provedor podem ter resultado incerto; por isso a reserva é mantida.

O webhook Asaas existente confirma o pedido e envia os e-mails aos endereços distintos dos participantes.

## Verificação

`node --test scripts/tests/registration-invites.test.cjs scripts/tests/registration-close.test.cjs scripts/tests/external-payment.test.cjs`

Os testes simulam banco e gateway; não criam cobranças nem inscrições reais.
