import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"

const statusConfig = {
  success: {
    label: "Success",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: XCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    className: "bg-primary/15 text-primary border-primary/30",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partial",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
    icon: Clock,
  },
} as const

type StatusType = keyof typeof statusConfig

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusType] || statusConfig.pending
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 font-medium ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  )
}
