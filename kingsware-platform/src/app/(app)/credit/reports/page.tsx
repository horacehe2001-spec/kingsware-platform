import { FileSearch, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';

export default function CreditReportsIndex() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">智能征信报告</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            选择一条报告查看详情 · 或通过客户列表进入
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          title="广州东海智能装备有限公司"
          subtitle="FR-2026-04-001 · B 级 · 800 万"
          href="/credit/reports/LE-2026-04-001"
          badge="法人"
        />
        <QuickLink
          title="南宁锦绣餐饮店"
          subtitle="SR-2026-04-003 · B 级 · 25 万"
          href="/credit/reports/SP-2026-04-003"
          badge="个体户"
        />
        <QuickLink
          title="浏览客户列表"
          subtitle="从客户列表选择任一条报告"
          href="/customers"
          badge="全部"
        />
      </div>
    </div>
  );
}

function QuickLink({
  title,
  subtitle,
  href,
  badge,
}: {
  title: string;
  subtitle: string;
  href: string;
  badge: string;
}) {
  return (
    <Link href={href}>
      <Card className="group p-4 transition-all hover:border-primary/40 hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md ai-gradient text-white">
            <FileSearch className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold group-hover:text-primary">
              {title}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <span className="rounded bg-ai-from/10 px-1.5 py-0.5 text-[10px] font-semibold text-ai-from">
            {badge}
          </span>
        </div>
      </Card>
    </Link>
  );
}
