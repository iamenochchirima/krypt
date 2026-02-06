import Link from "next/link"
import Image from "next/image"
import { Github, Twitter, DiscIcon as Discord } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="Krypt Logo"
                width={24}
                height={24}
                className="rounded-md"
              />
              <h3 className="text-lg font-bold crypto-gradient-text">Krypt</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your all-in-one crypto platform. Trade NFTs, explore Bitcoin assets, and manage your portfolio across multiple chains.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-foreground">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="/earn" className="text-muted-foreground hover:text-foreground">
                  Earn
                </Link>
              </li>
              <li>
                <Link href="/secure" className="text-muted-foreground hover:text-foreground">
                  Secure
                </Link>
              </li>
              <li>
                <Link href="/connect" className="text-muted-foreground hover:text-foreground">
                  Connect
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Connect</h4>
            <div className="flex space-x-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Discord className="h-5 w-5" />
                <span className="sr-only">Discord</span>
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Krypt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
