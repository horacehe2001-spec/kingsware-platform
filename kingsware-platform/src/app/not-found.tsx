import { Compass, Home } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * 全站兜底 not-found（路由完全无法匹配时）。
 * 段内更具体的 not-found（如报告详情）优先展示。
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Compass className="size-7" />
        </div>
        <h1 className="font-display text-2xl tracking-tight">页面走丢了</h1>
        <p className="text-[13px] text-muted-foreground">
          你访问的路径不存在。可能是输入错误，或链接已过期。
        </p>
        <Button
          render={<Link href="/dashboard" />}
          size="sm"
          className="mt-2 gap-1.5"
        >
          <Home className="size-3.5" />
          回到工作台
        </Button>
      </div>
    </div>
  );
}
