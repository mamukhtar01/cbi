"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface BudgetLine {
  id: string
  budget_line_code: string
  amount: number
  project_name: string
  approver: string
  created_at: string
}

export default function BudgetLinesPage() {
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetLine | null>(null)

  const [code, setCode] = useState("")
  const [amount, setAmount] = useState("")
  const [projectName, setProjectName] = useState("")
  const [approver, setApprover] = useState("")

  const fetchBudgetLines = useCallback(async () => {
    try {
      const res = await fetch("/api/budget-lines", { credentials: "include" })
      const data = await res.json()
      if (res.ok) {
        setBudgetLines(data.budget_lines)
      } else {
        toast.error(data.error || "Failed to load budget lines")
      }
    } catch {
      toast.error("Network error loading budget lines")
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    fetchBudgetLines()
  }, [fetchBudgetLines])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !amount || !projectName.trim() || !approver.trim()) {
      toast.error("All fields are required")
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be a positive number")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/budget-lines", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_line_code: code,
          amount: parsedAmount,
          project_name: projectName,
          approver,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to add budget line")
        return
      }
      toast.success("Budget line added successfully")
      setCode("")
      setAmount("")
      setProjectName("")
      setApprover("")
      setBudgetLines((prev) => [data.budget_line, ...prev])
    } catch {
      toast.error("Network error adding budget line")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/budget-lines/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to delete budget line")
        return
      }
      toast.success("Budget line deleted")
      setBudgetLines((prev) => prev.filter((b) => b.id !== deleteTarget.id))
    } catch {
      toast.error("Network error deleting budget line")
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Budget Lines</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage budget lines for payment authorization. Each batch upload must be assigned a budget line.
        </p>
      </div>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Budget Line</CardTitle>
          <CardDescription>Create a new budget line with a unique code, total amount, project, and approver.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bl-code">Budget Line Code</Label>
              <Input
                id="bl-code"
                placeholder="e.g. BL-2024-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bl-amount">Total Amount</Label>
              <Input
                id="bl-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 50000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bl-project">Project Name</Label>
              <Input
                id="bl-project"
                placeholder="e.g. Community Outreach Q1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bl-approver">Approver</Label>
              <Input
                id="bl-approver"
                placeholder="e.g. Jane Doe"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Add Budget Line
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Budget Lines</CardTitle>
          <CardDescription>
            {budgetLines.length} budget line{budgetLines.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : budgetLines.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No budget lines yet. Add one above.
            </p>
          ) : (
            <div className="overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Approver</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetLines.map((bl) => (
                    <tr key={bl.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{bl.budget_line_code}</td>
                      <td className="px-4 py-3 text-foreground">{bl.project_name}</td>
                      <td className="px-4 py-3 text-foreground">{bl.approver}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {Number(bl.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(bl.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(bl)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete budget line{" "}
              <span className="font-mono font-medium">{deleteTarget?.budget_line_code}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
