import Hero from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { LocationSection } from "@/components/LocationSection";
import { ObstaclesSection } from "@/components/ObstaclesSection";
import { RegistrationSection } from "@/components/RegistrationSection";
import { SponsorsSection } from "@/components/SponsorsSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="bg-titans-bg text-titans-text">
      <Hero />
      <AboutSection />
      <LocationSection />
      <ObstaclesSection />
      <RegistrationSection />
      <SponsorsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}