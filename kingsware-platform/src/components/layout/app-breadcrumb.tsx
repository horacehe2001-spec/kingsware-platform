'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getCustomerById } from '@/data/customers';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: '工作台',
  customers: '客户与批次',
  batches: '批次任务',
  acquisition: '批量获客',
  credit: '智能征信',
  reports: '报告',
  monitor: '贷中贷后风控',
  agents: 'Agent 工作台',
  industry: '行业分析 Agent',
  audit: '合规审计',
  insights: '数据看板',
  settings: '系统管理',
};

/**
 * 把路径段翻译成中文标签：
 * 1. 静态段查 ROUTE_LABELS
 * 2. 动态 ID 段（如 /credit/reports/LE-2026-04-001）查实际客户名
 * 3. 都查不到时回退到原始 segment
 */
function labelForSegment(seg: string, prevSeg: string | undefined): string {
  if (ROUTE_LABELS[seg]) return ROUTE_LABELS[seg];

  // 报告详情页：/credit/reports/[id]，把 id 翻成客户名
  if (prevSeg === 'reports') {
    const customer = getCustomerById(seg);
    if (customer) return customer.name;
  }

  return seg;
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-[12px] text-muted-foreground">
      <Link href="/dashboard" className="transition-colors hover:text-foreground">
        首页
      </Link>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const label = labelForSegment(seg, segments[idx - 1]);
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="size-3 opacity-50" />
            {isLast ? (
              <span
                className="max-w-[280px] truncate font-medium text-foreground"
                title={label}
              >
                {label}
              </span>
            ) : (
              <Link href={href} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
