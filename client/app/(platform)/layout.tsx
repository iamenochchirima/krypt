"use client"

import { useState, useEffect } from "react"
import { PlatformNavbar } from "@/components/layouts/platform-navbar"
import { PlatformSidebar } from "@/components/layouts/platform-sidebar"
import { cn } from "@/lib/utils"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Load initial sidebar state
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }

    // Listen for sidebar toggle events
    const handleToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    window.addEventListener("sidebar-toggle", handleToggle as EventListener)
    return () => window.removeEventListener("sidebar-toggle", handleToggle as EventListener)
  }, [])

  return (
    <div className="min-h-screen">
      <PlatformSidebar />
      <PlatformNavbar />
      <main className={cn(
        "pt-20 px-6 pb-6 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  )
}
