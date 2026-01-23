"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import {
  ArrowLeft,
  Upload,
  X as XIcon,
  Twitter,
  Globe,
  Send,
  Bitcoin,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react"

const LAUNCH_FEE = 0.000033
const MAX_NAME_LENGTH = 30
const MAX_TICKER_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 100
const MAX_LOGO_SIZE = 200 * 1024

export default function CreateTokenPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const [tokenName, setTokenName] = useState("")
  const [ticker, setTicker] = useState("")
  const [description, setDescription] = useState("")
  const [twitter, setTwitter] = useState("")
  const [telegram, setTelegram] = useState("")
  const [website, setWebsite] = useState("")
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [buyAmount, setBuyAmount] = useState("")
  const [discountCode, setDiscountCode] = useState("")

  const runesTicker = ticker ? `${ticker.toUpperCase()}•ID•XXXX•KRYPT` : "[short_ticker]•ID•XXXX•KRYPT"

  const buyAmountNum = parseFloat(buyAmount) || 0
  const totalPayment = LAUNCH_FEE + buyAmountNum
  const percentSupply = buyAmountNum > 0 ? Math.min((buyAmountNum / 0.5) * 100, 100) : 0

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.size > MAX_LOGO_SIZE) {
        toast.error("Logo must be under 200KB")
        return
      }
      setLogo(file)
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".webp", ".jpg", ".jpeg", ".svg", ".gif"] },
    maxFiles: 1,
  })

  const removeLogo = () => {
    setLogo(null)
    setLogoPreview(null)
  }

  const handleCreate = async () => {
    if (!tokenName.trim()) {
      toast.error("Token name is required")
      return
    }
    if (!ticker.trim()) {
      toast.error("Ticker is required")
      return
    }
    if (!logo) {
      toast.error("Token logo is required")
      return
    }

    setIsCreating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Token created successfully!")
      router.push("/btc-assets/runes")
    } catch (error) {
      toast.error("Failed to create token")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/btc-assets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to BTC Assets
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Create Token</h1>
        <p className="text-muted-foreground">Launch a new fast Bitcoin Rune with bonding curve</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-5 bg-card/50">
          <div className="space-y-2">
            <Label htmlFor="tokenName">
              Token Name <span className="text-muted-foreground">({MAX_NAME_LENGTH} characters)</span>
            </Label>
            <Input
              id="tokenName"
              placeholder="Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticker">
              Ticker <span className="text-muted-foreground">({MAX_TICKER_LENGTH} characters)</span>
            </Label>
            <Input
              id="ticker"
              placeholder="Ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, MAX_TICKER_LENGTH))}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label>Runes Ticker</Label>
            <div className="p-3 bg-background rounded-lg border text-muted-foreground font-mono text-sm">
              {runesTicker}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">({MAX_DESCRIPTION_LENGTH} characters)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your token..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              className="bg-background resize-none min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/{MAX_DESCRIPTION_LENGTH}</p>
          </div>

          <div className="space-y-3">
            <Label>
              Socials <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="X (Twitter)"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-card/50">
            <Label className="mb-3 block">
              Token Logo <span className="text-muted-foreground">(square image, max 200KB)</span>
            </Label>
            {logoPreview ? (
              <div className="relative w-full aspect-video bg-background rounded-lg border flex items-center justify-center">
                <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain rounded-lg" />
                <button
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`w-full aspect-video bg-background rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? "border-orange-500 bg-orange-500/5" : "border-border hover:border-orange-500/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag file here or click here to select.</p>
                <p className="text-xs text-muted-foreground mt-1">(.png, .webp, .jpg, .jpeg, .svg, .gif)</p>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-card/50 space-y-4">
            <div className="space-y-2">
              <Label>
                Buy Tokens <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="BTC"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="bg-background pr-12"
                  step="0.0001"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Percent supply:</span>
              <span className="font-medium">{percentSupply.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Launch Fee:</span>
              <span className="font-medium">{LAUNCH_FEE}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">Total Payment:</span>
              <span className="font-bold text-orange-500">{totalPayment.toFixed(8)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <Label>
                Discount Code <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="Enter a discount code to create a token for free."
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating || !tokenName.trim() || !ticker.trim() || !logo}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-12"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Token"
              )}
            </Button>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Create to Earn</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Earn <span className="text-orange-500 font-bold">0.001 BTC</span> when a token you create successfully ascends to the AMM!
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
