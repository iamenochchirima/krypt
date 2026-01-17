"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import AuthGuard from "@/components/auth-guard"
import TypeSelector from "./components/TypeSelector"
import DropCreationFlow from "./components/DropCreationFlow"
import EditionCreationFlow from "./components/EditionCreationFlow"

type CollectionType = "drop" | "edition" | null

export default function CreateEthereumCollectionPage() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as CollectionType
  const [selectedType, setSelectedType] = useState<CollectionType>(typeParam)

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
