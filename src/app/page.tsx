
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-neon-purple/30 selection:text-white">
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <FeatureGrid />
      <CTA />
      <Footer />
    </main>
  );
}
