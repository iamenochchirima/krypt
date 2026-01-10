"use client"

import { PlatformNavbar } from "@/components/layouts/platform-navbar"
import { PlatformSidebar } from "@/components/layouts/platform-sidebar"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <PlatformNavbar />
      <div className="flex pt-16">
        <PlatformSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
