import { ArrowRight, Building2, Store } from 'lucide-react';
import Link from 'next/link';

import { ScoreBadge } from '@/components/shared/score-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Customer } from '@/data/types';
import { formatAmount, formatRelativeTime } from '@/lib/format';

interface CustomerTableProps {
  rows: Customer[];
}

export function CustomerTable({ rows }: CustomerTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[280px] pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              客户
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              行业 / 区域
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              申请
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              评分
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              状态
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              客户经理
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              更新
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isLE = row.type === 'legal-entity';
            const subtitle = isLE
              ? `法人代表 ${row.legalRepresentative}`
              : `经营者 ${row.ownerName} · ${row.shopType}`;
            return (
              <TableRow key={row.id} className="group">
                <TableCell className="py-3 pl-4">
                  <Link
                    href={`/credit/reports/${row.id}`}
                    className="flex items-start gap-3 hover:text-primary"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${
                        isLE
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-grade-c/20 bg-grade-c-bg text-grade-c'
                      }`}
                    >
                      {isLE ? <Building2 className="size-4" /> : <Store className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-tight">{row.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {subtitle}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                        {row.unifiedSocialCreditCode}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-[12px]">
                  <p className="font-medium">{row.industry}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{row.region}</p>
                </TableCell>
                <TableCell>
                  <p className="font-mono text-[13px] font-semibold tabular-nums">
                    {formatAmount(row.appliedAmount)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.appliedProduct}
                  </p>
                </TableCell>
                <TableCell>
                  <ScoreBadge grade={row.creditGrade} score={row.creditScore} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-[12px]">
                  <p>{row.manager}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{row.branch}</p>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(row.updatedAt)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/credit/reports/${row.id}`}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
