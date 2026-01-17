"use client"

import { useState } from "react"
import AuthGuard from "@/components/auth-guard"
import TypeSelector from "./components/TypeSelector"
import DropCreationFlow from "./components/DropCreationFlow"
import EditionCreationFlow from "./components/EditionCreationFlow"

type CollectionType = "drop" | "edition" | null

export default function CreateEthereumCollectionPage() {
  const [selectedType, setSelectedType] = useState<CollectionType>(null)

  return (
    <AuthGuard>
      <div className="space-y-6">
        {selectedType === null && (
          <TypeSelector onSelect={setSelectedType} />
        )}
        {selectedType === "drop" && (
          <DropCreationFlow onBack={() => setSelectedType(null)} />
        )}
        {selectedType === "edition" && (
          <EditionCreationFlow onBack={() => setSelectedType(null)} />
        )}
      </div>
    </AuthGuard>
  )
}
