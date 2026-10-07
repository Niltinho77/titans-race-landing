# Campanha de retorno da primeira edição

Compara os participantes de `titans_backup.dump` com as inscrições confirmadas no banco atual. O cruzamento usa CPF, e-mail e telefone normalizados, mas o plano salvo não contém CPF nem telefone.

## Fluxo seguro

```bash
npm run edition1-campaign:preview
npm run edition1-campaign:prepare
npm run edition1-campaign:send
```

- `preview`: consulta e cruza as bases, gera o plano privado e uma amostra HTML; não cria cupom nem envia e-mail.
- `prepare`: refaz o cruzamento, cria/atualiza `VOLTETITANS10` com 10% e gera o plano; não envia e-mail.
- `send`: refaz o cruzamento imediatamente antes do envio, ignora quem já se inscreveu e envia pelo Resend.

Os arquivos privados ficam em `.tmp/edition1-campaign/`, com permissões restritas e fora do Git. O envio usa uma chave idempotente por destinatário e registra o resultado em `AnalyticsEvent`, impedindo duplicação em reexecuções. O cupom expira em 14/11/2026 às 23:59:59 (horário de Brasília) e seu limite global de usos é o número de destinatários elegíveis no preparo.

O script requer `pg_restore` 17 ou superior. Se ele não estiver no caminho padrão, defina `PG_RESTORE_BIN` no ambiente do comando.
