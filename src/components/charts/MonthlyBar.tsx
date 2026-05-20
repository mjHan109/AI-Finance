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

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  data: MonthlyData[];
}

function formatKRW(v: number) {
  if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString()}만`;
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
          tickFormatter={formatKRW}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString()}원`,
            name === "income" ? "수입" : "지출",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(v) => (v === "income" ? "수입" : "지출")}
          wrapperStyle={{ fontSize: "12px" }}
        />
        <Bar dataKey="income" fill="#34D399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#F87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
