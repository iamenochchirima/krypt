"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { services } from "@/config/services"

interface ExploreModalProps {
  children?: React.ReactNode
}

export function ExploreModal({ children }: ExploreModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative">
            <LayoutGrid className="h-5 w-5" />
            <span className="sr-only">Explore</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Explore
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {services.map((service) => (
            <Link
              key={service.id}
              href={service.link}
              onClick={() => setOpen(false)}
            >
              <div className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors h-full">
                <div className={`flex-shrink-0 p-2.5 rounded-lg ${service.bgColor}`}>
                  <service.icon className={`h-5 w-5 ${service.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{service.title}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
