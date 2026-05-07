'use client';

import { ArrowRight, Database, FileText, GitMerge, Search, ShieldCheck, Workflow } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AuditTable {
  id: string;
  name: string;
  desc: string;
  rows: string;
  retention: string;
  icon: React.ReactNode;
  tone: 'primary' | 'ai' | 'amber' | 'emerald' | 'violet';
  sample: { col: string; val: string }[];
}

const TABLES: AuditTable[] = [
  {
    id: 'cycle_log',
    name: 'cycle_log',
    desc: 'SDAFI 一次决策周期的主表 · 每客户一条 · 关联所有下游',
    rows: '4,820',
    retention: '存续期 + 5 年',
    icon: <Workflow className="size-4" />,
    tone: 'primary',
    sample: [
      { col: 'cycle_id', val: 'cyc_20260429_001' },
      { col: 'customer_id', val: 'LE-2026-04-001' },
      { col: 'phase', val: 'completed' },
      { col: 'started_at', val: '2026-04-29T16:48:00Z' },
      { col: 'finished_at', val: '2026-04-29T16:50:30Z' },
      { col: 'duration_ms', val: '150,420' },
      { col: 'snapshot_id', val: 'snap_20260429_001' },
      { col: 'final_grade', val: 'B' },
      { col: 'critic_passed', val: 'true' },
    ],
  },
  {
    id: 'agent_signal_log',
    name: 'agent_signal_log',
    desc: '每个 Agent 的输入 / 输出 / 触发信号 · 因果链证据',
    rows: '78,460',
    retention: '存续期 + 5 年',
    icon: <GitMerge className="size-4" />,
    tone: 'ai',
    sample: [
      { col: 'cycle_id', val: 'cyc_20260429_001' },
      { col: 'agent_id', val: 'LE-A04' },
      { col: 'input_ref', val: 'pool://snap_001/finance' },
      { col: 'output_ref', val: 's3://reports/le-001/5.x' },
      { col: 'duration_ms', val: '12,348' },
      { col: 'api_calls', val: '12' },
      { col: 'tokens', val: '4,820' },
      { col: 'signal', val: 'risk:ar_140d' },
      { col: 'status', val: 'success' },
    ],
  },
  {
    id: 'data_pool_snapshot',
    name: 'data_pool_snapshot',
    desc: '原始接口返回的不可变快照 · 数据真实性证据',
    rows: '4,820',
    retention: '存续期 + 10 年',
    icon: <Database className="size-4" />,
    tone: 'violet',
    sample: [
      { col: 'snapshot_id', val: 'snap_20260429_001' },
      { col: 'cycle_id', val: 'cyc_20260429_001' },
      { col: 'frozen_at', val: '2026-04-29T16:48:42Z' },
      { col: 'storage_uri', val: 's3://snapshots/2026/04/29/' },
      { col: 'records_count', val: '92' },
      { col: 'size_bytes', val: '14.2 MB' },
      { col: 'sha256', val: '0x4f8b...c3ae' },
      { col: 'sealed', val: 'true' },
    ],
  },
  {
    id: 'write_log',
    name: 'write_log',
    desc: '业务库写入日志 · 仅 AC-01 可写 · 可按 cycle_id 回滚',
    rows: '4,820',
    retention: '存续期 + 5 年',
    icon: <FileText className="size-4" />,
    tone: 'emerald',
    sample: [
      { col: 'cycle_id', val: 'cyc_20260429_001' },
      { col: 'agent_id', val: 'AC-01' },
      { col: 'target_table', val: 'reports' },
      { col: 'target_id', val: 'rep_le_001' },
      { col: 'action', val: 'INSERT' },
      { col: 'rolled_back', val: 'false' },
      { col: 'docx_uri', val: 's3://reports/le-001.docx' },
      { col: 'pushed_to', val: 'wangyt@bank.cn' },
    ],
  },
  {
    id: 'improve_log',
    name: 'improve_log',
    desc: 'IM-01 季度模型改进 · 风控负责人审批留痕',
    rows: '24',
    retention: '存续期 + 10 年',
    icon: <ShieldCheck className="size-4" />,
    tone: 'amber',
    sample: [
      { col: 'improve_id', val: 'imp_2026Q2_003' },
      { col: 'agent_id', val: 'LE-A04' },
      { col: 'change_summary', val: '应收账款阈值 120→140 天' },
      { col: 'evidence', val: '50 户回测 · KS +0.04' },
      { col: 'approved_by', val: '张志远（风控总监）' },
      { col: 'approved_at', val: '2026-04-15T10:32Z' },
      { col: 'rolled_out', val: '2026-05-01' },
    ],
  },
];

