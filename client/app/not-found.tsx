import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowRight, Compass, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Animated 404 */}
          <div className="mb-8">
            <h1 className="text-[12rem] font-bold leading-none crypto-gradient-text animate-pulse">
              404
            </h1>
          </div>

          {/* Humorous Messages */}
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Oops! You've Entered the Void! 🌌
            </h2>
            
            <div className="space-y-2">
             <p className="text-base text-muted-foreground">
                Don't worry - you're still safe, but this URL isn't going anywhere.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Return to Safety
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/explore">
                <Compass className="mr-2 h-5 w-5" />
                Explore Apps
              </Link>
            </Button>
          </div>

          {/* Additional helpful links */}
          <div className="mt-8 pt-8 border-t border-muted">
            <p className="text-sm text-muted-foreground mb-4">
              Or try one of these popular destinations:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/learn">📚 Learn</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/earn">💰 Earn</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/nft/collections">🎨 Collections</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/secure">🛡️ Security</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/connect">👥 Community</Link>
              </Button>
            </div>
          </div>

          {/* Fun footer message */}
          <div className="mt-8 text-xs text-muted-foreground">
            <p>If you think this page should exist, maybe it's still being mined in the next block... ⛏️</p>
          </div>
        </div>
      </div>
    </div>
  )
}