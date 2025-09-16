import { Button } from "@/components/ui/button"
import { Coins, Menu } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl">FileCoin Sites</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-accent transition-colors">
              Features
            </a>
            <a href="#premium" className="text-sm font-medium hover:text-accent transition-colors">
              Premium
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-accent transition-colors">
              Reviews
            </a>
            <a href="#examples" className="text-sm font-medium hover:text-accent transition-colors">
              Examples
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Link href="/site-gen">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Get Started</Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
