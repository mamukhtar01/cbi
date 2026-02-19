"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import Link from "next/link"
import { format } from "date-fns"
import { ReportFilters } from "@/components/report-filters"
import { PaymentChart } from "@/components/payment-chart"
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
import { ChevronLeft, ChevronRight } from "lucide-react"

function buildQueryString(params: Record<string, string | number>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== "all" && value !== undefined) {
      query.set(key, String(value))
    }
  })
  return query.toString()
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    // Simple debounce with setTimeout
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const queryString = buildQueryString({
    search: debouncedSearch,
    status,
    date_from: dateFrom,
    date_to: dateTo,
    page,
    limit: 25,
  })

  const { data, isLoading } = useSWR(`/api/reports?${queryString}`, fetcher, {
    refreshInterval: 15000,
  })

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setStatus("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  function handleExport() {
    const exportQuery = buildQueryString({
      search: debouncedSearch,
      status,
      date_from: dateFrom,
      date_to: dateTo,
    })
    window.open(`/api/reports/export?${exportQuery}`, "_blank")
  }

  const totalPages = data ? Math.ceil(data.total / 25) : 0
  const payments = data?.payments || []
  const stats = data?.stats || {}
  const dailyStats = data?.daily_stats || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and filter all payment transactions
        </p>
      </div>

      {/* Summary stats row */}
      {!isLoading && stats.total_payments && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold text-foreground">
                {parseInt(stats.total_payments).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-success">
                {parseInt(stats.successful).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">
                {parseInt(stats.failed).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold text-foreground">
                {parseFloat(stats.total_sent).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {!isLoading && (parseInt(stats.total_payments) > 0) && (
        <PaymentChart dailyStats={dailyStats} stats={stats} />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All individual payment records with filtering</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ReportFilters
            search={search}
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchChange={handleSearchChange}
            onStatusChange={(v) => { setStatus(v); setPage(1) }}
            onDateFromChange={(v) => { setDateFrom(v); setPage(1) }}
            onDateToChange={(v) => { setDateTo(v); setPage(1) }}
            onClear={handleClearFilters}
            onExport={handleExport}
          />

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-muted-foreground">No payments found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: Record<string, unknown>) => (
                      <TableRow key={payment.id as string}>
                        <TableCell className="font-medium">
                          {payment.recipient_name as string}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.phone_number as string}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(payment.amount as string).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status as string} />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-28 truncate">
                          {(payment.transaction_id as string) || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-28 truncate">
                          <Link
                            href={`/dashboard/batches/${payment.batch_id}`}
                            className="hover:underline hover:text-foreground"
                          >
                            {payment.file_name as string}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(payment.created_at as string), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({data.total} total records)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
