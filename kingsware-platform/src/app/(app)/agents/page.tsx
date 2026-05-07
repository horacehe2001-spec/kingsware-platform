import { Activity, Cpu, GitBranch, Layers, Sparkles } from 'lucide-react';

import { AgentTimeline } from '@/components/agents/agent-timeline';
import { AgentsBrowser } from '@/components/agents/agents-browser';
import { Card } from '@/components/ui/card';
import { fetchAgents } from '@/lib/api';

const STAGE_NAMES: Record<number, string> = {
  1: 'L0 编排',
  2: 'L2 章节分析',
  3: 'L2.5 横向分析',
  4: 'L3 决策与质检',
  5: 'Act 报告组装',
  6: '闭环 Feedback / Improve',
};

export default async function AgentsPage() {
  const [le, sp] = await Promise.all([fetchAgents('LE'), fetchAgents('SP')]);

  const totalAgents = le.agents.length + sp.agents.length;
  const stages = Object.keys(STAGE_NAMES).length;
  const totalDeps =
    le.agents.reduce((s, a) => s + a.dependencies.length, 0) +
    sp.agents.reduce((s, a) => s + a.dependencies.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Agent 工作台</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            智慧信贷平台共 {totalAgents} 个 Agent · 基于 SDAFI v2.0 架构 · L0→L3 五层协同
          </p>
        </div>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Cpu className="size-4" />}
          label="Agent 总数"
          value={totalAgents.toString()}
          sub={`法人 ${le.agents.length} + 个体户 ${sp.agents.length}`}
          tone="primary"
        />
        <StatCard
          icon={<Layers className="size-4" />}
          label="协同层级"
          value={stages.toString()}
          sub="L0 / L2 / L2.5 / L3 / Act / 闭环"
          tone="ai"
        />
        <StatCard
          icon={<GitBranch className="size-4" />}
          label="依赖关系"
          value={totalDeps.toString()}
          sub="跨 Agent 数据池协作"
          tone="grade-b"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="数据接口"
          value="321"
          sub="正菱（珠海）数据服务"
          tone="grade-a"
        />
      </div>

      {/* AI 横幅 */}
      <Card className="ai-gradient-border relative overflow-hidden p-5">
        <div className="absolute right-0 top-0 size-40 rounded-full bg-ai-from/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg ai-gradient text-white shadow-md">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              SDAFI 五阶段闭环 ·{' '}
              <span className="ai-gradient-text">Sense → Decide → Act → Feedback → Improve</span>
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              每个 Agent 内部完整跑五阶段；L0→L3 是 Agent 间横向调度的两个互补视角。点卡片查看详情。
            </p>
          </div>
        </div>
      </Card>

      {/* Agent 协作时序甘特图 */}
      <AgentTimeline />

      {/* Agent 浏览器 */}
      <AgentsBrowser leAgents={le.agents} spAgents={sp.agents} stageNames={STAGE_NAMES} />
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
  tone: 'primary' | 'ai' | 'grade-a' | 'grade-b';
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    ai: 'bg-ai-from/10 text-ai-from',
    'grade-a': 'bg-grade-a-bg text-grade-a',
    'grade-b': 'bg-grade-b-bg text-grade-b',
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
