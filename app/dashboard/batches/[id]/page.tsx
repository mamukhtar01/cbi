"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, RotateCcw, Download, Loader2, CheckCircle2, XCircle, Clock, ShieldCheck, ShieldX } from "lucide-react"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock (Test)",
  mtn_momo: "MTN MoMo",
  mpesa: "M-Pesa",
}

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR(`/api/payments/batch/${id}`, fetcher, {
    refreshInterval: 5000,
  })
  const [retrying, setRetrying] = useState(false)
  const [approving, setApproving] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("mock")

  async function handleApprove() {
    if (!selectedProvider) {
      toast.error("Please select a payment provider before approving")
      return
    }
    setApproving(true)
    try {
      const res = await fetch("/api/batches/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: id, approve: true, payment_provider: selectedProvider }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Batch approved with provider: ${PROVIDER_LABELS[selectedProvider] || selectedProvider}`)
        mutate()
      } else {
        toast.error(result.error || "Approval failed")
      }
    } catch {
      toast.error("Network error during approval")
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    setApproving(true)
    try {
      const res = await fetch("/api/batches/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: id, approve: false }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success("Batch rejected")
        mutate()
      } else {
        toast.error(result.error || "Rejection failed")
      }
    } catch {
      toast.error("Network error during rejection")
    } finally {
      setApproving(false)
    }
  }

  async function handleProcess() {
    setRetrying(true)
    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Processing started: ${result.successful} successful, ${result.failed} failed`)
        mutate()
      } else {
        toast.error(result.error || "Processing failed")
      }
    } catch {
      toast.error("Network error during processing")
    } finally {
      setRetrying(false)
    }
  }

  async function handleRetryAll() {
    setRetrying(true)
    try {
      const res = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Retried ${result.retried} payments: ${result.successful} successful, ${result.failed} failed`)
        mutate()
      } else {
        toast.error(result.error || "Retry failed")
      }
    } catch {
      toast.error("Network error during retry")
    } finally {
      setRetrying(false)
    }
  }

  async function handleExport() {
    window.open(`/api/reports/export?batch_id=${id}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Batch not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const { batch, payments, status_counts: counts } = data
  const totalPayments = payments.length
  const progressPercent = totalPayments > 0 ? ((counts.success + counts.failed) / totalPayments) * 100 : 0
  const isPendingApproval = batch.status === "pending_approval"
  const isApproved = batch.status === "approved"
  const isRejected = batch.status === "rejected"
  const canProcess = isApproved
  const canRetry = ["approved", "processing", "partial", "completed"].includes(batch.status) && counts.failed > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{batch.file_name}</h1>
              <PaymentStatusBadge status={batch.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Uploaded {format(new Date(batch.created_at), "MMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canRetry && (
            <Button variant="outline" onClick={handleRetryAll} disabled={retrying} className="gap-2">
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Retry Failed ({counts.failed})
            </Button>
          )}
          {canProcess && (
            <Button onClick={handleProcess} disabled={retrying} className="gap-2">
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Process Payments
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Approval panel */}
      {isPendingApproval && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" />
              Approval Required
            </CardTitle>
            <CardDescription>
              This batch is awaiting approval. Select a payment provider and approve or reject below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={approving}
                className="gap-2"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approving || !selectedProvider}
                className="gap-2"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval info (when approved or rejected) */}
      {(isApproved || isRejected) && batch.approved_by && (
        <Card className={isApproved ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {isApproved ? "Approved by:" : "Rejected by:"}
                </span>{" "}
                <span className="font-medium text-foreground">{batch.approved_by}</span>
              </div>
              {batch.approved_at && (
                <div>
                  <span className="text-muted-foreground">At:</span>{" "}
                  <span className="font-medium text-foreground">
                    {format(new Date(batch.approved_at), "MMM d, yyyy 'at' HH:mm")}
                  </span>
                </div>
              )}
              {isApproved && batch.payment_provider && (
                <div>
                  <span className="text-muted-foreground">Provider:</span>{" "}
                  <span className="font-medium text-foreground">
                    {PROVIDER_LABELS[batch.payment_provider] || batch.payment_provider}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPayments}</p>
              <p className="text-xs text-muted-foreground">Total Recipients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{counts.success}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{counts.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">
              {parseFloat(batch.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {(batch.status === "processing" || counts.pending > 0 || counts.processing > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Processing Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {counts.pending > 0 && <span>{counts.pending} pending</span>}
              {counts.processing > 0 && <span>{counts.processing} processing</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Individual payment status for each recipient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              {counts.success} success
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              {counts.failed} failed
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3 text-warning" />
              {counts.pending + counts.processing} pending
            </Badge>
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: Record<string, unknown>) => (
                  <TableRow key={payment.id as string}>
                    <TableCell className="font-medium">{payment.recipient_name as string}</TableCell>
                    <TableCell className="font-mono text-sm">{payment.phone_number as string}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(payment.amount as string).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status as string} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {PROVIDER_LABELS[payment.payment_provider as string] || (payment.payment_provider as string) || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-32 truncate">
                      {(payment.transaction_id as string) || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-48 truncate">
                      {(payment.error_message as string) || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.processed_at
                        ? format(new Date(payment.processed_at as string), "HH:mm:ss")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
