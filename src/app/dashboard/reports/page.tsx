import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">리포트</h1>
        <p className="text-sm text-muted-foreground mt-0.5">월별 소비 패턴과 AI 인사이트를 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">월별 지출 트렌드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center space-y-2">
              <p className="text-4xl">📊</p>
              <p className="text-sm text-muted-foreground">거래 내역을 업로드하면<br />월별 차트가 표시돼요</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">카테고리 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center space-y-2">
              <p className="text-4xl">🥧</p>
              <p className="text-sm text-muted-foreground">어디에 가장 많이<br />썼는지 알 수 있어요</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>✨</span> AI 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center space-y-3">
              <p className="text-4xl">🤖</p>
              <p className="text-sm text-muted-foreground">AI가 소비 패턴을 분석해서 맞춤 조언을 제공해요</p>
              <Button size="sm" disabled>AI 분석 시작 (준비 중)</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
