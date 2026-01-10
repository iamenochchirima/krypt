import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Rocket, Shield, Coins, BarChart3, Users, Settings, CheckCircle } from "lucide-react"

export default function TokenLaunchpadPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Token Launchpad</h1>
        <p className="text-lg text-muted-foreground">
          Create and launch your own fungible tokens with customizable tokenomics, distribution, and vesting schedules.
        </p>
      </div>

      {/* Hero Section */}
      <div className="mb-16 rounded-xl overflow-hidden">
        <div className="relative h-80">
          <Image src="/placeholder.svg?key=xpzqp" alt="Token Launchpad" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
          <div className="absolute inset-0 flex items-center">
            <div className="container px-4">
              <div className="max-w-lg">
                <h2 className="text-3xl font-bold mb-4">Launch Your Token in Minutes</h2>
                <p className="mb-6 text-muted-foreground">
                  No coding required. Create your own token, set tokenomics, and launch on multiple blockchains with our
                  easy-to-use platform.
                </p>
                <Button size="lg">
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Creating and launching your token is simple with our step-by-step process.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-crypto-blue/10">
                <Settings className="h-6 w-6 text-crypto-blue" />
              </div>
              <CardTitle>1. Configure Your Token</CardTitle>
              <CardDescription>Set your token name, symbol, supply, and other basic parameters.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Choose blockchain network</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Set token name and symbol</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Define total supply</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Configure decimals</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-crypto-purple/10">
                <BarChart3 className="h-6 w-6 text-crypto-purple" />
              </div>
              <CardTitle>2. Set Tokenomics</CardTitle>
              <CardDescription>
                Define token distribution, vesting schedules, and other economic parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Allocate tokens to different pools</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Set vesting schedules</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Configure liquidity parameters</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Define token utility</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-crypto-green/10">
                <Rocket className="h-6 w-6 text-crypto-green" />
              </div>
              <CardTitle>3. Launch Your Token</CardTitle>
              <CardDescription>Deploy your token contract and make it available to the public.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Deploy smart contract</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Verify contract on blockchain explorer</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Add liquidity to DEXs</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-crypto-green" />
                  <span>Promote your token launch</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our token launchpad provides everything you need to create and launch successful tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="crypto-card">
            <Shield className="mb-4 h-10 w-10 text-crypto-blue" />
            <h3 className="mb-2 text-xl font-bold">Secure Contracts</h3>
            <p className="text-muted-foreground">
              All token contracts are audited and secure, following industry best practices.
            </p>
          </div>
          <div className="crypto-card">
            <Coins className="mb-4 h-10 w-10 text-crypto-purple" />
            <h3 className="mb-2 text-xl font-bold">Multi-Chain Support</h3>
            <p className="text-muted-foreground">
              Launch tokens on Ethereum, Solana, Polygon, and other popular blockchains.
            </p>
          </div>
          <div className="crypto-card">
            <BarChart3 className="mb-4 h-10 w-10 text-crypto-green" />
            <h3 className="mb-2 text-xl font-bold">Customizable Tokenomics</h3>
            <p className="text-muted-foreground">
              Define token distribution, vesting schedules, and other economic parameters.
            </p>
          </div>
          <div className="crypto-card">
            <Users className="mb-4 h-10 w-10 text-crypto-yellow" />
            <h3 className="mb-2 text-xl font-bold">Community Building</h3>
            <p className="text-muted-foreground">Tools to help you build and engage with your token community.</p>
          </div>
          <div className="crypto-card">
            <Rocket className="mb-4 h-10 w-10 text-crypto-pink" />
            <h3 className="mb-2 text-xl font-bold">Launch Support</h3>
            <p className="text-muted-foreground">Guidance and support throughout the token launch process.</p>
          </div>
          <div className="crypto-card">
            <Settings className="mb-4 h-10 w-10 text-crypto-blue" />
            <h3 className="mb-2 text-xl font-bold">No-Code Interface</h3>
            <p className="text-muted-foreground">Create and launch tokens without any coding knowledge required.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-gradient-to-r from-crypto-blue/20 via-crypto-purple/20 to-crypto-pink/20 p-8 md:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Launch Your Token?</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Join thousands of projects that have successfully launched their tokens with our platform.
          </p>
          <Button size="lg">
            Start Creating <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
