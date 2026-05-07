import { Activity, Cpu, FileBarChart2, TrendingUp } from 'lucide-react';

import { AgentPerfChart } from '@/components/insights/agent-perf-chart';
import { GradeDistributionChart } from '@/components/insights/grade-distribution-chart';
import { IndustryDistributionChart } from '@/components/insights/industry-distribution-chart';
import { TrendChart } from '@/components/insights/trend-chart';
import { Card } from '@/components/ui/card';
import { LE_AGENTS, SP_AGENTS } from '@/data/agents';
import { ALL_CUSTOMERS } from '@/data/customers';

// ─── 派生数据：30 天日尽调量趋势（mock）────────────────
function generateDailyTrend(days = 30) {
  const today = new Date('2026-04-29');
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    // 趋势 + 随机抖动
    const base = 80 + Math.floor(i * 4);
    const noise = Math.floor(Math.random() * 30 - 15);
    const total = Math.max(40, base + noise);
    const passRate = Math.min(85, 65 + Math.floor(i * 0.4) + Math.floor(Math.random() * 6 - 3));
    return {
      date: `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
        .getDate()
        .toString()
        .padStart(2, '0')}`,
      total,
      passed: Math.round(total * (passRate / 100)),
      passRate,
    };
  });
}

// ─── 派生数据：评级分布 ────────────────────────────────
function buildGradeDistribution() {
  const acc = { A: 0, B: 0, C: 0, D: 0 };
  for (const c of ALL_CUSTOMERS) {
    if (c.creditGrade) acc[c.creditGrade]++;
  }
  return [
    { grade: 'A 优', count: acc.A, color: 'oklch(0.62 0.16 158)' },
    { grade: 'B 良', count: acc.B, color: 'oklch(0.6 0.18 245)' },
    { grade: 'C 中', count: acc.C, color: 'oklch(0.75 0.15 76)' },
    { grade: 'D 差', count: acc.D, color: 'oklch(0.6 0.22 22)' },
  ];
}

// ─── 派生数据：行业分布 ────────────────────────────────
function buildIndustryDistribution() {
  const counts = new Map<string, number>();
  for (const c of ALL_CUSTOMERS) {
    counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([industry, count]) => ({ industry, count }));
}

// ─── 派生数据：Agent 平均耗时（按 cycle_log 一致的形态）───
function buildAgentPerf() {
  const allAgents = [...LE_AGENTS, ...SP_AGENTS];
  return allAgents
    .filter((a) => a.stage >= 2 && a.stage <= 4) // 只看 Decide 阶段 Agent
    .map((a) => {
      // 按 stage 模拟一个均耗
      const stageBase: Record<number, number> = { 2: 18, 3: 8, 4: 6 };
      const baseSec = stageBase[a.stage] ?? 12;
      const jitter = Math.floor(Math.random() * 12 - 6);
      const avgMs = Math.max(2000, (baseSec + jitter) * 1000);
      return {
        agentId: a.id,
        name: a.name,
        avgMs,
        invocations: 100 + Math.floor(Math.random() * 800),
      };
    })
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 10);
}

export default function InsightsPage() {
  const trend = generateDailyTrend();
  const gradeDist = buildGradeDistribution();
  const industryDist = buildIndustryDistribution();
  const agentPerf = buildAgentPerf();

  const monthTotal = trend.reduce((s, d) => s + d.total, 0);
  const monthPassed = trend.reduce((s, d) => s + d.passed, 0);
  const avgPassRate = ((monthPassed / monthTotal) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      {/* 标题 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">数据看板</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            近 30 天授信尽调与 Agent 运行的关键指标
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          icon={<FileBarChart2 className="size-4" />}
          label="近 30 天报告"
          value={monthTotal.toLocaleString('zh-CN')}
          unit="份"
          tone="primary"
        />
        <KpiTile
          icon={<TrendingUp className="size-4" />}
          label="平均通过率"
          value={avgPassRate}
          unit="%"
          tone="grade-a"
        />
        <KpiTile
          icon={<Cpu className="size-4" />}
          label="Agent 调用"
          value={agentPerf.reduce((s, a) => s + a.invocations, 0).toLocaleString('zh-CN')}
          unit="次"
          tone="ai"
        />
        <KpiTile
          icon={<Activity className="size-4" />}
          label="活跃 Agent"
          value={(LE_AGENTS.length + SP_AGENTS.length).toString()}
          unit="个"
          tone="grade-b"
        />
      </div>

      {/* 双图：趋势 + 评级 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-0 lg:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">
              近 30 天尽调量与通过率
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              报告生成数 + 通过率 双轴折线
            </p>
          </header>
          <div className="px-2 py-3">
            <TrendChart data={trend} />
          </div>
        </Card>

        <Card className="p-0">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">评级分布</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">当前样本 ABCD 占比</p>
          </header>
          <div className="px-2 py-3">
            <GradeDistributionChart data={gradeDist} />
          </div>
        </Card>
      </div>

      {/* 双图：行业 + Agent 性能 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-0 lg:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">Agent 平均耗时 Top 10</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              D 阶段 L2 / L2.5 / L3 Agent 横向对比 · LE-A03 行业 RAG 通常居首
            </p>
          </header>
          <div className="px-2 py-3">
            <AgentPerfChart data={agentPerf} />
          </div>
        </Card>

        <Card className="p-0">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">行业分布</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              当前样本 Top 8 行业
            </p>
          </header>
          <div className="px-2 py-3">
            <IndustryDistributionChart data={industryDist} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone: 'primary' | 'ai' | 'grade-a' | 'grade-b';
}) {
  const cls = {
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
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-3xl tabular-nums leading-none">
              {value}
            </span>
            {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
          </div>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${cls}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
