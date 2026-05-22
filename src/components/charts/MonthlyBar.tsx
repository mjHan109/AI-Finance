"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { tooltipContentStyle, tooltipLabelStyle } from "@/components/charts/ChartTooltip";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  data: MonthlyData[];
}

function formatYAxis(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}백만`;
  if (v >= 10000) return `${Math.floor(v / 10000)}만`;
  return `${v.toLocaleString()}`;
}


export function MonthlyBar({ data }: Props) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-3xl">📊</p>
        <p className="text-sm text-muted-foreground">거래 내역을 업로드하면 월별 차트가 나타나요</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%" barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString()}원`,
            name === "income" ? "수입" : "지출",
          ]}
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          cursor={false}
        />
        <Legend
          formatter={(v) => (v === "income" ? "수입" : "지출")}
          wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }}
        />
        <Bar dataKey="income"  fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
