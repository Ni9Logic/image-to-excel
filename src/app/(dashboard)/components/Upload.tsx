import { UploadCloud, X, Merge, Download } from "lucide-react"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import * as XLSX from 'xlsx'
import { useAuth } from "@/contexts/AuthContext"
import { AuthModal } from "@/components/auth/AuthModal"
import { uploadDocument, deleteDocument } from "@/lib/blob-service"

interface TableData {
  headers: string[];
  data: string[][];
}

interface TableControlsProps {
  tables: TableData[];
  selectedTables: number[];
  onMerge: () => void;
  onExport: () => void;
}

function TableControls({ tables, selectedTables, onMerge, onExport }: TableControlsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {tables.length > 1 && (
        <button
          onClick={onMerge}
          disabled={selectedTables.length < 2}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
            ${selectedTables.length >= 2 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-muted text-muted-foreground cursor-not-allowed"}`}
        >
          <Merge className="w-4 h-4" />
          Merge Selected Tables
        </button>
      )}
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
      >
        <Download className="w-4 h-4" />
        {selectedTables.length > 0 
          ? `Export ${selectedTables.length} Selected Table${selectedTables.length > 1 ? 's' : ''}`
          : 'Export All Tables'}
      </button>
    </div>
  );
}

interface TableCardProps {
  table: TableData;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

function TableCard({ table, index, isSelected, onSelect }: TableCardProps) {
  return (
    <div 
      className={`border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200
        ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="p-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelect(index)}
              className={`w-5 h-5 rounded border transition-colors duration-200
                ${isSelected 
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground/30 hover:border-primary"}`}
            />
            <h4 className="text-sm font-semibold text-foreground">Table {index + 1}</h4>
          </div>
          <span className="text-xs text-muted-foreground">
            {table.data.length} rows × {table.headers.length} columns
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20">
              {table.headers.map((header: string, headerIndex: number) => (
                <th 
                  key={headerIndex}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b border-muted-foreground/20 first:pl-6 last:pr-6"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-muted-foreground/10">
            {table.data.map((row: string[], rowIndex: number) => (
              <tr 
                key={rowIndex}
                className="hover:bg-muted/30 transition-colors duration-200"
              >
                {row.map((cell: string, cellIndex: number) => (
                  <td 
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-foreground first:pl-6 last:pr-6"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 border-t bg-muted/10">
        <div className="text-xs text-muted-foreground text-center">
          Scroll horizontally to view all columns
        </div>
      </div>
    </div>
  );
}

export const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [extractedTables, setExtractedTables] = useState<TableData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState<string>("")
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const { user } = useAuth()

  const areTablesIdentical = (table1: TableData, table2: TableData): boolean => {
    if (table1.headers.length !== table2.headers.length) return false
    if (!table1.headers.every((header, i) => header === table2.headers[i])) return false
    if (table1.data.length !== table2.data.length) return false
    if (!table1.data.every((row, i) => row.length === table2.data[i].length)) return false
    return true
  }

  const handleTableSelect = (index: number) => {
    setSelectedTables(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const mergeSelectedTables = () => {
    if (selectedTables.length < 2) {
      toast.error("Please select at least 2 tables to merge")
      return
    }

    const firstTable = extractedTables[selectedTables[0]]
    const areAllIdentical = selectedTables.every(index => 
      areTablesIdentical(firstTable, extractedTables[index])
    )

    if (!areAllIdentical) {
      toast.error("Selected tables must have identical structure to merge")
      return
    }

    const mergedData = selectedTables.reduce((acc, index) => {
      return [...acc, ...extractedTables[index].data]
    }, [] as string[][])

    const mergedTable: TableData = {
      headers: firstTable.headers,
      data: mergedData
    }

    const newTables = extractedTables.filter((_, index) => !selectedTables.includes(index))
    setExtractedTables([...newTables, mergedTable])
    setSelectedTables([])
    toast.success(`Successfully merged ${selectedTables.length} tables`)
  }

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new()
      const tablesToExport = selectedTables.length > 0 
        ? selectedTables.map(index => extractedTables[index])
        : extractedTables

      tablesToExport.forEach((table, index) => {
        const wsData = [table.headers, ...table.data]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        XLSX.utils.book_append_sheet(wb, ws, `Table ${index + 1}`)
      })

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'extracted_tables.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Successfully exported ${tablesToExport.length} table${tablesToExport.length > 1 ? 's' : ''} to Excel!`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export tables to Excel')
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (file && file.size <= 10 * 1024 * 1024) {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setSelectedFile(file)
        setIsLoading(true)
        setProcessingStep("Uploading file...")
        setUploadProgress(0)
        
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval)
                return 90
              }
              return prev + 10
            })
          }, 300)
          
          // Upload file to blob storage (now with addRandomSuffix: true)
          const result = await uploadDocument(file, user.uid)
          setDocumentId(result.id) // Save the document ID for later deletion
          clearInterval(progressInterval)
          setUploadProgress(100)
          
          // Start extraction process
          setProcessingStep("Extracting content...")
          setUploadProgress(0)
          
          // Simulate extraction progress
          const extractionInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(extractionInterval)
                return 90
              }
              return prev + 5
            })
          }, 200)
          
          // Make API call to backend for extraction
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL_ENDPOINT}/extract-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.uid }),
          })
          
          clearInterval(extractionInterval)
          setUploadProgress(100)
          
          const data = await response.json()
          
          if (data.error) {
            throw new Error(data.error)
          }
          
          setExtractedText(data.text)
          setExtractedTables(data.tables)
          
          const fileType = file.type === "application/pdf" ? "PDF" : "Image"
          toast.success(`${fileType} content extracted successfully!`)
        } catch (error) {
          console.error("Processing error:", error)
          toast.error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setIsLoading(false)
          setProcessingStep("")
          setUploadProgress(0)
        }
        
        toast.success("File uploaded successfully!")
      } else {
        toast.error("Please upload a PDF or image file (PNG, JPG, JPEG)")
      }
    } else {
      toast.error("File size should be less than 10MB")
    }
  }

  const clearFile = async () => {
    if (isLoading) return
    
    try {
      if (documentId && user) {
        setProcessingStep("Deleting file...")
        setIsLoading(true)
        await deleteDocument(documentId)
        toast.success("File deleted successfully")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("Failed to delete file")
    } finally {
      setSelectedFile(null)
      setExtractedText("")
      setExtractedTables([])
      setSelectedTables([])
      setDocumentId(null)
      setIsLoading(false)
      setProcessingStep("")
    }
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
    <>
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
                  className="p-2 hover:bg-destructive/10 rounded-full transition-colors duration-200"
                  aria-label="Remove file"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
                ${isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted bg-muted/50 hover:bg-muted/70"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <div className={`p-4 rounded-full mb-3 transition-colors duration-200 ${
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
                  PDF or Image (PNG, JPG, JPEG) (Max size: 10MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
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

        {isLoading && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {processingStep}
                </span>
                <span className="text-xs text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {extractedText && !isLoading && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Extracted Text:</h3>
            <div className="max-h-[500px] overflow-y-auto bg-muted/50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {extractedText}
              </pre>
            </div>
          </div>
        )}

        {extractedTables.length > 0 && !isLoading && (
          <div className="mt-4 space-y-8">
            <TableControls 
              tables={extractedTables}
              selectedTables={selectedTables}
              onMerge={mergeSelectedTables}
              onExport={exportToExcel}
            />
            {extractedTables.map((table, index) => (
              <TableCard
                key={index}
                table={table}
                index={index}
                isSelected={selectedTables.includes(index)}
                onSelect={handleTableSelect}
              />
            ))}
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}