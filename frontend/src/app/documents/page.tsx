"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  tags: string[]
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    
    try {
      // Create a FormData object to send files
      const formData = new FormData();
      
      // Add each file to the FormData
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Send the files to the backend
      const response = await fetch('/api/documents/batch', {
        method: 'POST',
        body: formData,
        // No need to set Content-Type header, it will be set automatically with boundary
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convert backend document format to frontend format
        const newDocuments: Document[] = result.data.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          uploadedAt: doc.createdAt,
          tags: doc.tags || []
        }));
        
        setDocuments(prev => [...prev, ...newDocuments]);
        return newDocuments;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('sheet') || type.includes('csv')) return '📊'
    if (type.includes('text')) return '📃'
    return '📁'
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar - Folders */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>Organize your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder(null)}
                >
                  All Documents
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder('reports')}
                >
                  Reports
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder('financial')}
                >
                  Financial Documents
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-primary"
                >
                  + New Folder
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <FileUpload onUpload={handleUpload} />
          </div>
        </div>
        
        {/* Right Content - Document List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFolder ? 
                  selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1) : 
                  'All Documents'}
              </CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No documents yet</p>
                  <p className="text-sm">Upload documents to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(doc.type)}</span>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
