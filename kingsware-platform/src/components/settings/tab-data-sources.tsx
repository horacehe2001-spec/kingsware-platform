'use client';

import { Activity, AlertCircle, CheckCircle2, Database, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ApiCategory {
  category: string;
  desc: string;
  count: number;
  todayCalls: number;
  errorRate: number; // 0-1
  avgLatencyMs: number;
  monthlyQuota: number;
  monthlyUsed: number;
}

const CATEGORIES: ApiCategory[] = [
  { category: '企业综合查询', desc: '工商登记 · 股权穿透 · 经营异常', count: 42, todayCalls: 2_840, errorRate: 0.001, avgLatencyMs: 280, monthlyQuota: 100_000, monthlyUsed: 56_840 },
  { category: '司法涉诉', desc: '失信被执行 · 限高 · 案件查询', count: 28, todayCalls: 1_650, errorRate: 0.002, avgLatencyMs: 320, monthlyQuota: 80_000, monthlyUsed: 42_180 },
  { category: '财税与发票', desc: '纳税信用 · 发票上下游 · 财务三表', count: 36, todayCalls: 2_240, errorRate: 0.003, avgLatencyMs: 460, monthlyQuota: 80_000, monthlyUsed: 51_220 },
  { category: '个人征信与多头', desc: '信用评分 · 借贷意向（细分版）· 多机构查询', count: 38, todayCalls: 1_950, errorRate: 0.001, avgLatencyMs: 220, monthlyQuota: 60_000, monthlyUsed: 38_400 },
  { category: '反欺诈与黑名单', desc: '银行卡涉赌涉诈 · 风险手机号 · 羊毛党检测', count: 32, todayCalls: 1_420, errorRate: 0.002, avgLatencyMs: 180, monthlyQuota: 60_000, monthlyUsed: 31_280 },
  { category: '资产与抵押', desc: '不动产 · 动产抵押 · 车辆 · 知识产权出质', count: 28, todayCalls: 580, errorRate: 0.005, avgLatencyMs: 640, monthlyQuota: 30_000, monthlyUsed: 12_440 },
  { category: '行业经营数据', desc: '用电 · 招聘 · 海关 · 招投标 · 烟草 · 电商', count: 48, todayCalls: 720, errorRate: 0.012, avgLatencyMs: 820, monthlyQuota: 30_000, monthlyUsed: 14_580 },
  { category: '经济能力预测', desc: '收入区间 · 消费能力 · 还款能力评分 · 银行卡特征', count: 24, todayCalls: 540, errorRate: 0.003, avgLatencyMs: 380, monthlyQuota: 25_000, monthlyUsed: 11_360 },
  { category: '其他辅助数据', desc: 'OCR · 婚姻 · 学历 · 社保 · 公积金', count: 45, todayCalls: 408, errorRate: 0.008, avgLatencyMs: 540, monthlyQuota: 30_000, monthlyUsed: 9_720 },
];

export function TabDataSources() {
  const [showKey, setShowKey] = useState(false);
  const totalApis = CATEGORIES.reduce((s, c) => s + c.count, 0);
  const totalCalls = CATEGORIES.reduce((s, c) => s + c.todayCalls, 0);

  return (
    <div className="grid gap-4">
      {/* 总览条 */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight">正菱（珠海）数据服务</h3>
              <p className="text-[11px] text-muted-foreground">
                {totalApis} 个接口 · 9 大类 · 今日调用 {totalCalls.toLocaleString('zh-CN')} 次
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">连接状态</p>
              <p className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                正常
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">月配额使用</p>
              <p className="font-mono text-[13px] font-semibold tabular-nums">
                52.4%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">综合成功率</p>
              <p className="font-mono text-[13px] font-semibold tabular-nums text-emerald-600">99.7%</p>
            </div>
          </div>
        </div>

        {/* API Key 行 */}
        <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
          <span className="shrink-0 text-[11px] text-muted-foreground">API Key</span>
          <Input
            readOnly
            value={showKey ? 'zheng-api-prod-2c5b8f9d4a1e7c6b3f2d8e0a9b4c1f5d2e8a7c3b' : 'zheng-api-prod-2c5b8f••••••••••••••••••••••••••••••a7c3b'}
            className="h-7 flex-1 font-mono text-[11px]"
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setShowKey((s) => !s)}>
            {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">轮换密钥</Button>
        </div>
      </Card>

      {/* 9 大类接口 */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <h3 className="text-[13px] font-semibold tracking-tight">接口分类（9 类 · 共 321 个）</h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((c, i) => {
            const usedPct = (c.monthlyUsed / c.monthlyQuota) * 100;
            const errorWarn = c.errorRate > 0.005;
            return (
              <div
                key={c.category}
                className={cn(
                  'border-b border-r border-border/40 p-4 transition-colors hover:bg-muted/20',
                  i === CATEGORIES.length - 1 && 'border-b-0',
                  (i % 3 === 2 || i === CATEGORIES.length - 1) && 'xl:border-r-0',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[12.5px] font-semibold">{c.category}</h4>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground line-clamp-1">{c.desc}</p>
                  </div>
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    {c.count} 接口
                  </span>
                </div>

                {/* 配额条 */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>月配额</span>
                    <span className="font-mono tabular-nums">
                      {c.monthlyUsed.toLocaleString('zh-CN')} / {c.monthlyQuota.toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all',
                        usedPct > 80 ? 'bg-amber-500' : 'bg-primary',
                      )}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>

                {/* 三个 mini stat */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10.5px]">
                  <div>
                    <p className="text-muted-foreground">今日调用</p>
                    <p className="font-mono font-semibold tabular-nums">{c.todayCalls.toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">平均耗时</p>
                    <p className="font-mono font-semibold tabular-nums">{c.avgLatencyMs}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">错误率</p>
                    <p className={cn(
                      'font-mono font-semibold tabular-nums',
                      errorWarn ? 'text-amber-600' : 'text-emerald-600',
                    )}>
                      {(c.errorRate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 自建数据资产 */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-violet-600" />
          <h3 className="text-[14px] font-semibold tracking-tight">自建数据资产（2 项）</h3>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          法人小微 LE-A03 + LE-A04 依赖；正菱接口未覆盖范围
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border/60 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <h4 className="text-[12.5px] font-semibold">行业 RAG 语料库</h4>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              服务于 LE-A03 行业经营 / 表 30/31 / 附录 E
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px]">
              <span className="font-mono text-muted-foreground">v2.6 · 2026-04 更新</span>
              <span className="font-mono tabular-nums font-semibold">
                72 行业 · 14,580 条研报
              </span>
            </div>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <h4 className="text-[12.5px] font-semibold">行业财务基准库</h4>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              服务于 LE-A04 财务诊断 / 表 55 横向对比
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px]">
              <span className="font-mono text-muted-foreground">v3.1 · 2026-03 更新</span>
              <span className="font-mono tabular-nums font-semibold">
                52,420 样本 · 24 子行业
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <AlertCircle className="size-3 text-amber-500" />
          个体户 SP-A01-A09 不依赖自建资产，纯接口调用
        </p>
      </Card>
    </div>
  );
}
