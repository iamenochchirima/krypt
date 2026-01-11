"use client"

import { useState, useEffect } from "react"
import { Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExploreModal } from "./explore-modal"
import { NavbarActions, NavbarActionsMobile } from "./navbar-actions"
import { cn } from "@/lib/utils"

export function PlatformNavbar() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)

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

  if (!mounted) {
    return <header className="fixed top-0 left-64 right-0 z-50 h-16" />
  }

  return (
    <header className={cn(
      "fixed top-0 right-0 z-50 bg-background border-b border-border transition-all duration-300",
      sidebarCollapsed ? "left-16" : "left-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Explore */}
        <div className="flex items-center gap-4">
          <ExploreModal>
            <Button variant="outline" size="sm" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className="hidden sm:inline">Explore</span>
            </Button>
          </ExploreModal>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-muted/50 border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <NavbarActions className="flex items-center gap-2" />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" />
          </div>

          <NavbarActionsMobile onAction={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  )
}
