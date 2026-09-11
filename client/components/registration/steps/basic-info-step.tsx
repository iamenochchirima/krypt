"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  setEmail,
  setUsername,
  nextStep,
  prevStep,
  checkUsernameAvailability,
  checkEmailAvailability,
} from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/providers/auth-context"

export default function BasicInfoStep() {
  const {usersActor} = useAuth()
  const dispatch = useAppDispatch()
  const { email, username, loading, usernameAvailable, emailAvailable } = useAppSelector((state) => state.registration)

  const [emailError, setEmailError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [localUsername, setLocalUsername] = useState(username || "")
  const [localEmail, setLocalEmail] = useState(email || "")

  const debouncedUsername = useDebounce(localUsername, 500)
  const debouncedEmail = useDebounce(localEmail, 500)

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  useEffect(() => {
    if (
      debouncedUsername && 
      debouncedUsername.length >= 3 && 
      /^[a-zA-Z0-9_]+$/.test(debouncedUsername) && 
      usersActor
    ) {
      dispatch(checkUsernameAvailability({ username: debouncedUsername, usersActor }))
    }
  }, [debouncedUsername, dispatch, usersActor])

  useEffect(() => {
    if (
      debouncedEmail && 
      validateEmail(debouncedEmail) && 
      usersActor
    ) {
      dispatch(checkEmailAvailability({ email: debouncedEmail, usersActor }))
    }
  }, [debouncedEmail, dispatch, usersActor])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setLocalEmail(newEmail)

    if (newEmail && !validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value
    setLocalUsername(newUsername)

    if (newUsername.length > 0 && newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters")
    } else if (newUsername && !/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError("Username can only contain letters, numbers, and underscores")
    } else {
      setUsernameError("")
    }
  }

  const handleContinue = () => {

    if (localEmail && !validateEmail(localEmail)) {
      setEmailError("Please enter a valid email address")
      return
    }

    if (localEmail && emailAvailable === false) {
      setEmailError("This email is already in use")
      return
    }

    if (!localUsername || localUsername.length < 3) {
      setUsernameError("Please enter a valid username")
      return
    }

    if (usernameAvailable === false) {
      setUsernameError("Please choose an available username")
      return
    }

    // Update the Redux state with the final values only when continuing
    dispatch(setEmail(localEmail || null))
    dispatch(setUsername(localUsername))
    dispatch(nextStep())
  }

  const handleBack = () => {
    dispatch(prevStep())
  }

  const isEmailValid = !localEmail || (localEmail && validateEmail(localEmail) && !emailError)
  const isEmailAvailable = !localEmail || emailAvailable === true || emailAvailable === null
  const isUsernameValid = localUsername && localUsername.length >= 3 && !usernameError
  const isUsernameAvailable = usernameAvailable === true || usernameAvailable === null

  const canContinue = isEmailValid && isEmailAvailable && isUsernameValid && isUsernameAvailable && !loading

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground mt-2">Let's set up your account details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address (Optional)</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={localEmail}
              onChange={handleEmailChange}
              className={emailError ? "border-red-500 pr-10" : (isEmailValid && isEmailAvailable) ? "border-green-500 pr-10" : "pr-10"}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {loading && localEmail && validateEmail(localEmail) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!loading && emailAvailable === true && localEmail && validateEmail(localEmail) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {!loading && emailAvailable === false && localEmail && validateEmail(localEmail) && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          {!emailError && emailAvailable === false && localEmail && validateEmail(localEmail) && (
            <p className="text-sm text-red-500">This email is already in use</p>
          )}
          {!emailError && emailAvailable === true && localEmail && validateEmail(localEmail) && (
            <p className="text-sm text-green-500">Email is available</p>
          )}
          <p className="text-xs text-muted-foreground">We'll only use your email for important account notifications</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              placeholder="coolcryptouser"
              value={localUsername}
              onChange={handleUsernameChange}
              className={usernameError ? "border-red-500 pr-10" : isUsernameValid ? "border-green-500 pr-10" : "pr-10"}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {loading && localUsername.length >= 3 && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!loading && usernameAvailable === true && localUsername.length >= 3 && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {!loading && usernameAvailable === false && localUsername.length >= 3 && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
          {!usernameError && usernameAvailable === false && (
            <p className="text-sm text-red-500">This username is already taken</p>
          )}
          {!usernameError && usernameAvailable === true && (
            <p className="text-sm text-green-500">Username is available</p>
          )}
          <p className="text-xs text-muted-foreground">
            Choose a unique username that will identify you on the platform
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className={canContinue ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          Continue
        </Button>
      </div>

    </div>
  )
}
