import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { services } from "@/config/services"

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground">
          Discover all the services under Krypt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link key={service.id} href={service.link}>
            <div className="group flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className={`flex-shrink-0 p-2.5 rounded-lg ${service.bgColor}`}>
                <service.icon className={`h-5 w-5 ${service.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{service.title}</h2>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
