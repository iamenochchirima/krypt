"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Bell } from "lucide-react"

export default function OrdinalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Ordinals
        </h1>
        <p className="text-muted-foreground">Bitcoin NFTs and inscriptions</p>
      </div>

      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-purple-500" />
          </div>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">Coming Soon</Badge>
          <h2 className="text-xl font-semibold">Ordinals Trading</h2>
          <p className="text-muted-foreground">
            Fast trading for Bitcoin Ordinals and inscriptions is coming soon.
            Experience the same 2-second finality for your Bitcoin NFTs.
          </p>
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Notify Me
          </Button>
        </div>
      </Card>
    </div>
  )
}
