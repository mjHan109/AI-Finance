import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export interface HealthData {
  score: number;
  level: "excellent" | "good" | "fair" | "poor";
  levelLabel: string;
  savingsRate: number | null;
  overBudgetCount: number;
  totalBudget: number;
  tips: string[];
}

const LEVEL_COLORS = {
  excellent: { ring: "#34d399", text: "text-emerald-400", bg: "bg-emerald-400" },
  good:      { ring: "#60a5fa", text: "text-blue-400",    bg: "bg-blue-400" },
  fair:      { ring: "#fbbf24", text: "text-amber-400",   bg: "bg-amber-400" },
  poor:      { ring: "#f87171", text: "text-red-400",     bg: "bg-red-400" },
};

export function FinancialHealthCard({ data }: { data: HealthData }) {
  const colors = LEVEL_COLORS[data.level];
  const r = 28, circumference = 2 * Math.PI * r;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck size={15} className={colors.text} />
          재정 건강 점수
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          {/* 원형 게이지 */}
          <div className="relative shrink-0 w-16 h-16">
            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="32" cy="32" r={r} fill="none"
                stroke={colors.ring} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold tabular-nums ${colors.text}`}>{data.score}</span>
            </div>
          </div>

          {/* 레이블 + 지표 */}
          <div className="flex-1 space-y-1.5">
            <p className={`text-base font-bold ${colors.text}`}>{data.levelLabel}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {data.savingsRate !== null && (
                <span className="text-xs text-muted-foreground">
                  저축률 <span className="font-medium text-foreground">{data.savingsRate}%</span>
                </span>
              )}
              {data.totalBudget > 0 && (
                <span className="text-xs text-muted-foreground">
                  예산 초과 <span className={`font-medium ${data.overBudgetCount > 0 ? "text-destructive" : "text-foreground"}`}>
                    {data.overBudgetCount}개
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 팁 */}
        {data.tips.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
            {data.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
