import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { SponsorsPageClient } from "@/components/sponsorship/SponsorsPageClient";

export const metadata: Metadata = {
  title: "Patrocine a Titans Race II",
  description:
    "Oportunidades comerciais para marcas parceiras da Titans Race II em Alegrete/RS.",
};

export default function PatrocinadoresPage() {
  return (
    <>
      <NavBar />
      <SponsorsPageClient />
      <Footer />
    </>
  );
}
