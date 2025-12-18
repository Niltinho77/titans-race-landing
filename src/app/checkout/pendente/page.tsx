// app/checkout/pendente/page.tsx
import { Suspense } from "react";
import PendenteClient from "./PendenteClient";

export const dynamic = "force-dynamic";

export default function PendentePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black pt-20 pb-24 px-4 flex items-center justify-center text-zinc-200">
          <p>Carregando status do pagamento...</p>
        </main>
      }
    >
      <PendenteClient />
    </Suspense>
  );
}
