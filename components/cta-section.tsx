import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-accent/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Ready to Get Started?
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            Turn Your Ideas Into Reality <span className="text-accent">Today</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8 text-balance">
            Join thousands of creators who are already building amazing websites with AI. Start for free and upgrade
            when you're ready for premium features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg">
              Start Building Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent">
              View Live Examples
            </Button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>✨ No credit card required • 🚀 Deploy instantly • 🔒 Blockchain secured</p>
          </div>
        </div>
      </div>
    </section>
  )
}
