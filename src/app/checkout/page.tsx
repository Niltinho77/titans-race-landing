// src/app/checkout/page.tsx
import { getModalityById } from "@/config/checkout";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";

type CheckoutPageProps = {
  searchParams: {
    modality?: string;
  };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const modality = getModalityById(searchParams.modality ?? null);

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-5xl">
        <CheckoutScreen initialModality={modality} />
      </div>
    </main>
  );
}