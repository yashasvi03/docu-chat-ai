"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  citations?: Citation[]
}

interface Citation {
  chunkId: string
  documentId: string
  documentTitle: string
  page?: number
  similarity: number
}

interface Thread {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
}

export default function ChatPage() {
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Fetch threads, folders, and tags when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchThreads()
      fetchFolders()
      fetchTags()
    }
  }, [isAuthenticated])
  
  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/chat/threads')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setThreads(result.data)
      } else {
        setThreads([])
      }
    } catch (error) {
      console.error("Error fetching threads:", error)
      setError("Failed to load chat history. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setFolders(result.data)
      } else {
        setFolders([])
      }
    } catch (error) {
      console.error("Error fetching folders:", error)
    }
  }
  
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setTags(result.data)
      } else {
        // Fallback to some default tags if the API fails
        setTags([
          { id: "growth", name: "Growth" },
          { id: "performance", name: "Performance" },
          { id: "trends", name: "Trends" },
          { id: "quarterly", name: "Quarterly" }
        ])
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
      // Fallback to some default tags if the API fails
      setTags([
        { id: "growth", name: "Growth" },
        { id: "performance", name: "Performance" },
        { id: "trends", name: "Trends" },
        { id: "quarterly", name: "Quarterly" }
      ])
    }
  }

  const handleSendMessage = async (message: string): Promise<Message> => {
    try {
      // Prepare the request payload
      const payload = {
        message,
        threadId: activeThread,
        folderId: activeFolder,
        tags: activeTags,
        stream: false
      };
      
      // Send the message to the backend
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Chat message failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // If a new thread was created, update the active thread and refresh the thread list
        if (!activeThread && result.data.thread) {
          setActiveThread(result.data.thread.id)
          fetchThreads()
        }
        
        // Return the assistant message
        return result.data.message;
      } else {
        // If there's an error or unexpected response format, return a fallback message
        return {
          id: Date.now().toString(),
          content: "I'm sorry, I couldn't process your request. Please try again.",
          role: "assistant"
        };
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Return a fallback message in case of error
      return {
        id: Date.now().toString(),
        content: "I'm sorry, there was an error processing your request. Please try again.",
        role: "assistant"
      };
    }
  }
  
  const handleCreateNewChat = () => {
    setActiveThread(null)
  }
  
  const handleSelectThread = (threadId: string) => {
    setActiveThread(threadId)
  }
  
  const handleDeleteThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the thread from the state
        setThreads(prev => prev.filter(thread => thread.id !== threadId));
        
        // If the active thread was deleted, reset it
        if (activeThread === threadId) {
          setActiveThread(null);
        }
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      setError("Failed to delete chat. Please try again.")
    }
  }

  const toggleTag = (tagId: string) => {
    setActiveTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters and History */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Narrow your search context</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Folders</h3>
                    <div className="space-y-1">
                      <Button
                        variant={activeFolder === null ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveFolder(null)}
                      >
                        All Documents
                      </Button>
                      
                      {folders.map(folder => (
                        <Button
                          key={folder.id}
                          variant={activeFolder === folder.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setActiveFolder(folder.id)}
                        >
                          {folder.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Button
                          key={tag.id}
                          variant={activeTags.includes(tag.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Chat History</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCreateNewChat}
                >
                  + New Chat
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : threads.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No chat history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {threads.map(thread => (
                      <div 
                        key={thread.id} 
                        className="flex items-center justify-between"
                      >
                        <Button 
                          variant={activeThread === thread.id ? "default" : "ghost"} 
                          className="w-full justify-start text-sm truncate"
                          onClick={() => handleSelectThread(thread.id)}
                        >
                          {thread.title}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 ml-1"
                          onClick={() => handleDeleteThread(thread.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Content - Chat Interface */}
          <div className="md:col-span-3">
            <ChatInterface 
              onSendMessage={handleSendMessage} 
              threadId={activeThread}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
