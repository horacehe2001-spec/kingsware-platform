import { Database, FileSearch, History, KeyRound, ShieldCheck } from 'lucide-react';

import { AuditTabs } from '@/components/audit/audit-tabs';
import { Card } from '@/components/ui/card';
import {
  AGENT_SIGNAL_LOG,
  CYCLE_LOG,
  DATA_SNAPSHOTS,
  IMPROVE_LOG,
} from '@/data/audit';

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">合规审计</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            SDAFI 五张审计表 · 决策可重现 · 30 秒可查 · 等保 2.0 三级
          </p>
        </div>
      </div>

      {/* SDAFI 审计核心说明 */}
      <Card className="ai-gradient-border relative overflow-hidden p-5">
        <div className="absolute right-0 top-0 size-40 rounded-full bg-ai-from/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg ai-gradient text-white shadow-md">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              附录是审计表的视图，不是 Agent 内容拼接
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              报告附录 A / C / D / E / F 由 SQL 自动从这 5 张表渲染。任何客户决策依据均可在
              30 秒内反查。模型改动留痕，谁批的、何时上线一目了然。
            </p>
          </div>
        </div>
      </Card>

      {/* 概览卡 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <OverviewCard
          icon={<History className="size-3.5" />}
          label="cycle_log"
          value={CYCLE_LOG.length.toString()}
          sub="Agent 运行轨迹"
        />
        <OverviewCard
          icon={<KeyRound className="size-3.5" />}
          label="agent_signal_log"
          value={AGENT_SIGNAL_LOG.length.toString()}
          sub="授权 / Critic / 否决信号"
        />
        <OverviewCard
          icon={<FileSearch className="size-3.5" />}
          label="improve_log"
          value={IMPROVE_LOG.length.toString()}
          sub="模型改动 + 人审批"
        />
        <OverviewCard
          icon={<Database className="size-3.5" />}
          label="device_pool"
          value={DATA_SNAPSHOTS.filter((s) => s.pool === 'device_pool').length.toString()}
          sub="数据池快照"
        />
        <OverviewCard
          icon={<Database className="size-3.5" />}
          label="revenue_pool"
          value={DATA_SNAPSHOTS.filter((s) => s.pool === 'revenue_pool').length.toString()}
          sub="财务快照"
        />
      </div>

      {/* 五张表 */}
      <AuditTabs
        cycleLog={CYCLE_LOG}
        signalLog={AGENT_SIGNAL_LOG}
        improveLog={IMPROVE_LOG}
        snapshots={DATA_SNAPSHOTS}
      />
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <span className="text-muted-foreground/60">{icon}</span>
        <span className="font-mono">{label}</span>
      </div>
      <div className="mt-1.5 font-display text-2xl tabular-nums leading-none">
        {value}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
