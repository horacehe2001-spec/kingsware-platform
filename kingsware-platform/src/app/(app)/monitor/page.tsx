import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
} from 'lucide-react';

import { MonitorEventsTable } from '@/components/monitor/monitor-events-table';
import { Card } from '@/components/ui/card';
import { fetchDashboard } from '@/lib/api';

export default async function MonitorPage() {
  const { riskEvents } = await fetchDashboard();

  const critical = riskEvents.filter((e) => e.level === 'critical').length;
  const warning = riskEvents.filter((e) => e.level === 'warning').length;
  const info = riskEvents.filter((e) => e.level === 'info').length;
  const acknowledged = riskEvents.filter((e) => e.acknowledged).length;
  const pending = riskEvents.length - acknowledged;

  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">贷中贷后风控</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            事件驱动监控 · 30+ 维度 · FB-01 持续回写 + IM-01 季度治理
          </p>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Eye className="size-4" />}
          label="监控中客户"
          value="187"
          sub="覆盖法人 + 个体户两套规则"
          tone="primary"
        />
        <StatCard
          icon={<ShieldAlert className="size-4" />}
          label="严重预警（红灯）"
          value={critical.toString()}
          sub="需 24h 内处置"
          tone="critical"
        />
        <StatCard
          icon={<AlertTriangle className="size-4" />}
          label="关注预警（黄灯）"
          value={warning.toString()}
          sub="7 工作日跟进"
          tone="warning"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="本月新增"
          value={(critical + warning + info).toString()}
          sub={`已处置 ${acknowledged} / 待处置 ${pending}`}
          tone="info"
        />
      </div>

      {/* SDAFI 闭环说明 */}
      <Card className="ai-gradient-border relative overflow-hidden p-5">
        <div className="absolute right-0 top-0 size-40 rounded-full bg-ai-from/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg ai-gradient text-white shadow-md">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              FB-01 → IM-01 闭环驱动模型治理
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              每条预警都写入 feedback_log；季度由 IM-01
              统计偏差触发模型权重调整（需风控负责人审批）。失联事件是个体户场景的核心反馈源。
            </p>
          </div>
        </div>
      </Card>

      {/* 预警表格 */}
      <Card className="p-0">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">预警事件清单</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            按触发时间倒序 · 来源覆盖工商 / 司法 / 税务 / 用电 / 舆情 / 关联方 / 反欺诈 / 多头
          </p>
        </div>
        <MonitorEventsTable events={riskEvents} />
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'primary' | 'critical' | 'warning' | 'info';
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    critical: 'bg-grade-d-bg text-grade-d',
    warning: 'bg-grade-c-bg text-grade-c',
    info: 'bg-grade-a-bg text-grade-a',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 font-display text-3xl tabular-nums leading-none">
            {value}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${toneClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
