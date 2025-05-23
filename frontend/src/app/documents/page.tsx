"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

interface Document {
  id: string
  title: string
  mime: string
  size: number
  createdAt: string
  tags: string[]
  status: 'pending' | 'processing' | 'ready' | 'error'
}

interface Folder {
  id: string
  name: string
  parentId?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [error, setError] = useState("")
  
  const { isAuthenticated } = useAuth()
  
  // Fetch documents and folders when the component mounts or when the selected folder changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments()
      fetchFolders()
    }
  }, [isAuthenticated, selectedFolder])
  
  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      
      const url = selectedFolder 
        ? `/api/documents?folderId=${selectedFolder}` 
        : '/api/documents'
        
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setDocuments(result.data)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents. Please try again.")
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

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    setError("")
    
    try {
      // Create a FormData object to send files
      const formData = new FormData();
      
      // Add each file to the FormData
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add folder ID if selected
      if (selectedFolder) {
        formData.append('folderId', selectedFolder);
      }
      
      // Send the files to the backend
      const response = await fetch('/api/documents/batch', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Refresh the document list
        fetchDocuments();
        return result.data;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.")
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the document from the state
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document. Please try again.")
    }
  }
  
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newFolderName.trim()) {
      return
    }
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: selectedFolder
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Add the new folder to the state
        setFolders(prev => [...prev, result.data]);
        setNewFolderName("");
        setShowNewFolderInput(false);
      } else {
        throw new Error(result.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setError("Failed to create folder. Please try again.")
    }
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
    if (type.includes('word') || type.includes('docx')) return '📝'
    if (type.includes('sheet') || type.includes('csv') || type.includes('xlsx')) return '📊'
    if (type.includes('text') || type.includes('txt')) return '📃'
    return '📁'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'processing': return '🔄'
      case 'ready': return '✅'
      case 'error': return '❌'
      default: return ''
    }
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
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
                    variant={selectedFolder === null ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(null)}
                  >
                    All Documents
                  </Button>
                  
                  {folders.map(folder => (
                    <Button 
                      key={folder.id}
                      variant={selectedFolder === folder.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      {folder.name}
                    </Button>
                  ))}
                  
                  {showNewFolderInput ? (
                    <form onSubmit={handleCreateFolder} className="pt-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="submit" size="sm">Add</Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setShowNewFolderInput(false)
                            setNewFolderName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-primary"
                      onClick={() => setShowNewFolderInput(true)}
                    >
                      + New Folder
                    </Button>
                  )}
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
                    folders.find(f => f.id === selectedFolder)?.name || 'Selected Folder' : 
                    'All Documents'}
                </CardTitle>
                <CardDescription>
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : documents.length === 0 ? (
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
                          <span className="text-2xl">{getFileIcon(doc.mime)}</span>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{doc.title}</p>
                              <span className="ml-2" title={doc.status}>
                                {getStatusIcon(doc.status)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size)} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.map((tag, i) => (
                                  <span 
                                    key={i} 
                                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
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
    </ProtectedRoute>
  )
}
