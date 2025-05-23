"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">
          DocuChat AI
        </h1>
        <p className="text-xl mb-8">
          A conversational search platform for enterprise documents
        </p>
        
        {isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 mb-12">
            <p className="text-lg">Get started with your documents</p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/documents')}
              >
                Manage Documents
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push('/chat')}
              >
                Start Chatting
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 mb-12">
            <p className="text-lg">Sign in to get started</p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push('/auth/register')}
              >
                Create Account
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
            <p className="text-muted-foreground mb-4">
              Upload your documents or connect to Google Drive to get started.
            </p>
            <ul className="text-left text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Support for PDF, DOCX, XLSX, TXT, CSV</li>
              <li>Organize with folders and tags</li>
              <li>Secure and private storage</li>
            </ul>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Ask Questions</h2>
            <p className="text-muted-foreground mb-4">
              Chat with your documents and get accurate answers with citations.
            </p>
            <ul className="text-left text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Natural language questions</li>
              <li>Answers with source citations</li>
              <li>Filter by folders or tags</li>
              <li>No hallucinations - only answers from your documents</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-lg font-medium mb-2">Upload</h3>
              <p className="text-sm text-muted-foreground text-center">
                Upload your documents or connect to Google Drive
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-lg font-medium mb-2">Process</h3>
              <p className="text-sm text-muted-foreground text-center">
                Documents are analyzed and indexed for semantic search
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-lg font-medium mb-2">Chat</h3>
              <p className="text-sm text-muted-foreground text-center">
                Ask questions and get accurate answers with source citations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
