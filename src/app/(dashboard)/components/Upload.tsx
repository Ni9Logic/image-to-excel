import { UploadCloud, X } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

export const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file && file.size <= 10 * 1024 * 1024) {
      if (file.type === "application/pdf" || file.type === "image/png") {
        setSelectedFile(file)
        toast.success("File uploaded successfully!")
      } else {
        toast.error("Please upload a PDF or PNG file")
      }
    } else {
      toast.error("File size should be less than 10MB")
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    toast.success("File removed")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-center w-full">
        {selectedFile ? (
          <div className="w-full h-64 border-2 rounded-lg border-muted bg-muted/50 p-4 transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                  </span>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted bg-muted/50 hover:bg-muted/70"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className={`p-4 rounded-full mb-3 transition-colors ${
                isDragging ? "bg-primary/10" : "bg-muted"
              }`}>
                <UploadCloud className={`w-8 h-8 ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>
              <p className="mb-2 text-sm">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF or PNG (Max size: 10MB)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="application/pdf,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileSelect(file)
                }
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}