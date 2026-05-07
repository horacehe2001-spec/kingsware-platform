'use client';

import { AlertOctagon, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * (app) 段错误兜底。
 * Server Component fetch 失败、Client Component 渲染异常都会落到这里。
 * 用户能选择重试当前页或回工作台。
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 真实环境应上报到 Sentry / 后端日志
    console.error('[AppError]', error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertOctagon className="size-6" />
      </div>
      <h2 className="font-display text-xl tracking-tight">页面加载出错了</h2>
      <p className="max-w-md text-[13px] text-muted-foreground">
        服务返回错误或网络异常。已自动记录此问题；你可以重试或返回工作台。
      </p>
      {error.digest && (
        <p className="font-mono text-[10.5px] text-muted-foreground/60">
          错误码 {error.digest}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          重试
        </Button>
        <Button render={<Link href="/dashboard" />} size="sm" variant="outline">
          回到工作台
        </Button>
      </div>
    </Card>
  );
}
