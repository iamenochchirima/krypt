"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import AuthGuard from "@/components/auth-guard"
import StandardSelector, { type SolanaNftStandard } from "./components/StandardSelector"
import LegacyCreationFlow from "./components/LegacyCreationFlow"
import CoreCreationFlow from "./components/CoreCreationFlow"
import CompressedCreationFlow from "./components/CompressedCreationFlow"

export default function CreateSolanaCollectionPage() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as SolanaNftStandard | null
  const [selectedStandard, setSelectedStandard] = useState<SolanaNftStandard | null>(typeParam)

  return (
    <AuthGuard>
      <div className="space-y-6">
        {selectedStandard === null && (
          <StandardSelector onSelect={setSelectedStandard} />
        )}
        {selectedStandard === "legacy" && (
          <LegacyCreationFlow onBack={() => setSelectedStandard(null)} />
        )}
        {selectedStandard === "core" && (
          <CoreCreationFlow onBack={() => setSelectedStandard(null)} />
        )}
        {selectedStandard === "compressed" && (
          <CompressedCreationFlow onBack={() => setSelectedStandard(null)} />
        )}
      </div>
    </AuthGuard>
  )
}
