"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface NavItem {
  label: string
  href: string
  requiresAuth?: boolean
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  // Define navigation items based on authentication status
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Documents", href: "/documents", requiresAuth: true },
    { label: "Chat", href: "/chat", requiresAuth: true }
  ]

  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  )

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      handleLogout()
    } else {
      router.push("/auth/login")
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">DocuChat AI</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {user?.name}
              </span>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          )}
          
          {!isAuthenticated && (
            <Button size="sm" onClick={() => router.push("/auth/login")}>
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                isMobileMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-3">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">{user?.name}</p>
                <Button className="w-full" size="sm" variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            )}
            
            {!isAuthenticated && (
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => {
                  router.push("/auth/login")
                  setIsMobileMenuOpen(false)
                }}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
