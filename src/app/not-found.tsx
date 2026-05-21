import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-5xl">🍇</div>
        <h1 className="text-xl font-bold text-foreground">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link href="/dashboard">
          <Button size="sm">대시보드로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
