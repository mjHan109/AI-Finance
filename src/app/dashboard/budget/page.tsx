import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BudgetPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">예산</h1>
        <p className="text-sm text-muted-foreground mt-0.5">카테고리별 예산을 설정하고 지출을 관리하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">이번 달 예산</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center space-y-3">
            <p className="text-4xl">🎯</p>
            <p className="text-sm text-muted-foreground">아직 예산이 설정되지 않았어요</p>
            <p className="text-xs text-muted-foreground/70">거래 내역을 업로드하면 카테고리별 예산 설정이 가능해요</p>
            <Button size="sm" className="mt-1" disabled>예산 설정하기 (준비 중)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
