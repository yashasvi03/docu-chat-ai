"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useDropzone } from "react-dropzone"

interface FileUploadProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
}

export function FileUpload({
  onUpload,
  maxFiles = 10,
  acceptedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv"
  ]
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>)
  })

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      await onUpload(files)
      setFiles([])
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Drag and drop files or click to browse. Supported formats: PDF, DOCX, XLSX, TXT, CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-primary">Drop the files here...</p>
          ) : (
            <p>Drag and drop files here, or click to select files</p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
      </CardFooter>
    </Card>
  )
}
