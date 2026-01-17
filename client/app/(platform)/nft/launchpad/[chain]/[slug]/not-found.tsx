import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Rocket, ArrowLeft, Search } from "lucide-react"

export default function LaunchNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Rocket className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Launch Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The launch you're looking for doesn't exist or may have been removed.
      </p>
      <div className="flex gap-4">
        <Link href="/nft/launchpad">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Launchpad
          </Button>
        </Link>
        <Link href="/nft/launchpad/live">
          <Button className="gap-2">
            <Search className="w-4 h-4" />
            Browse Live Mints
          </Button>
        </Link>
      </div>
    </div>
  )
}
