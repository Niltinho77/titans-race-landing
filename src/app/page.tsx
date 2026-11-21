// src/app/page.tsx
import Hero from "@/components/Hero";
import { NavBar } from "@/components/NavBar";
import { ExperienceGridSection } from "@/components/ExperienceGridSection";
import { LocationSection } from "@/components/LocationSection";
import { RegistrationSection } from "@/components/RegistrationSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { RegistrationPopup } from "@/components/RegistrationPopup";
import { GallerySection } from "@/components/GallerySection";
import { MobileCtaBar } from "@/components/MobileCtaBar";
import { KitSection } from "@/components/KitSection";
import { FaqSection } from "@/components/FaqSection";

// Regenera a página a cada minuto para acompanhar a virada dos lotes.
export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050505] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <NavBar />
      <Hero />
      <Marquee />
      <ExperienceGridSection />
      <GallerySection />
      <RegistrationSection />
      <KitSection />
      <LocationSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      <RegistrationPopup />
      <MobileCtaBar />
    </main>
  );
}

function Marquee() {
  const words = Array.from({ length: 8 }, () => ["CORRA", "SUPERE", "VENÇA"]).flat();
  return (
    <div className="overflow-hidden border-y border-orange-500/30 bg-orange-500 py-3" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {words.map((word, index) => (
              <span key={index} className="heading-adventure px-6 text-xl text-black md:text-2xl">
                {word} <span className="pl-6">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
