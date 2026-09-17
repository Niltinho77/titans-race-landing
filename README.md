This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Microsoft Clarity

O layout global integra o Microsoft Clarity para mapas de calor e gravações de
sessões. O projeto de `https://titansrace.com.br` já está configurado com o ID
público `yjuewlruhm`. Faça um novo build/deploy para publicar a integração.

Para usar outro projeto, configure `NEXT_PUBLIC_CLARITY_PROJECT_ID` nas variáveis
de ambiente da hospedagem antes do build. O ID é público; não use uma chave de API.

Após publicar, visite o site e confira a sessão no painel do Clarity. Na aba Network
do navegador, confira o carregamento de `https://www.clarity.ms/tag/yjuewlruhm` e
as requisições de coleta para o Clarity.

O script só carrega em produção, após a página ficar interativa, e permanece
desativado quando a variável define um ID vazio ou inválido. `npm run dev` não envia
sessões. Para testar localmente, use um build de produção.
O componente é global e abrange todas as páginas que usam o layout raiz.

Documentação: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
