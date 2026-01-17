"use client"

import { useState } from "react"
import AuthGuard from "@/components/auth-guard"
import StandardSelector, { type SolanaNftStandard } from "./components/StandardSelector"
import LegacyCreationFlow from "./components/LegacyCreationFlow"
import CoreCreationFlow from "./components/CoreCreationFlow"
import CompressedCreationFlow from "./components/CompressedCreationFlow"

export default function CreateSolanaCollectionPage() {
  const [selectedStandard, setSelectedStandard] = useState<SolanaNftStandard | null>(null)

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
