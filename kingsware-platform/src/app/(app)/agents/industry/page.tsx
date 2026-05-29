'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Database,
  DatabaseZap,
  Factory,
  FileSearch,
  Loader2,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_PRICING_MODEL,
  formatCNY,
  getPricing,
} from '@/lib/agents/deepseek-pricing';
import type {
  CostBreakdown,
  IndustryAgentOutput,
  IndustryPolicy,
  ProsperityLabel,
  RagStatus,
  TokenUsage,
} from '@/lib/agents/industry-agent';
import { cn } from '@/lib/utils';

const TOKEN_STATS_KEY = 'kw-industry-agent-token-stats';

interface CumulativeStats {
  runs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

const ZERO_STATS: CumulativeStats = {
  runs: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cacheHitTokens: 0,
  cacheMissTokens: 0,
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
};

function accumulate(c: CumulativeStats, usage: TokenUsage, cost: CostBreakdown): CumulativeStats {
  return {
    runs: c.runs + 1,
    promptTokens: c.promptTokens + usage.promptTokens,
    completionTokens: c.completionTokens + usage.completionTokens,
    totalTokens: c.totalTokens + usage.totalTokens,
    cacheHitTokens: c.cacheHitTokens + usage.cacheHitTokens,
    cacheMissTokens: c.cacheMissTokens + usage.cacheMissTokens,
    inputCost: c.inputCost + cost.inputCost,
    outputCost: c.outputCost + cost.outputCost,
    totalCost: c.totalCost + cost.totalCost,
  };
}

const QUICK_PICKS: Array<{ code: string; name: string }> = [
  { code: 'C3611', name: '汽车整车制造' },
  { code: 'C35', name: '专用设备制造业' },
  { code: 'C16', name: '烟草制品业' },
  { code: 'F5223', name: '烟草制品零售' },
  { code: 'H6210', name: '正餐服务' },
  { code: 'I65', name: '软件和信息技术服务业' },
  { code: 'E47', name: '房屋建筑业' },
  { code: 'C27', name: '医药制造业' },
];

interface FormState {
  industryCode: string;
  industryName: string;
  mock: boolean;
}

export default function IndustryAgentPage() {
  const [form, setForm] = useState<FormState>({
    industryCode: '',
    industryName: '',
    mock: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IndustryAgentOutput | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [cumulative, setCumulative] = useState<CumulativeStats>(ZERO_STATS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TOKEN_STATS_KEY);
      if (raw) setCumulative({ ...ZERO_STATS, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  function resetCumulative() {
    setCumulative(ZERO_STATS);
    try {
      localStorage.removeItem(TOKEN_STATS_KEY);
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit() {
    const code = form.industryCode.trim();
    if (!code) {
      setError('行业代码不能为空');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setElapsedMs(null);
    const t0 = Date.now();
    try {
      const resp = await fetch('/api/agents/industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryCode: code,
          industryName: form.industryName.trim() || undefined,
          mock: form.mock || undefined,
        }),
      });
      const data = (await resp.json()) as IndustryAgentOutput | { error: string; message: string };
      if (!resp.ok) {
        const msg = 'message' in data ? data.message : '调用失败';
        throw new Error(msg);
      }
      const out = data as IndustryAgentOutput;
      setResult(out);
      setCumulative((c) => {
        const next = accumulate(c, out.usage, out.cost);
        try {
          localStorage.setItem(TOKEN_STATS_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota errors */
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setElapsedMs(Date.now() - t0);
      setLoading(false);
    }
  }

  function quickPick(p: { code: string; name: string }) {
    setForm({ industryCode: p.code, industryName: p.name, mock: form.mock });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">行业分析 Agent</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            LE-A03 独立化版本 · 输入 <strong>国标行业代码</strong>，输出尽调报告
            <strong> 4.1 行业概况与景气度 </strong>+<strong> 4.2 行业政策环境</strong>
          </p>
        </div>
        <Badge variant="outline" className="h-6 gap-1 px-2 text-[11px]">
          <Sparkles className="size-3 text-[var(--ai-from)]" />
          AI · deepseek-v4-flash
        </Badge>
      </div>

      <Card className="ai-gradient-border p-5">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                行业代码 *
              </label>
              <Input
                className="mt-1 h-9 font-mono"
                placeholder="如 C3611"
                value={form.industryCode}
                onChange={(e) =>
                  setForm((s) => ({ ...s, industryCode: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                行业名称（可选，留空自动反查）
              </label>
              <Input
                className="mt-1 h-9"
                placeholder="如 汽车整车制造"
                value={form.industryName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, industryName: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
                className="h-9 gap-1.5"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                生成 4.1 / 4.2
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground">快速选择：</span>
            {QUICK_PICKS.map((p) => (
              <Button
                key={p.code}
                variant="outline"
                size="xs"
                onClick={() => quickPick(p)}
                disabled={loading}
              >
                <span className="font-mono mr-1 text-muted-foreground">{p.code}</span>
                {p.name}
              </Button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5"
              checked={form.mock}
              onChange={(e) =>
                setForm((s) => ({ ...s, mock: e.target.checked }))
              }
              disabled={loading}
            />
            <span>强制使用 mock（不调用 DeepSeek，用于无 API key 演示）</span>
          </label>
        </div>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2 text-[13px] text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Agent 调用失败</p>
              <p className="mt-1 text-[12px] opacity-80">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {result && (
        <>
          <TokenCostPanel
            usage={result.usage}
            cost={result.cost}
            model={result.model}
            cumulative={cumulative}
            onReset={resetCumulative}
          />
          <ResultPanel result={result} elapsedMs={elapsedMs} />
        </>
      )}

      {!result && !error && !loading && (
        <Card className="border-dashed p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <FileSearch className="size-5" />
            <div className="text-[13px]">
              输入行业代码后，本 Agent 将独立产出尽调报告第四部分的 4.1（景气度）和
              4.2（政策环境）两章内容；输出结构与导出 Word 中的章节字段对齐。
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ResultPanel({
  result,
  elapsedMs,
}: {
  result: IndustryAgentOutput;
  elapsedMs: number | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Factory className="size-5" />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight">
                {result.industryName}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">{result.industryCode}</span>
                <span>·</span>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  {result.source}
                </Badge>
                {elapsedMs != null && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {elapsedMs} ms
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ProsperityBadge
            score={result.overview.prosperityScore}
            label={result.overview.prosperityLabel}
          />
        </div>
      </Card>

      <RagStatusBanner status={result.ragStatus} />

      <SectionCard
        sectionNumber="4.1"
        sectionTitle="行业概况与景气度"
        agentId="LE-A03（独立化）"
      >
        <div className="flex flex-col gap-3 text-[13px] leading-relaxed">
          {result.overview.paragraphs.map((p, i) => (
            <ParagraphLine key={i} text={p} />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        sectionNumber="4.2"
        sectionTitle="行业政策环境"
        agentId="LE-A03（独立化）"
      >
        <div className="flex flex-col gap-3 text-[13px] leading-relaxed">
          {result.policy.paragraphs.map((p, i) => (
            <ParagraphLine key={i} text={p} />
          ))}
        </div>
        {result.policy.policies.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              政策清单（{result.policy.policies.length} 条）
            </div>
            <div className="flex flex-col gap-2">
              {result.policy.policies.map((policy, i) => (
                <PolicyRow key={i} policy={policy} />
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function TokenCostPanel({
  usage,
  cost,
  model,
  cumulative,
  onReset,
}: {
  usage: TokenUsage;
  cost: CostBreakdown;
  model?: string;
  cumulative: CumulativeStats;
  onReset: () => void;
}) {
  const pricing = getPricing(model);
  const modelLabel = model ?? DEFAULT_PRICING_MODEL;
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <Coins className="size-4 text-primary" />
        <h2 className="text-[14px] font-semibold tracking-tight">Token 用量与计费</h2>
        {usage.estimated && (
          <Badge
            variant="outline"
            className="h-5 border-amber-400/40 px-1.5 text-[10px] text-amber-600 dark:text-amber-300"
          >
            mock 估算
          </Badge>
        )}
        <Badge variant="outline" className="ml-auto h-5 px-1.5 font-mono text-[10px]">
          {modelLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsageStat
          label="本次"
          prompt={usage.promptTokens}
          completion={usage.completionTokens}
          total={usage.totalTokens}
          hit={usage.cacheHitTokens}
          miss={usage.cacheMissTokens}
          inputCost={cost.inputCost}
          outputCost={cost.outputCost}
          totalCost={cost.totalCost}
        />
        <UsageStat
          label={`累计 · ${cumulative.runs} 次`}
          prompt={cumulative.promptTokens}
          completion={cumulative.completionTokens}
          total={cumulative.totalTokens}
          hit={cumulative.cacheHitTokens}
          miss={cumulative.cacheMissTokens}
          inputCost={cumulative.inputCost}
          outputCost={cumulative.outputCost}
          totalCost={cumulative.totalCost}
          onReset={onReset}
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        单价（{modelLabel} · 元/百万 tokens）：上行·缓存命中{' '}
        <strong className="text-foreground">¥{pricing.inputCacheHit}</strong> · 上行·未命中{' '}
        <strong className="text-foreground">¥{pricing.inputCacheMiss}</strong> · 下行输出{' '}
        <strong className="text-foreground">¥{pricing.output}</strong>
        {usage.estimated && ' · mock 模式下 token 按文本长度估算（中文≈0.6/字），非真实计费值'}
      </p>
    </Card>
  );
}

function UsageStat({
  label,
  prompt,
  completion,
  total,
  hit,
  miss,
  inputCost,
  outputCost,
  totalCost,
  onReset,
}: {
  label: string;
  prompt: number;
  completion: number;
  total: number;
  hit: number;
  miss: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  onReset?: () => void;
}) {
  const fmt = (n: number) => n.toLocaleString('zh-CN');
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {onReset && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="ml-auto h-5 gap-1 px-1.5 text-[10px] text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            清零
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="上行 ↑" value={fmt(prompt)} sub={`命中 ${fmt(hit)} / 未命中 ${fmt(miss)}`} />
        <Metric label="下行 ↓" value={fmt(completion)} />
        <Metric label="合计" value={fmt(total)} accent />
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-border/40 pt-2 text-[12px]">
        <span className="text-muted-foreground">金额</span>
        <span>
          <span className="font-display text-[15px] font-semibold tabular-nums text-primary">
            {formatCNY(totalCost)}
          </span>
          <span className="ml-1.5 text-[11px] text-muted-foreground">
            （输入 {formatCNY(inputCost)} + 输出 {formatCNY(outputCost)}）
          </span>
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          'font-display text-[16px] tabular-nums leading-tight',
          accent ? 'font-semibold text-primary' : '',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  'research-report': '行业研报',
  policy: '政策法规',
  news: '行业新闻',
  interface: '数据接口',
};

function RagStatusBanner({ status }: { status: RagStatus }) {
  if (status.enabled) {
    return (
      <Card className="border-grade-a/30 bg-grade-a-bg/40 p-3">
        <div className="flex items-center gap-2 text-[12px] text-grade-a">
          <DatabaseZap className="size-4" />
          <span className="font-semibold">RAG 已接入</span>
          <span className="opacity-80">· 检索命中 {status.itemCount} 条</span>
          <div className="ml-auto flex flex-wrap gap-1">
            {status.sources.map((s) => (
              <Badge key={s} variant="outline" className="h-5 px-1.5 text-[10px]">
                {SOURCE_LABEL[s] ?? s}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="border-amber-400/40 bg-amber-50 p-3 dark:bg-amber-950/30">
      <div className="flex items-start gap-2 text-[12px] text-amber-700 dark:text-amber-300">
        <Database className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">RAG 未接入 · 数字仅为公开行业惯例参考值</span>
            <Badge
              variant="outline"
              className="h-5 border-amber-400/40 px-1.5 text-[10px] text-amber-700 dark:text-amber-300"
            >
              退化模式
            </Badge>
          </div>
          {status.note && (
            <p className="mt-1 text-[11px] opacity-80">{status.note}</p>
          )}
          <p className="mt-1 text-[11px] opacity-80">
            设计要求接入：行业研报库（RAG）· 政策法规库 · 行业新闻。当前由 LLM 凭训练数据生成，
            <strong>不可直接用于授信决策</strong>，仅供演示与流程验证。
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProsperityBadge({
  score,
  label,
}: {
  score: number;
  label: ProsperityLabel;
}) {
  const config: Record<ProsperityLabel, { className: string; icon: React.ReactNode }> = {
    热: {
      className: 'bg-grade-a-bg text-grade-a border-grade-a/20',
      icon: <TrendingUp className="size-3.5" />,
    },
    稳: {
      className: 'bg-grade-b-bg text-grade-b border-grade-b/20',
      icon: <TrendingUp className="size-3.5 opacity-60" />,
    },
    冷: {
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: <TrendingDown className="size-3.5" />,
    },
  };
  const c = config[label];
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-3 py-2', c.className)}>
      {c.icon}
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider opacity-70">
          景气度
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-xl tabular-nums leading-none">{score}</span>
          <span className="text-[12px] opacity-70">/ 100</span>
          <span className="ml-1 text-[13px] font-semibold">{label}</span>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  sectionNumber,
  sectionTitle,
  agentId,
  children,
}: {
  sectionNumber: string;
  sectionTitle: string;
  agentId: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-3">
        <span className="font-mono text-[12px] font-semibold text-primary">
          {sectionNumber}
        </span>
        <h2 className="text-[14px] font-semibold tracking-tight">{sectionTitle}</h2>
        <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px]">
          {agentId}
        </Badge>
      </div>
      {children}
    </Card>
  );
}

function ParagraphLine({ text }: { text: string }) {
  // 支持 **粗体** + 【小标题】高亮
  const parts: Array<{ type: 'text' | 'bold' | 'heading'; value: string }> = [];
  let rest = text;
  // 先抽 【小标题】 前缀
  const headingMatch = rest.match(/^【([^】]+)】/);
  if (headingMatch) {
    parts.push({ type: 'heading', value: headingMatch[1] });
    rest = rest.slice(headingMatch[0].length);
  }
  // 再处理 **bold**
  const boldRe = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(rest)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: rest.slice(last, m.index) });
    parts.push({ type: 'bold', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < rest.length) parts.push({ type: 'text', value: rest.slice(last) });

  return (
    <p>
      {parts.map((p, i) => {
        if (p.type === 'heading') {
          return (
            <span
              key={i}
              className="mr-2 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
            >
              {p.value}
            </span>
          );
        }
        if (p.type === 'bold') {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.value}
            </strong>
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </p>
  );
}

function PolicyRow({ policy }: { policy: IndustryPolicy }) {
  const impactConfig = {
    利好: {
      className: 'bg-grade-a-bg text-grade-a',
      icon: <CheckCircle2 className="size-3" />,
    },
    风险: {
      className: 'bg-destructive/10 text-destructive',
      icon: <AlertTriangle className="size-3" />,
    },
    中性: {
      className: 'bg-muted text-muted-foreground',
      icon: <FileSearch className="size-3" />,
    },
  }[policy.impact];

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{policy.title}</div>
          {policy.issuer && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{policy.issuer}</div>
          )}
        </div>
        <Badge variant="outline" className={cn('h-5 gap-1 px-1.5 text-[10px]', impactConfig.className)}>
          {impactConfig.icon}
          {policy.impact}
        </Badge>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
        {policy.industryImpact}
      </p>
    </div>
  );
}
