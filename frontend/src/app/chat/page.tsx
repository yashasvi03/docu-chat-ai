"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  citations?: Citation[]
}

interface Citation {
  documentId: string
  documentName: string
  page?: number
  text: string
}

export default function ChatPage() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])

  const handleSendMessage = async (message: string): Promise<Message> => {
    console.log("Sending message:", message);
    
    try {
      // Prepare the request payload
      const payload = {
        message,
        folderId: activeFolder,
        tags: activeTags,
        // If you have an active conversation, you would include conversationId here
      };
      
      // Send the message to the backend
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Chat query failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.message) {
        // Convert backend message format to frontend format
        const assistantMessage: Message = {
          id: result.data.message.id,
          content: result.data.message.content,
          role: result.data.message.role,
          citations: result.data.message.citations,
        };
        
        return assistantMessage;
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

  const folders = [
    { id: "all", name: "All Documents" },
    { id: "reports", name: "Reports" },
    { id: "financial", name: "Financial Documents" }
  ]

  const tags = [
    { id: "growth", name: "Growth" },
    { id: "performance", name: "Performance" },
    { id: "trends", name: "Trends" },
    { id: "quarterly", name: "Quarterly" }
  ]

  const toggleTag = (tagId: string) => {
    setActiveTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
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
                    {folders.map(folder => (
                      <Button
                        key={folder.id}
                        variant={activeFolder === folder.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveFolder(folder.id === "all" ? null : folder.id)}
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
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Monthly growth trends
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Q1 performance summary
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Revenue projections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Content - Chat Interface */}
        <div className="md:col-span-3">
          <ChatInterface onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  )
}
