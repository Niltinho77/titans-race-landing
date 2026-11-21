import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { SponsorContact } from "@/components/sponsorship/SponsorContact";

export const metadata: Metadata = {
  title: "Seja um patrocinador | Titans Race",
  description:
    "Quer associar sua marca à Titans Race em Alegrete/RS? Fale com a organização.",
};

// A página comercial completa (SponsorsPageClient) fica guardada para edições futuras.
export default function PatrocinadoresPage() {
  return (
    <>
      <NavBar />
      <SponsorContact />
      <Footer />
    </>
  );
}
