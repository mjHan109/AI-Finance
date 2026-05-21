"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-5xl">😵</div>
        <h1 className="text-xl font-bold text-foreground">문제가 발생했어요</h1>
        <p className="text-sm text-muted-foreground">
          일시적인 오류입니다. 잠시 후 다시 시도해주세요.
        </p>
        <Button onClick={reset} size="sm">다시 시도</Button>
      </div>
    </div>
  );
}
