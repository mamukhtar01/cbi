"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { FileUpload } from "@/components/file-upload"
import { DataPreviewTable, type PaymentRow } from "@/components/data-preview-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Send, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Clock } from "lucide-react"

type Step = "upload" | "preview" | "awaiting_approval" | "processing" | "complete"

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock (Test)",
  mtn_momo: "MTN MoMo",
  mpesa: "M-Pesa",
}

interface UploadResult {
  batch_id: string
  total_recipients: number
  total_amount: number
  recent_successful_payments: string[]
  duplicates_in_file: string[]
  validation_errors: { row: number; message: string }[]
}

interface ProcessResult {
  processed: number
  successful: number
  failed: number
  batch_id: string
}

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState("")
  const [parsedData, setParsedData] = useState<PaymentRow[]>([])
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("mock")

  const handleFileSelected = useCallback((file: File) => {
    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" })

        if (jsonData.length === 0) {
          toast.error("The file appears to be empty")
          return
        }

        // Map columns - try common column names
        const rows: PaymentRow[] = jsonData.map((row) => {
          const name =
            (row["Name"] as string) ||
            (row["name"] as string) ||
            (row["Recipient Name"] as string) ||
            (row["recipient_name"] as string) ||
            (row["Full Name"] as string) ||
            (row["full_name"] as string) ||
            ""
          const phone =
            (row["Phone"] as string) ||
            (row["phone"] as string) ||
            (row["Phone Number"] as string) ||
            (row["phone_number"] as string) ||
            (row["Mobile"] as string) ||
            (row["mobile"] as string) ||
            ""
          const amountRaw =
            row["Amount"] || row["amount"] || row["Payment"] || row["payment"] || 0
          const amount = parseFloat(String(amountRaw)) || 0

          // Normalize phone: ensure it's a string
          const phoneStr = String(phone).replace(/\s+/g, "").trim()

          const errors: string[] = []
          if (!name.trim()) errors.push("Missing name")
          if (!phoneStr) errors.push("Missing phone")
          if (amount <= 0) errors.push("Invalid amount")

          return {
            recipient_name: name.trim(),
            phone_number: phoneStr,
            amount,
            valid: errors.length === 0,
            error: errors.join(", "),
          }
        })

        setParsedData(rows)
        setStep("preview")
        toast.success(`Parsed ${rows.length} rows from ${file.name}`)
      } catch (err) {
        console.error("Parse error:", err)
        toast.error("Failed to parse the file. Please check the format.")
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const handleUploadAndValidate = useCallback(async () => {
    setLoading(true)
    try {
      const validRows = parsedData.filter((r) => r.valid)
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: fileName,
          payments: validRows.map((r) => ({
            recipient_name: r.recipient_name,
            phone_number: r.phone_number,
            amount: r.amount,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        return
      }

      setUploadResult(data)

      if (data.recent_successful_payments.length > 0 || data.duplicates_in_file.length > 0) {
        setShowConfirm(true)
      } else {
        // Move to awaiting approval step instead of auto-processing
        setStep("awaiting_approval")
        toast.success("Batch uploaded successfully. Select a provider and approve to continue.")
      }
    } catch {
      toast.error("Network error during upload")
    } finally {
      setLoading(false)
    }
  }, [parsedData, fileName])

  const handleApprove = useCallback(async () => {
    if (!uploadResult) return
    if (!selectedProvider) {
      toast.error("Please select a payment provider before approving")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/batches/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: uploadResult.batch_id,
          approve: true,
          payment_provider: selectedProvider,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Approval failed")
        return
      }
      toast.success("Batch approved. Starting payment processing...")
      await processPayments(uploadResult.batch_id)
    } catch {
      toast.error("Network error during approval")
    } finally {
      setLoading(false)
    }
  }, [uploadResult, selectedProvider])

  const handleReject = useCallback(async () => {
    if (!uploadResult) return
    setLoading(true)
    try {
      const res = await fetch("/api/batches/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: uploadResult.batch_id,
          approve: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Rejection failed")
        return
      }
      toast.success("Batch rejected.")
      router.push(`/dashboard/batches/${uploadResult.batch_id}`)
    } catch {
      toast.error("Network error during rejection")
    } finally {
      setLoading(false)
    }
  }, [uploadResult, router])

  const processPayments = useCallback(async (batchId: string) => {
    setStep("processing")
    setLoading(true)

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Processing failed")
        setStep("awaiting_approval")
        return
      }

      setProcessResult(data)
      setStep("complete")

      if (data.failed === 0) {
        toast.success(`All ${data.successful} payments sent successfully!`)
      } else {
        toast.warning(`${data.successful} successful, ${data.failed} failed`)
      }
    } catch {
      toast.error("Network error during processing")
      setStep("awaiting_approval")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConfirmProcess = useCallback(() => {
    setShowConfirm(false)
    if (uploadResult) {
      setStep("awaiting_approval")
      toast.success("Batch uploaded successfully. Select a provider and approve to continue.")
    }
  }, [uploadResult])

  const handleReset = useCallback(() => {
    setStep("upload")
    setFileName("")
    setParsedData([])
    setUploadResult(null)
    setProcessResult(null)
    setSelectedProvider("mock")
  }, [])

  const stepLabels = ["Upload File", "Preview Data", "Awaiting Approval", "Processing", "Complete"]
  const stepKeys: Step[] = ["upload", "preview", "awaiting_approval", "processing", "complete"]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload & Process</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload an Excel file with recipient names, phone numbers, and amounts
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {stepLabels.map((label, idx) => {
          const currentIdx = stepKeys.indexOf(step)
          const isActive = idx === currentIdx
          const isDone = idx < currentIdx

          return (
            <div key={label} className="flex items-center gap-2">
              {idx > 0 && <div className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`} />}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>
              {"Your file should have columns for Name, Phone Number, and Amount."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelected={handleFileSelected} />
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">Expected file format:</p>
              <div className="mt-2 overflow-auto rounded border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Phone Number</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-foreground">John Doe</td>
                      <td className="px-3 py-2 font-mono text-foreground">+254712345678</td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">1500.00</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-foreground">Jane Smith</td>
                      <td className="px-3 py-2 font-mono text-foreground">+254798765432</td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">2000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Review the parsed data before submitting for approval
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadAndValidate}
                  disabled={loading || parsedData.filter((r) => r.valid).length === 0}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataPreviewTable
              data={parsedData}
              recentPhones={uploadResult?.recent_successful_payments || []}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Awaiting Approval */}
      {step === "awaiting_approval" && uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Awaiting Approval
            </CardTitle>
            <CardDescription>
              Review the batch summary, select a payment provider, then approve or reject.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Batch summary */}
            <div className="rounded-lg border bg-muted/30 p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">File</p>
                <p className="font-medium text-foreground">{fileName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recipients</p>
                <p className="font-medium text-foreground">{uploadResult.total_recipients}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium text-foreground">
                  {uploadResult.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch ID</p>
                <p className="font-mono text-xs text-foreground">{uploadResult.batch_id}</p>
              </div>
            </div>

            {/* Provider selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Payment Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                MTN MoMo and M-Pesa are stubs — they will return &ldquo;provider not configured&rdquo; until real integration is added.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={loading || !selectedProvider}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Approve & Process
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Processing Payments</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sending money to {parsedData.filter((r) => r.valid).length} recipients via {PROVIDER_LABELS[selectedProvider] || selectedProvider}...
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This may take a few minutes. Please do not close this page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === "complete" && processResult && (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-12">
            {processResult.failed === 0 ? (
              <CheckCircle2 className="h-16 w-16 text-success" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-warning" />
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {processResult.failed === 0 ? "All Payments Successful" : "Processing Complete"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {processResult.processed} payments processed
              </p>
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <span className="text-lg font-bold text-foreground">{processResult.successful}</span>
                <span className="text-xs text-muted-foreground">Successful</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-lg font-bold text-foreground">{processResult.failed}</span>
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Upload Another File
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/batches/${processResult.batch_id}`)}
              >
                View Batch Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate warning dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Duplicate Payment Warning
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3">
                {uploadResult?.recent_successful_payments && uploadResult.recent_successful_payments.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">
                      These phone numbers received a payment in the last 24 hours:
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {uploadResult.recent_successful_payments.map((phone) => (
                        <li key={phone} className="font-mono">{phone}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {uploadResult?.duplicates_in_file && uploadResult.duplicates_in_file.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">
                      Duplicate phone numbers found in the file:
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {uploadResult.duplicates_in_file.map((phone) => (
                        <li key={phone} className="font-mono">{phone}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p>Do you want to proceed to the approval step anyway?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProcess}>
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
