import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Shield, AlertTriangle, CheckCircle } from "lucide-react"

// Mock bounty data
const bounties = [
  {
    id: 1,
    title: "Ethereum DeFi Protocol Audit",
    description: "Audit a new DeFi lending protocol built on Ethereum.",
    chain: "Ethereum",
    type: "DeFi",
    reward: 5000,
    deadline: "2023-12-31",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=ethereum defi protocol",
  },
  {
    id: 2,
    title: "NFT Marketplace Security Review",
    description: "Review the security of a new NFT marketplace smart contract.",
    chain: "Ethereum",
    type: "NFT",
    reward: 3000,
    deadline: "2023-11-15",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=nft marketplace security",
  },
  {
    id: 3,
    title: "Solana DEX Vulnerability Assessment",
    description: "Identify vulnerabilities in a decentralized exchange on Solana.",
    chain: "Solana",
    type: "DEX",
    reward: 4000,
    deadline: "2023-12-15",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=solana dex security",
  },
  {
    id: 4,
    title: "Cross-Chain Bridge Security Audit",
    description: "Audit a cross-chain bridge protocol connecting multiple blockchains.",
    chain: "Multi-chain",
    type: "Bridge",
    reward: 7500,
    deadline: "2024-01-15",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=cross chain bridge security",
  },
  {
    id: 5,
    title: "DAO Governance Contract Review",
    description: "Review the security of a DAO governance smart contract.",
    chain: "Ethereum",
    type: "DAO",
    reward: 3500,
    deadline: "2023-12-01",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=dao governance security",
  },
  {
    id: 6,
    title: "Stablecoin Protocol Audit",
    description: "Audit a new algorithmic stablecoin protocol.",
    chain: "Ethereum",
    type: "Stablecoin",
    reward: 6000,
    deadline: "2024-01-30",
    status: "Open",
    image: "/placeholder.svg?height=200&width=400&query=stablecoin protocol security",
  },
]

export default function SecurePage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Bounty Platform</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Participate in blockchain security bounties and help make the ecosystem safer for everyone.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-12 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search bounties..." className="pl-10" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="polkadot">Polkadot</SelectItem>
                <SelectItem value="multi">Multi-chain</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Protocol Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
                <SelectItem value="nft">NFT</SelectItem>
                <SelectItem value="dex">DEX</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="dao">DAO</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reward Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rewards</SelectItem>
                <SelectItem value="low">$1K - $3K</SelectItem>
                <SelectItem value="medium">$3K - $5K</SelectItem>
                <SelectItem value="high">$5K+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bounty Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {bounties.map((bounty) => (
          <div key={bounty.id} className="crypto-card group">
            <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
              <Image
                src={bounty.image || "/placeholder.svg"}
                alt={bounty.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute right-2 top-2 rounded-full bg-crypto-green px-2 py-1 text-xs font-bold">
                ${bounty.reward} USDC
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {bounty.chain}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {bounty.type}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                Deadline: {bounty.deadline}
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold">{bounty.title}</h3>
            <p className="mb-4 text-muted-foreground">{bounty.description}</p>
            <Button className="w-full" asChild>
              <Link href={`/secure/${bounty.id}`}>View Bounty</Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Reputation System */}
      <div className="mt-16">
        <h2 className="mb-8 text-2xl font-bold">Top Auditors</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Auditor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Reputation</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Vulnerabilities Found</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Bounties Won</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  rank: 1,
                  name: "0xSecurity",
                  address: "0x1234...5678",
                  reputation: 95,
                  vulnerabilities: 32,
                  bounties: 18,
                },
                {
                  rank: 2,
                  name: "BlockchainGuardian",
                  address: "0xabcd...efgh",
                  reputation: 92,
                  vulnerabilities: 28,
                  bounties: 15,
                },
                {
                  rank: 3,
                  name: "CryptoDefender",
                  address: "0x9876...5432",
                  reputation: 88,
                  vulnerabilities: 25,
                  bounties: 12,
                },
                {
                  rank: 4,
                  name: "WhiteHatDAO",
                  address: "0xijkl...mnop",
                  reputation: 85,
                  vulnerabilities: 22,
                  bounties: 10,
                },
                {
                  rank: 5,
                  name: "SecureChain",
                  address: "0x2468...1357",
                  reputation: 82,
                  vulnerabilities: 20,
                  bounties: 9,
                },
              ].map((auditor, index) => (
                <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">#{auditor.rank}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{auditor.name}</div>
                        <div className="text-xs text-muted-foreground">{auditor.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{auditor.reputation}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{auditor.vulnerabilities}</td>
                  <td className="px-4 py-3 text-sm">{auditor.bounties}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learn to Audit */}
      <div className="mt-16 rounded-lg border bg-card p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold">Learn to Audit</h2>
            <p className="mb-4 text-muted-foreground">
              New to security auditing? Take our specialized courses to learn how to identify vulnerabilities and
              participate in bounties.
            </p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-crypto-green" />
                <span>Smart Contract Security Fundamentals</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-crypto-green" />
                <span>Common Vulnerabilities and Exploits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-crypto-green" />
                <span>Audit Methodology and Best Practices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-crypto-green" />
                <span>Tools and Techniques for Security Analysis</span>
              </li>
            </ul>
            <Button asChild>
              <Link href="/learn">Browse Security Courses</Link>
            </Button>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg md:h-auto">
            <Image
              src="/placeholder.svg?height=400&width=600&query=blockchain security audit"
              alt="Learn to Audit"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-crypto-yellow" />
                <h3 className="text-xl font-bold text-white">Security First</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
