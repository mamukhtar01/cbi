"use client"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileSelected: (file: File) => void
  accept?: string
}

export function FileUpload({ onFileSelected, accept = ".xlsx,.xls,.csv" }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        setSelectedFile(file)
        onFileSelected(file)
      }
    },
    [onFileSelected]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        setSelectedFile(file)
        onFileSelected(file)
      }
    },
    [onFileSelected]
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8">
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="h-10 w-10 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drag and drop your Excel file here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports .xlsx, .xls, and .csv files
        </p>
      </div>
      <label htmlFor="file-upload">
        <Button variant="outline" size="sm" asChild>
          <span>Browse Files</span>
        </Button>
        <input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
    </div>
  )
}
