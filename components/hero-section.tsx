import { Button } from "@/components/ui/button"
import { TypewriterEffect } from "./typewriter-effect"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const samplePrompts = [
  "Create a modern portfolio website for a designer",
  "Build a restaurant landing page with menu",
  "Generate a tech startup homepage with pricing",
  "Make a blog site for travel photography",
  "Design an e-commerce store for handmade crafts",
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-accent" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Powered by FileCoin on Cloud
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-8 leading-tight">
          Generate Beautiful <span className="text-accent">Static Sites</span> with AI
        </h1>

        <div className="max-w-4xl mx-auto mb-8">
          <p className="text-lg md:text-xl text-muted-foreground mb-6 text-balance">
            Transform your ideas into stunning websites instantly. Just describe what you want, and our AI will create
            it.
          </p>

          <div className="bg-card border rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground ml-2">AI Prompt</span>
            </div>
            <div className="font-mono text-sm md:text-base">
              <span className="text-accent">$</span>{" "}
              <TypewriterEffect prompts={samplePrompts} className="text-foreground" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/site-gen">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg">
              Start Building Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent">
            View Examples
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          No credit card required • Deploy in seconds • Powered by blockchain
        </p>
      </div>
    </section>
  )
}
