"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Citation {
  chunkId: string
  documentId: string
  documentTitle: string
  page?: number
  similarity: number
}

interface CitationViewerProps {
  citation: Citation
  isOpen: boolean
  onClose: () => void
}

export function CitationViewer({ citation, isOpen, onClose }: CitationViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch citation content when the dialog opens
  useEffect(() => {
    if (isOpen && citation) {
      fetchCitationContent()
    }
  }, [isOpen, citation])
  
  const fetchCitationContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/chat/citations/${citation.chunkId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch citation: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setContent(result.data.content)
      } else {
        throw new Error(result.message || 'Failed to fetch citation content')
      }
    } catch (error) {
      console.error("Error fetching citation:", error)
      setError("Failed to load citation content. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{citation.documentTitle}</DialogTitle>
          <DialogDescription>
            {citation.page ? `Page ${citation.page}` : 'Source document'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap">
            {content}
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
