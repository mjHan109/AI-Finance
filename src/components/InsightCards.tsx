import type { Insight, InsightSeverity } from "@/modules/insights/deterministic";

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; bg: string; iconBg: string; text: string }
> = {
  alert: {
    border:  "border-red-500/40",
    bg:      "bg-red-500/5",
    iconBg:  "bg-red-500/10",
    text:    "text-red-400",
  },
  warning: {
    border:  "border-amber-500/40",
    bg:      "bg-amber-500/5",
    iconBg:  "bg-amber-500/10",
    text:    "text-amber-400",
  },
  info: {
    border:  "border-blue-500/40",
    bg:      "bg-blue-500/5",
    iconBg:  "bg-blue-500/10",
    text:    "text-blue-400",
  },
  positive: {
    border:  "border-emerald-500/40",
    bg:      "bg-emerald-500/5",
    iconBg:  "bg-emerald-500/10",
    text:    "text-emerald-400",
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const styles = SEVERITY_STYLES[insight.severity];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3.5 ${styles.border} ${styles.bg}`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base leading-none ${styles.iconBg}`}
        aria-hidden="true"
      >
        {insight.icon}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground leading-snug">
          {insight.message}
        </p>
        {insight.recommendation && (
          <p className="text-xs text-muted-foreground leading-snug">
            {insight.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

interface InsightCardsProps {
  insights: Insight[];
}

export function InsightCards({ insights }: InsightCardsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <span aria-hidden="true">💡</span>
        이번 달 인사이트
      </h2>
      <div className="space-y-2">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
