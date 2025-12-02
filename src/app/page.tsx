// src/app/page.tsx
import Hero from "@/components/Hero";
import { NavBar } from "@/components/NavBar";
import { AboutSection } from "@/components/AboutSection";
import { HighlightsSection } from "@/components/HighlightsSection";
import { LocationSection } from "@/components/LocationSection";
import { RegistrationSection } from "@/components/RegistrationSection";
import { SponsorsSection } from "@/components/SponsorsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />
      <Hero />
      <AboutSection />
      <HighlightsSection />
      <LocationSection />
      <RegistrationSection />
      <SponsorsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
