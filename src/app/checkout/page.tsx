"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";
import { getModalityById } from "@/config/checkout";

// Garante que essa página não vai tentar ser totalmente estática
export const dynamic = "force-dynamic";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const modalityId = searchParams.get("modality");
  const modality = getModalityById(modalityId);

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-4xl">
        <CheckoutScreen initialModality={modality} />
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center text-zinc-200">
          <p>Carregando checkout...</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}