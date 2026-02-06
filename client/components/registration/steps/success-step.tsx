"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SuccessStep() {
  const { username } = useAppSelector((state) => state.registration)

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Registration Complete!</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to Krypt, {username}! Your account has been created successfully.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <p className="font-medium">What's next?</p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-2 text-left">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Explore the platform and discover crypto games, learning resources, and more</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Complete your profile to personalize your experience</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Join the community and connect with other crypto enthusiasts</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">You'll be redirected to your dashboard in a moment</p>
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      </div>

      <div>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
