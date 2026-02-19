"use client"

import useSWR from "swr"
import Link from "next/link"
import { StatsCards } from "@/components/stats-cards"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, ArrowRight } from "lucide-react"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard/stats", fetcher, {
    refreshInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your payment activity</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const today = data?.today || {}
  const recentBatches = data?.recent_batches || []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your payment activity</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload" className="gap-2">
            <Upload className="h-4 w-4" />
            New Upload
          </Link>
        </Button>
      </div>

      <StatsCards
        todayPayments={parseInt(today.total_payments) || 0}
        successRate={today.success_rate || 0}
        totalSent={parseFloat(today.total_sent) || 0}
        failedCount={parseInt(today.failed) || 0}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Batches</CardTitle>
          <CardDescription>Your latest file uploads and their processing status</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No batches yet. Upload an Excel file to get started.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success / Failed</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">View</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBatches.map((batch: Record<string, unknown>) => (
                  <TableRow key={batch.id as string}>
                    <TableCell className="font-medium">{batch.file_name as string}</TableCell>
                    <TableCell>{(batch.total_recipients as number).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(batch.total_amount as string).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={batch.status as string} />
                    </TableCell>
                    <TableCell>
                      <span className="text-success">{batch.success_count as number}</span>
                      {" / "}
                      <span className="text-destructive">{batch.failed_count as number}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(batch.created_at as string), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/dashboard/batches/${batch.id}`}>
                          <ArrowRight className="h-4 w-4" />
                          <span className="sr-only">View batch</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
