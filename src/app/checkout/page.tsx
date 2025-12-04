"use client";

import { useSearchParams } from "next/navigation";
import { getModalityById } from "@/config/checkout";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const modalityParam = searchParams.get("modality");
  const modality = getModalityById(modalityParam);

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-5xl">
        <CheckoutScreen initialModality={modality} />
      </div>
    </main>
  );
}