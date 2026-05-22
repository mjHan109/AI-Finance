"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { tooltipContentStyle } from "@/components/charts/ChartTooltip";

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  amount: number;
}

interface Props {
  data: CategoryData[];
}

function formatKRW(v: number) {
  if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
}

export function CategoryDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-3xl">🥧</p>
        <p className="text-sm text-muted-foreground">거래 내역을 업로드하면 카테고리 차트가 나타나요</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="amount"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatKRW(Number(value)), "지출"]}
            contentStyle={tooltipContentStyle}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-sm text-foreground flex-1">
              {d.icon} {d.name}
            </span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {formatKRW(d.amount)}
            </span>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {total > 0 ? Math.round((d.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
