import React, { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../components/ui'
import * as XLSX from 'xlsx'
import { cooperativeApi } from '../api/cooperativeApi'

interface BulkOfflineMembersModalProps {
  isOpen: boolean
  onClose: () => void
  cooperativeId: string
  onSuccess: () => void
}

interface ParsedMember {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  address?: string
  row: number
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export const BulkOfflineMembersModal: React.FC<BulkOfflineMembersModalProps> = ({
  isOpen,
  onClose,
  cooperativeId,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const downloadTemplate = (format: 'csv' | 'excel' = 'csv') => {
    const headers = ['First Name*', 'Last Name*', 'Phone', 'Email', 'Address']
    const sampleData = [
      ['John', 'Doe', '08012345678', 'john.doe@example.com', '123 Main Street, Lagos'],
      ['Jane', 'Smith', '08098765432', 'jane.smith@example.com', '456 Oak Avenue, Abuja'],
      ['Michael', 'Johnson', '07011223344', '', 'Plot 789, Victoria Island'],
    ]

    if (format === 'excel') {
      // Create Excel workbook
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Members')
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 30 }, // Address
      ]
      
      XLSX.writeFile(wb, 'offline_members_template.xlsx')
    } else {
      // Create CSV template
      const csvContent = [
        headers.join(','),
        ...sampleData.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', 'offline_members_template.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const isCSV = selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv'
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || 
                    selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    selectedFile.type === 'application/vnd.ms-excel'
    
    if (!isCSV && !isExcel) {
      alert('Please upload a CSV or Excel file')
      return
    }

    setFile(selectedFile)
    setUploadSuccess(false)
    
    if (isExcel) {
      parseExcelFile(selectedFile)
    } else {
      parseCSVFile(selectedFile)
    }
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      // Skip header row
      const dataLines = lines.slice(1)
      const members: ParsedMember[] = []
      const errors: ValidationError[] = []

      dataLines.forEach((line, index) => {
        const row = index + 2 // +2 because we skipped header and arrays are 0-indexed
        
        // Parse CSV line (handle quoted values)
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(val => 
          val.replace(/^"(.*)"$/, '$1').trim()
        ) || []

        const [firstName, lastName, phone, email, address] = values

        // Validation
        if (!firstName || firstName.length === 0) {
          errors.push({ row, field: 'First Name', message: 'First name is required' })
        }
        if (!lastName || lastName.length === 0) {
          errors.push({ row, field: 'Last Name', message: 'Last name is required' })
        }

        // Only add if required fields are present
        if (firstName && lastName) {
          members.push({
            firstName,
            lastName,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            row,
          })
        }
      })

      setParsedMembers(members)
      setValidationErrors(errors)
    }

    reader.onerror = () => {
      alert('Error reading file')
    }

    reader.readAsText(file)
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        
        if (jsonData.length < 2) {
          alert('Excel file must contain at least a header row and one data row')
          return
        }

        // Skip header row
        const dataRows = jsonData.slice(1)
        const members: ParsedMember[] = []
        const errors: ValidationError[] = []

        dataRows.forEach((row, index) => {
          const rowNum = index + 2 // +2 because we skipped header and arrays are 0-indexed
          
          // Skip empty rows
          if (!row || row.length === 0 || row.every(cell => !cell)) {
            return
          }
          
          const [firstName, lastName, phone, email, address] = row.map(cell => 
            cell ? String(cell).trim() : ''
          )

          // Validation
          if (!firstName || firstName.length === 0) {
            errors.push({ row: rowNum, field: 'First Name', message: 'First name is required' })
          }
          if (!lastName || lastName.length === 0) {
            errors.push({ row: rowNum, field: 'Last Name', message: 'Last name is required' })
          }

          // Only add if required fields are present
          if (firstName && lastName) {
            members.push({
              firstName,
              lastName,
              phone: phone || undefined,
              email: email || undefined,
              address: address || undefined,
              row: rowNum,
            })
          }
        })

        setParsedMembers(members)
        setValidationErrors(errors)
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        alert('Error parsing Excel file. Please check the file format.')
      }
    }

    reader.onerror = () => {
      alert('Error reading file')
    }

    reader.readAsArrayBuffer(file)
  }

  const handleUpload = async () => {
    if (parsedMembers.length === 0) {
      alert('No valid members to upload')
      return
    }

    if (validationErrors.length > 0) {
      if (!confirm(`There are ${validationErrors.length} validation errors. Continue with valid members only?`)) {
        return
      }
    }

    setIsUploading(true)

    try {
      // Call backend API to bulk create offline members
      const response = await cooperativeApi.bulkCreateOfflineMembers(cooperativeId, parsedMembers)
      
      if (response.success && response.data) {
        const { successCount, failedCount, failed } = response.data
        
        if (failedCount > 0) {
          // Show partial success message
          const failedRows = failed.map(f => f.member.firstName + ' ' + f.member.lastName).join(', ')
          alert(`Successfully uploaded ${successCount} members.\n${failedCount} failed: ${failedRows}`)
        }
        
        setUploadSuccess(true)
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload members. Please try again.'
      alert(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedMembers([])
    setValidationErrors([])
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fileList = e.dataTransfer.files
      const event = {
        target: { files: fileList }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(event)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Upload Offline Members</h2>
              <p className="text-sm text-blue-100">Upload multiple members via CSV file</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {uploadSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600">
                {parsedMembers.length} member{parsedMembers.length !== 1 ? 's' : ''} uploaded successfully
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Instructions
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 ml-7 list-decimal">
                  <li>Download the CSV template below</li>
                  <li>Fill in member details (First Name and Last Name are required)</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review the parsed data and click Upload</li>
                </ol>
              </div>

              {/* Download Template Buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Download Template:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => downloadTemplate('csv')}
                    variant="outline"
                    className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4" />
                    CSV Format
                  </Button>
                  <Button
                    onClick={() => downloadTemplate('excel')}
                    variant="outline"
                    className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4" />
                    Excel Format
                  </Button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full ${file ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {file ? (
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      ) : (
                        <Upload className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {file ? (
                      <>
                        <p className="text-sm font-medium text-green-700">{file.name}</p>
                        <p className="text-xs text-green-600">
                          {parsedMembers.length} member{parsedMembers.length !== 1 ? 's' : ''} ready to upload
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-gray-700">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">Supports CSV and Excel (.xlsx, .xls) files</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Validation Errors ({validationErrors.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="font-medium">Row {error.row}:</span>
                        <span>{error.field} - {error.message}</span>
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <p className="text-sm text-red-600 italic">
                        ...and {validationErrors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Parsed Members */}
              {parsedMembers.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Preview ({parsedMembers.length} member{parsedMembers.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">First Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Last Name</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedMembers.slice(0, 10).map((member, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 text-gray-900">{member.firstName}</td>
                            <td className="px-3 py-2 text-gray-900">{member.lastName}</td>
                            <td className="px-3 py-2 text-gray-600">{member.phone || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{member.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedMembers.length > 10 && (
                      <p className="text-sm text-gray-600 text-center mt-3 italic">
                        ...and {parsedMembers.length - 10} more members
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!uploadSuccess && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || parsedMembers.length === 0 || isUploading}
              className="min-w-32"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Members
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
