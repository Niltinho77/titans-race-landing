import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // Liga Titans inativa no site. Para reativar, remova este redirecionamento
      // e volte o link "Liga Titans" no NavBar. O painel /sorteio/admin continua acessível.
      { source: "/sorteio", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
