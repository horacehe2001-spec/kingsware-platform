'use client';

import { ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RoleGate } from '@/components/shared/role-gate';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RiskEvent } from '@/data/types';
import { formatRelativeTime } from '@/lib/format';
import { riskBgClass } from '@/lib/score';
import { cn } from '@/lib/utils';

const SOURCE_OPTIONS = [
  { value: 'all', label: '全部来源' },
  { value: '工商', label: '工商' },
  { value: '司法', label: '司法' },
  { value: '税务', label: '税务' },
  { value: '用电', label: '用电' },
  { value: '舆情', label: '舆情' },
  { value: '关联方', label: '关联方' },
  { value: '反欺诈', label: '反欺诈' },
  { value: '多头', label: '多头' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: '全部等级' },
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '关注' },
  { value: 'info', label: '提示' },
];

const STATE_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处置' },
  { value: 'acknowledged', label: '已处置' },
];

export function MonitorEventsTable({ events }: { events: RiskEvent[] }) {
  const [source, setSource] = useState('all');
  const [level, setLevel] = useState('all');
  const [state, setState] = useState('all');

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (source !== 'all' && e.source !== source) return false;
        if (level !== 'all' && e.level !== level) return false;
        if (state === 'pending' && e.acknowledged) return false;
        if (state === 'acknowledged' && !e.acknowledged) return false;
        return true;
      }),
    [events, source, level, state],
  );

  return (
    <>
      {/* 筛选行 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
        <Filter className="size-3.5 text-muted-foreground" />
        <Select value={source} onValueChange={(v) => setSource(v ?? 'all')}>
          <SelectTrigger size="sm" className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={(v) => setLevel(v ?? 'all')}>
          <SelectTrigger size="sm" className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={(v) => setState(v ?? 'all')}>
          <SelectTrigger size="sm" className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {filtered.length} / {events.length} 条
        </span>
      </div>

      {/* 表格 */}
      {filtered.length === 0 ? (
        <div className="px-4 py-12 text-center text-[12px] text-muted-foreground">
          没有匹配的预警事件
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[220px] pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                预警
              </TableHead>
              <TableHead className="w-[260px] text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                客户
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                描述
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                负责人
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                触发时间
              </TableHead>
              <TableHead className="w-[110px] text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((event) => (
              <TableRow key={event.id} className={cn(event.acknowledged && 'opacity-60')}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        riskBgClass(event.level),
                      )}
                    >
                      {event.level === 'critical'
                        ? '严重'
                        : event.level === 'warning'
                          ? '关注'
                          : '提示'}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {event.source}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12.5px] font-medium">{event.title}</p>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/credit/reports/${event.customerId}`}
                    className="text-[12px] font-medium hover:text-primary hover:underline"
                  >
                    {event.customerName}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {event.customerId}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </TableCell>
                <TableCell>
                  {event.assignee ? (
                    <span className="text-[12px]">{event.assignee}</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">未分配</span>
                  )}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(event.triggeredAt)}
                </TableCell>
                <TableCell className="text-right">
                  {event.acknowledged ? (
                    <StatusBadge status="approved" />
                  ) : (
                    <RoleGate
                      permission="report.reject"
                      fallback={
                        <span className="text-[10.5px] text-muted-foreground">
                          只读
                        </span>
                      }
                    >
                      <Button
                        size="xs"
                        variant="outline"
                        className="gap-0.5"
                        onClick={() => {
                          toast.success('已标记处置中', {
                            description: `${event.title} · 已派发给${event.assignee ?? '默认处置人'}`,
                          });
                        }}
                      >
                        立即处置
                        <ChevronRight className="size-3" />
                      </Button>
                    </RoleGate>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
