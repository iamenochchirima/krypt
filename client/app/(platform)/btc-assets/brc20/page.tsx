"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileCode, Bell } from "lucide-react"

export default function BRC20Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCode className="h-6 w-6 text-blue-500" />
          BRC-20
        </h1>
        <p className="text-muted-foreground">Bitcoin fungible tokens</p>
      </div>

      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
            <FileCode className="h-10 w-10 text-blue-500" />
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Coming Soon</Badge>
          <h2 className="text-xl font-semibold">BRC-20 Trading</h2>
          <p className="text-muted-foreground">
            Fast trading for BRC-20 tokens is coming soon.
            Trade Bitcoin fungible tokens with instant settlement.
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
