"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<Message>
  initialMessages?: Message[]
}

export function ChatInterface({
  onSendMessage,
  initialMessages = []
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user"
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await onSendMessage(input)
      setMessages(prev => [...prev, response])
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, there was an error processing your request. Please try again.",
          role: "assistant"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Chat with Your Documents</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Ask a question about your documents to get started.</p>
              <p className="text-sm mt-2">
                For example: "Summarize the monthly growth trends" or "What were the key findings in the Q2 report?"
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/20 text-sm">
                      <p className="font-medium">Sources:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {message.citations.map((citation, index) => (
                          <li key={index}>
                            <button
                              className="underline text-primary-foreground/80 hover:text-primary-foreground"
                              onClick={() => {
                                // Handle citation click - open document at specific location
                                console.log("Citation clicked:", citation)
                              }}
                            >
                              {citation.documentName}
                              {citation.page ? ` (page ${citation.page})` : ""}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center space-x-2">
          <textarea
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || input.trim() === ""}
            className="h-10"
          >
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
