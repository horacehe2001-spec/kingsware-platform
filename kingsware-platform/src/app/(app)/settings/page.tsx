import {
  Bell,
  Bot,
  Database,
  Heart,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from 'lucide-react';

import { TabAccount } from '@/components/settings/tab-account';
import { TabAudit } from '@/components/settings/tab-audit';
import { TabDataSources } from '@/components/settings/tab-data-sources';
import { TabModels } from '@/components/settings/tab-models';
import { TabNotifications } from '@/components/settings/tab-notifications';
import { TabSystemHealth } from '@/components/settings/tab-system-health';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">系统管理</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            账户、模型、数据接口、系统健康、审计日志与通知 · 平台运维一体化控制台
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-[12px]">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-medium text-emerald-700">系统运行正常</span>
          <span className="text-emerald-600/80">· 已连续运行 12 天 4 小时</span>
        </div>
      </div>

      {/* 顶部 KPI 概览 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <OverviewStat
          icon={<Sparkles className="size-4" />}
          label="DeepSeek 调用"
          value="348"
          unit="次 / 今日"
          sub="配额剩余 4,652 / 5,000"
          tone="ai"
        />
        <OverviewStat
          icon={<Database className="size-4" />}
          label="正菱接口调用"
          value="12,348"
          unit="次 / 今日"
          sub="321 个接口在线 · 99.7% 成功率"
          tone="primary"
        />
        <OverviewStat
          icon={<Bot className="size-4" />}
          label="Agent 实例"
          value="30"
          unit="个在线"
          sub="法人 16 + 个体户 14"
          tone="grade-a"
        />
        <OverviewStat
          icon={<UserCircle className="size-4" />}
          label="活跃用户"
          value="8"
          unit="/ 32"
          sub="授信审批 / 客户经理 / 风控 / 合规"
          tone="grade-b"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="account">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="account" className="gap-1.5 px-3">
            <UserCircle className="size-3.5" />
            账户与角色
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5 px-3">
            <Sparkles className="size-3.5" />
            模型管理
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5 px-3">
            <Database className="size-3.5" />
            数据接口
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 px-3">
            <Heart className="size-3.5" />
            系统健康
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 px-3">
            <ScrollText className="size-3.5" />
            审计日志
          </TabsTrigger>
          <TabsTrigger value="notify" className="gap-1.5 px-3">
            <Bell className="size-3.5" />
            通知与集成
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <TabAccount />
        </TabsContent>
        <TabsContent value="models" className="mt-4">
          <TabModels />
        </TabsContent>
        <TabsContent value="data" className="mt-4">
          <TabDataSources />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <TabSystemHealth />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <TabAudit />
        </TabsContent>
        <TabsContent value="notify" className="mt-4">
          <TabNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewStat({
  icon,
  label,
  value,
  unit,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
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
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
            <span className="text-[11px] text-muted-foreground">{unit}</span>
          </div>
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground/90">{sub}</p>
        </div>
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
