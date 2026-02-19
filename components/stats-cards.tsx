import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, CheckCircle2, XCircle, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  todayPayments: number
  successRate: number
  totalSent: number
  failedCount: number
}

export function StatsCards({ todayPayments, successRate, totalSent, failedCount }: StatsCardsProps) {
  const cards = [
    {
      title: "Payments Today",
      value: todayPayments.toLocaleString(),
      icon: Banknote,
      description: "Total transactions today",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      description: "Of all payments today",
    },
    {
      title: "Total Sent",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSent),
      icon: CheckCircle2,
      description: "Successfully disbursed today",
    },
    {
      title: "Failed",
      value: failedCount.toLocaleString(),
      icon: XCircle,
      description: "Payments needing retry",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
