"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Get token from URL
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError("Invalid or missing reset token")
    }
  }, [searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    
    if (!token) {
      setError("Invalid reset token")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to reset password")
      }

      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {isSuccess ? (
            <div className="bg-primary/15 text-primary text-sm p-3 rounded-md mb-4">
              <p>Your password has been reset successfully!</p>
              <p className="mt-2">You will be redirected to the login page shortly...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!token || isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
