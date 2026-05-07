import { ArrowUpRight, Bot, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { AgentOverview } from '@/components/dashboard/agent-overview';
import { ApprovalTrend } from '@/components/dashboard/approval-trend';
import { GradeDistribution } from '@/components/dashboard/grade-distribution';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RiskEvents } from '@/components/dashboard/risk-events';
import { TodoList } from '@/components/dashboard/todo-list';
import { RoleGate } from '@/components/shared/role-gate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchDashboard } from '@/lib/api';

export default async function DashboardPage() {
  const { kpi, todos, activity, riskEvents } = await fetchDashboard();
  // 仅"成本"那张卡需要倒置 delta 颜色
  const invertKeys = new Set(['avg-cost', 'pending-review']);

  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">工作台</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            李文博 · 授信审批官 · 广州天河支行 · 今日 2026-04-29 周三
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bot className="size-3.5" />
            Agent 工作台
          </Button>
          <RoleGate permission="dashboard.create-diligence">
            <Link
              href="/credit/new"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              新建尽调
            </Link>
          </RoleGate>
        </div>
      </div>

      {/* AI 引导横幅 */}
      <Card className="ai-gradient-border relative overflow-hidden p-5">
        <div className="absolute right-0 top-0 size-40 rounded-full bg-ai-from/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg ai-gradient text-white shadow-md">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              今日 26 个 Agent 已为你完成 <span className="ai-gradient-text">187 份尽调报告</span>
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              单户成本 256 元，比传统模式下降 91.5% · 平均生成时长 8 分 12 秒
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <Link
              href="/agents"
              className="inline-flex items-center gap-1 font-medium text-ai-from hover:underline"
            >
              查看 Agent 工作台
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI 网格 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpi.map((m) => (
          <KpiCard key={m.key} metric={m} invertDelta={invertKeys.has(m.key)} />
        ))}
      </div>

      {/* Agent 协作矩阵（核心卖点）+ 信用等级分布 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AgentOverview />
        </div>
        <div className="lg:col-span-4">
          <GradeDistribution />
        </div>
      </div>

      {/* 审批趋势 + 待办 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ApprovalTrend />
        </div>
        <div className="lg:col-span-4">
          <TodoList items={todos} />
        </div>
      </div>

      {/* 活动流 + 风险事件 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ActivityFeed events={activity} />
        </div>
        <div className="lg:col-span-6">
          <RiskEvents events={riskEvents} />
        </div>
      </div>
    </div>
  );
}
