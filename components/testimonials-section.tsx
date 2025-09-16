import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    avatar: "/professional-woman-designer.png",
    content:
      "I created my entire portfolio in minutes. The AI understood exactly what I wanted and the FileCoin integration gives me peace of mind about data security.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Founder",
    avatar: "/professional-entrepreneur.png",
    content:
      "Our landing page generated more leads in the first week than our old site did in months. The warmweb.xyz subdomain looks incredibly professional.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Small Business Owner",
    avatar: "/professional-woman-business-owner.png",
    content:
      "As someone with zero coding experience, this platform is a game-changer. I have a beautiful restaurant website that my customers love.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Content Creator",
    avatar: "/professional-man-content-creator.jpg",
    content:
      "The AI generated exactly the blog layout I envisioned. The blockchain hosting ensures my content is always available to my audience.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Loved by Creators Worldwide</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Join thousands of satisfied users who have transformed their ideas into beautiful websites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{testimonial.content}"</p>

                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
