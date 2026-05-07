import { ChevronRight, FileText, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { ReportSection } from '@/data/types';
import { cn } from '@/lib/utils';

export function SectionList({ sections }: { sections: ReportSection[] }) {
  // 按"第 N 部分"分组
  const grouped: Record<string, ReportSection[]> = {};
  for (const s of sections) {
    const part = s.number.split('.')[0];
    if (!grouped[part]) grouped[part] = [];
    grouped[part].push(s);
  }
  const aiCount = sections.filter((s) => s.agentGenerated).length;

  return (
    <Card className="p-0">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <FileText className="size-4 text-primary" />
            报告章节列表
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>共 {sections.length} 节</span>
            <span className="inline-flex items-center gap-1 rounded bg-ai-from/10 px-1.5 py-0.5 font-semibold text-ai-from">
              <Sparkles className="size-3" />
              {aiCount} 节 AI 生成
            </span>
          </div>
        </div>
      </header>
      <div className="space-y-0">
        {Object.entries(grouped).map(([part, secs]) => (
          <div key={part}>
            <div className="border-b border-border/40 bg-muted/30 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              第 {part} 部分
            </div>
            <ul className="divide-y divide-border/40">
              {secs.map((s) => (
                <li
                  key={s.number}
                  className="group flex items-start gap-3 px-4 py-2.5 text-[12.5px] transition-colors hover:bg-muted/30"
                >
                  <span className="w-12 shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">
                    {s.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium leading-tight">{s.title}</span>
                      {s.agentGenerated && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                            'bg-ai-from/10 text-ai-from',
                          )}
                        >
                          <Sparkles className="size-2.5" />
                          {s.agentId}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {s.contentPreview}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
