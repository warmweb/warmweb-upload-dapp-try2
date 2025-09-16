import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Globe, Shield, Coins, Rocket, Code } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    description: "Describe your vision and watch as our advanced AI creates a complete website tailored to your needs.",
  },
  {
    icon: Globe,
    title: "Instant Deployment",
    description: "Your generated site goes live immediately with global CDN distribution for lightning-fast loading.",
  },
  {
    icon: Shield,
    title: "Blockchain Security",
    description:
      "Built on FileCoin infrastructure ensuring your content is secure, decentralized, and always available.",
  },
  {
    icon: Coins,
    title: "Cost Effective",
    description: "Pay only for what you use with transparent blockchain-based pricing and no hidden fees.",
  },
  {
    icon: Rocket,
    title: "Premium Subdomains",
    description: "Upgrade to get your custom subdomain on warmweb.xyz for professional branding.",
  },
  {
    icon: Code,
    title: "Full Code Access",
    description: "Download your generated code anytime. Full ownership and customization rights included.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Everything You Need to Build Amazing Sites
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Powered by cutting-edge AI and blockchain technology, our platform makes website creation effortless and
            secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-accent/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
