# Prévia de recuperação de inscrições

`npm run recovery:preview` consulta o banco configurado em `.env.local`/`.env` e gera um JSON privado em `.tmp/recovery/`. Não envia e-mails, não cria cupons e não altera pedidos. `npm run recovery:test` testa a seleção com dados fictícios.

## Critérios atuais

- Cruza CPF, e-mail normalizado e telefone, incluindo ligações entre várias tentativas e participantes de equipes.
- Exclui todo o grupo se qualquer pedido indicar pagamento, confirmação enviada ou número de inscrição. Pagamentos fora da janela também excluem.
- Exclui estornos, contestações e pagamentos autorizados/em análise.
- Espera pelo menos 24 horas após a criação ou atualização mais recente de qualquer tentativa relacionada.
- Considera tentativas criadas nos últimos 30 dias.
- Sugere somente grupos cujas tentativas terminaram como FAILED, CANCELED, CANCELLED, EXPIRED ou OVERDUE.
- Pendências e contatos ambíguos de grupos ficam para revisão. Não identifica comprador pelo primeiro participante nem envia a todos os membros.
- Retorna no máximo um contato por grupo. CPF e telefone são usados em memória, sem constar do relatório salvo.

## Limites e próxima etapa de envio

Esta é uma seleção conservadora de candidatos, não uma automação de campanha. Contatos compartilhados podem excluir pessoas diferentes da mesma família/equipe; isso é preferível a oferecer desconto a quem já pagou. A base não tem um identificador de edição no pedido: pagamentos de todo o histórico consultado excluem candidatos. Não usar o relatório antigo para enviar mensagens.

Antes de implementar disparos: confirmar oferta e validade, conciliar pagamentos com o gateway, repetir a seleção imediatamente antes de cada envio, manter registro persistente de envio por destinatário/campanha e tratar reexecuções e falhas do provedor sem duplicar mensagens. A prévia não verifica situação ao vivo no gateway, histórico de campanhas externas ou preferências de recebimento. Não presume que pedidos pendentes expiraram.

Quem saiu antes de criar o pedido não aparece: os contatos só são persistidos quando há pedido.