const toneClass = (t: AuditTable['tone']) => ({
  primary: 'bg-primary/10 text-primary border-primary/30',
  ai: 'bg-ai-from/10 text-ai-from border-ai-from/30',
  amber: 'bg-amber-50 text-amber-700 border-amber-300',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  violet: 'bg-violet-50 text-violet-700 border-violet-300',
})[t];

export function TabAudit() {
  const [query, setQuery] = useState('');
  const [activeTable, setActiveTable] = useState<string>('cycle_log');
  const active = TABLES.find((t) => t.id === activeTable)!;

  return (
    <div className="grid gap-4">
      {/* 监管现场应答 */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight">监管现场应答 · cycle_id 反查</h3>
              <p className="text-[11px] text-muted-foreground">
                输入 cycle_id 或客户编号 · 30 秒还原完整证据链（5 张审计表 JOIN）
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cyc_20260429_001 或 LE-2026-04-001"
                className="h-9 pl-8 font-mono text-[12px]"
              />
            </div>
            <Button className="gap-1.5">
              反查证据链
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 5 张审计表 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TABLES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTable(t.id)}
            className={cn(
              'group flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-all',
              activeTable === t.id
                ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30'
                : 'border-border hover:border-primary/40 hover:shadow-sm',
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex size-8 items-center justify-center rounded-md border', toneClass(t.tone))}>
                {t.icon}
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{t.rows} 行</span>
            </div>
            <div>
              <p className="font-mono text-[12px] font-semibold">{t.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[10.5px] text-muted-foreground">{t.desc}</p>
            </div>
            <p className="text-[10px] text-muted-foreground/80">保留 · {t.retention}</p>
          </button>
        ))}
      </div>

      {/* 选中表的样本数据 */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={cn('flex size-7 items-center justify-center rounded-md border', toneClass(active.tone))}>
              {active.icon}
            </div>
            <div>
              <h3 className="font-mono text-[13px] font-semibold">{active.name}</h3>
              <p className="text-[10.5px] text-muted-foreground">最新一行示例</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">导出全表（CSV）</Button>
        </div>
        <table className="w-full text-[11.5px]">
          <thead className="bg-muted/30">
            <tr>
              <th className="w-1/3 px-4 py-2 text-left font-medium text-muted-foreground">字段</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">值</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {active.sample.map((row) => (
              <tr key={row.col} className="hover:bg-muted/20">
                <td className="px-4 py-2 font-mono">{row.col}</td>
                <td className="px-4 py-2 font-mono text-foreground/80">{row.val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 操作日志（用户行为审计） */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-[14px] font-semibold tracking-tight">用户操作日志（最近 24h）</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">所有用户的关键操作 · 不可篡改</p>
        </div>
        <ul className="divide-y divide-border/40 font-mono text-[11px]">
          <OpRow time="刚刚" user="王雅婷" role="授信审批官" action="批准" target="LE-2026-04-001 (FR-2026-04-001)" />
          <OpRow time="3 分钟前" user="李文博" role="客户经理" action="新建尽调" target="SP-2026-04-008" />
          <OpRow time="12 分钟前" user="张志远" role="风控总监" action="审计访问" target="cycle_log · cyc_20260422_006" />
          <OpRow time="28 分钟前" user="陈佩琪" role="合规审计" action="导出审计表" target="agent_signal_log · 2026-04 全月" />
          <OpRow time="1 小时前" user="李文博" role="客户经理" action="重新生成报告" target="LE-2026-04-008" />
          <OpRow time="2 小时前" user="杨敬业" role="授信审批官" action="否决" target="LE-2026-04-006 (一票否决触发)" />
          <OpRow time="3 小时前" user="张志远" role="风控总监" action="审批模型改进" target="imp_2026Q2_003 · LE-A04 阈值调整" />
        </ul>
      </Card>
    </div>
  );
}

function OpRow({ time, user, role, action, target }: { time: string; user: string; role: string; action: string; target: string }) {
  const isApprove = action === '批准';
  const isReject = action === '否决';
  return (
    <li className="flex items-center gap-2 px-4 py-2">
      <span className="w-24 shrink-0 text-muted-foreground">{time}</span>
      <span className="w-20 shrink-0 font-semibold">{user}</span>
      <span className="w-24 shrink-0 text-muted-foreground">{role}</span>
      <span className={cn(
        'w-24 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-medium',
        isApprove ? 'bg-emerald-50 text-emerald-700' :
        isReject ? 'bg-rose-50 text-rose-700' :
        'bg-muted text-muted-foreground',
      )}>
        {action}
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground/80">{target}</span>
    </li>
  );
}
