"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Pie, PieChart } from "recharts"

interface DailyStat {
  date: string
  successful: number
  failed: number
  amount_sent: number
}

interface PaymentStats {
  total_payments: string
  successful: string
  failed: string
  pending: string
  total_sent: string
  total_amount: string
}

interface PaymentChartProps {
  dailyStats: DailyStat[]
  stats: PaymentStats
}

export function PaymentChart({ dailyStats, stats }: PaymentChartProps) {
  const barData = dailyStats.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Successful: Number(d.successful),
    Failed: Number(d.failed),
  }))

  const successful = parseInt(stats.successful) || 0
  const failed = parseInt(stats.failed) || 0
  const pending = parseInt(stats.pending) || 0

  const pieData = [
    { name: "Successful", value: successful },
    { name: "Failed", value: failed },
    { name: "Pending", value: pending },
  ].filter((d) => d.value > 0)

  const pieColors = [
    "oklch(0.55 0.18 155)", // success green
    "oklch(0.577 0.245 27.325)", // destructive red
    "oklch(0.7 0.18 80)", // warning amber
  ]

  if (barData.length === 0 && pieData.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {barData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payments Over Time</CardTitle>
            <CardDescription>Daily successful vs failed payments (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.005 240)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="Successful" fill="oklch(0.55 0.18 155)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Failed" fill="oklch(0.577 0.245 27.325)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
            <CardDescription>Overall payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.005 240)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: pieColors[idx] }}
                  />
                  <span className="text-muted-foreground">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
