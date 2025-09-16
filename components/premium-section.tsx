import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, ArrowRight } from "lucide-react"

const premiumFeatures = [
  "Custom subdomain on warmweb.xyz",
  "SSL certificate included",
  "Advanced analytics dashboard",
  "Priority AI generation",
  "Custom domain mapping",
  "Enhanced storage limits",
  "Priority support",
]

export function PremiumSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Crown className="w-4 h-4 mr-2" />
              Premium Feature
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Get Your Professional Domain on <span className="text-accent">warmweb.xyz</span>
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Stand out with a premium subdomain that gives your site credibility and makes it easy to remember.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Crown className="w-6 h-6 text-accent" />
                    Premium Plan
                  </CardTitle>
                  <CardDescription className="text-base">
                    Everything you need for a professional web presence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $9.99<span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3">
                    {premiumFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-accent flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6">
                    Claim Your Subdomain
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Example Subdomains</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>yourcompany.warmweb.xyz</div>
                  <div>portfolio.warmweb.xyz</div>
                  <div>myblog.warmweb.xyz</div>
                  <div>startup.warmweb.xyz</div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Why Choose Premium?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A professional domain builds trust with your visitors and makes your site more memorable. Plus, you
                  get enhanced features and priority support to ensure your site performs at its best.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
