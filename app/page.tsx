import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { PremiumSection } from "@/components/premium-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />

      <ScrollReveal direction="up" delay={100}>
        <FeaturesSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={200}>
        <PremiumSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={100}>
        <TestimonialsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={150}>
        <CTASection />
      </ScrollReveal>

      <ScrollReveal direction="fade" delay={100}>
        <Footer />
      </ScrollReveal>
    </main>
  )
}
