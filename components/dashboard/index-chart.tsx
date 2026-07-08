"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function IndexChart({
  data,
  positive,
}: {
  data: { t: string; price: number }[]
  positive: boolean
}) {
  const color = positive ? "var(--bull)" : "var(--bear)"
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="indexFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          orientation="right"
          domain={["auto", "auto"]}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => Number(v).toLocaleString("en-IN")}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          formatter={(v: number) => [Number(v).toLocaleString("en-IN"), "Price"]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill="url(#indexFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
