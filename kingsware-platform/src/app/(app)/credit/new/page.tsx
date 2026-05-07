import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { NewDiligenceFlow } from './new-diligence-flow';

export default function NewDiligencePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="size-3.5" />
              工作台
            </Link>
            <span>/</span>
            <span className="text-foreground/80">新建尽调</span>
          </div>
          <h1 className="mt-1 font-display text-2xl tracking-tight">新建授信尽调</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            选择客户 → 16 个 Agent 协同 → 35-50 秒生成完整报告
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-ai-from/10 px-3 py-1.5 text-[12px] text-ai-from">
          <Sparkles className="size-3.5" />
          <span className="font-medium">SDAFI v2.0 · 5 阶段闭环</span>
        </div>
      </div>

      <NewDiligenceFlow />
    </div>
  );
}
