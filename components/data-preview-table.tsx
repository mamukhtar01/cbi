"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export interface PaymentRow {
  recipient_name: string
  phone_number: string
  amount: number
  valid: boolean
  error?: string
}

interface DataPreviewTableProps {
  data: PaymentRow[]
  recentPhones?: string[]
}

export function DataPreviewTable({ data, recentPhones = [] }: DataPreviewTableProps) {
  const validCount = data.filter((r) => r.valid).length
  const invalidCount = data.length - validCount
  const totalAmount = data.filter((r) => r.valid).reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          {data.length} total rows
        </Badge>
        <Badge variant="secondary" className="gap-1 bg-success/15 text-success border-success/30">
          {validCount} valid
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="secondary" className="gap-1 bg-destructive/15 text-destructive border-destructive/30">
            {invalidCount} invalid
          </Badge>
        )}
        <Badge variant="secondary" className="gap-1">
          Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalAmount)}
        </Badge>
      </div>

      <div className="rounded-md border overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Recipient Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const isDuplicate = recentPhones.includes(row.phone_number)
              return (
                <TableRow key={idx} className={!row.valid ? "bg-destructive/5" : isDuplicate ? "bg-warning/5" : ""}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{row.recipient_name || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{row.phone_number || "-"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {row.amount ? row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
                  </TableCell>
                  <TableCell>
                    {!row.valid ? (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {row.error}
                      </span>
                    ) : isDuplicate ? (
                      <span className="flex items-center gap-1 text-xs text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Recent payment
                      </span>
                    ) : (
                      <span className="text-xs text-success">Valid</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
