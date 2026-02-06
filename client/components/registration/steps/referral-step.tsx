"use client"

import type React from "react"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  setReferralSource,
  setReferralCode,
  nextStep,
  prevStep,
} from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const referralSources = [
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "friend", label: "Friend or Colleague" },
  { value: "ad", label: "Advertisement" },
  { value: "blog", label: "Blog or Article" },
  { value: "podcast", label: "Podcast" },
  { value: "event", label: "Event or Conference" },
  { value: "other", label: "Other" },
]

export default function ReferralStep() {
  const dispatch = useAppDispatch()
  const { referralSource, referralCode } = useAppSelector((state) => state.registration)

  const handleReferralSourceChange = (value: string) => {
    dispatch(setReferralSource(value))
  }

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setReferralCode(e.target.value))
  }

  const handleContinue = () => {
    dispatch(nextStep())
  }

  const handleBack = () => {
    dispatch(prevStep())
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">How Did You Find Us?</h2>
        <p className="text-muted-foreground mt-2">Help us understand how you discovered Krypt</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referral-source">Where did you hear about us?</Label>
          <Select value={referralSource} onValueChange={handleReferralSourceChange}>
            <SelectTrigger id="referral-source">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {referralSources.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="referral-code">Referral Code (Optional)</Label>
          <Input
            id="referral-code"
            placeholder="Enter referral code"
            value={referralCode}
            onChange={handleReferralCodeChange}
          />
          <p className="text-xs text-muted-foreground">
            If someone referred you, enter their code for both of you to receive rewards
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  )
}
