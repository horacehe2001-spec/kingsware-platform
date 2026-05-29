/**
 * LE-A03 行业分析 Agent（独立化版本）
 *
 * 设计：从原"行业经营"综合 Agent 中抽出的纯函数 Agent。
 * 输入：国标行业代码（GB/T 4754-2017），可选行业名称。
 * 输出：尽调报告第四部分 4.1（行业概况与景气度）+ 4.2（行业政策环境）的结构化内容。
 *
 * 与原 scripts/generate-agent-content.ts 的区别：
 *   - 不依赖客户事实清单（factSheet），不耦合任何企业主体；
 *   - 同一行业代码的多个客户可复用同一份输出（外层可加缓存）；
 *   - 4.2 输出口径调整为"对行业内企业的普遍影响"，而非"对本企业的影响"。
 */
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

import {
  computeCost,
  type CostBreakdown,
  estimateTokens,
  type TokenUsage,
} from './deepseek-pricing';

export type { TokenUsage, CostBreakdown } from './deepseek-pricing';

// ─────────────────────────────────────────────
// I/O 类型
// ─────────────────────────────────────────────

export interface IndustryAgentInput {
  /** 国标行业代码，如 C3611（汽车整车制造）、C16（烟草制品业） */
  industryCode: string;
  /** 行业名称；不填时由 INDUSTRY_DICT 反查，反查不到则保持代码原样 */
  industryName?: string;
}

/**
 * 知识库检索结果条目。后续接入真实 RAG（行业研报库 / 政策法规库 / 行业新闻）时，
 * 每条命中切片都包装成 IndustryContextItem 喂回本 Agent。
 */
export interface IndustryContextItem {
  /** research-report 研报 · policy 政策法规 · news 行业新闻 · interface 数据接口返回 */
  source: 'research-report' | 'policy' | 'news' | 'interface';
  /** 原文标题或接口名 */
  title: string;
  /** 用于拼进 prompt 的片段正文（建议 < 800 字符） */
  snippet: string;
  /** 发布或抓取日期，ISO 字符串 */
  date?: string;
  /** 原文链接或接口编号，可选 */
  ref?: string;
}

export interface IndustryContext {
  items: IndustryContextItem[];
}

export interface RagStatus {
  enabled: boolean;
  itemCount: number;
  /** 命中的知识库类型集合，便于 UI 展示徽章 */
  sources: Array<IndustryContextItem['source']>;
  /** 未接入时给前端的人话提示 */
  note?: string;
}

/**
 * 知识库检索器。
 * 默认实现是"未接入"桩函数：返回空数组，由 prompt 显式声明退化模式。
 * 接入真实 RAG 后通过 RunOptions.retriever 注入即可，本 Agent 主体逻辑不动。
 */
export type IndustryRetriever = (
  input: IndustryAgentInput,
) => Promise<IndustryContext> | IndustryContext;

export const stubRetriever: IndustryRetriever = async () => ({ items: [] });

export type ProsperityLabel = '热' | '稳' | '冷';

export interface IndustryOverviewSection {
  /** 5 段：行业归属 / 市场规模 / 市场结构 / 近期动态 / 景气度判断 */
  paragraphs: string[];
  /** 0-100 景气度量化得分 */
  prosperityScore: number;
  prosperityLabel: ProsperityLabel;
}

export interface IndustryPolicy {
  /** 政策标题（建议精简到 30 字内） */
  title: string;
  /** 发布机构 + 时间，如"工信部 2025-08" */
  issuer: string;
  /** 利好 / 风险 / 中性 */
  impact: '利好' | '风险' | '中性';
  /** 对行业内企业的普遍影响（不针对特定主体） */
  industryImpact: string;
}

export interface IndustryPolicySection {
  paragraphs: string[];
  policies: IndustryPolicy[];
}

export interface IndustryAgentOutput {
  industryCode: string;
  industryName: string;
  /** 4.1 行业概况与景气度 */
  overview: IndustryOverviewSection;
  /** 4.2 行业政策环境 */
  policy: IndustryPolicySection;
  /** RAG 接入状态 */
  ragStatus: RagStatus;
  source: 'deepseek-v4-flash' | 'mock' | string;
  model?: string;
  /** 本次调用的 token 用量（mock 时为估算值，estimated=true） */
  usage: TokenUsage;
  /** 本次调用按 model 单价计算的金额 */
  cost: CostBreakdown;
  generatedAt: string;
}

// ─────────────────────────────────────────────
// 行业代码 → 名称的轻量词典（GB/T 4754-2017 节选）
// ─────────────────────────────────────────────

const INDUSTRY_DICT: Record<string, string> = {
  // 制造业（C）
  C13: '农副食品加工业',
  C14: '食品制造业',
  C15: '酒、饮料和精制茶制造业',
  C16: '烟草制品业',
  C17: '纺织业',
  C20: '木材加工和木、竹、藤、棕、草制品业',
  C26: '化学原料和化学制品制造业',
  C27: '医药制造业',
  C30: '非金属矿物制品业',
  C33: '金属制品业',
  C34: '通用设备制造业',
  C35: '专用设备制造业',
  C36: '汽车制造业',
  C3611: '汽车整车制造',
  C37: '铁路、船舶、航空航天和其他运输设备制造业',
  C38: '电气机械和器材制造业',
  C39: '计算机、通信和其他电子设备制造业',
  // 批发零售（F）
  F51: '批发业',
  F52: '零售业',
  F5223: '烟草制品零售',
  // 住宿餐饮（H）
  H61: '住宿业',
  H62: '餐饮业',
  H6210: '正餐服务',
  // 信息技术（I）
  I63: '电信、广播电视和卫星传输服务',
  I64: '互联网和相关服务',
  I65: '软件和信息技术服务业',
  // 建筑业（E）
  E47: '房屋建筑业',
  E48: '土木工程建筑业',
};

export function resolveIndustryName(code: string, override?: string): string {
  if (override && override.trim()) return override.trim();
  return INDUSTRY_DICT[code.toUpperCase()] ?? code;
}

// ─────────────────────────────────────────────
// Prompt 构造
// ─────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `你是金智维 KINGSWARE 智慧信贷智能体平台中的"行业分析 Agent（LE-A03 独立化版本）"，专门为商业银行信贷审批岗位输出 *行业层级* 的尽调结论。

输出要求：
- 中文，专业、克制，给信贷审批人员看；不夸大、不打招呼，不写"我作为 AI"、"根据您提供的资料"。
- 严格按用户给定的"输出格式"和"预期篇幅"组织；不要超出 1.5 倍篇幅。
- 输出 *只针对行业本身* 的普遍特征，不要假设具体某个企业，不要编造未提供的具体公司名/数字。
- 段与段之间用空行隔开；段内不要换行；可以用 **粗体** 标记关键词。
- 必须直接输出 JSON 对象，不要 Markdown 代码栅栏、不要前后缀解释。`;

const SYSTEM_PROMPT_WITH_RAG = `${SYSTEM_PROMPT_BASE}

# 你拥有外部知识库
- 用户消息中"# 知识库检索结果"段列出的研报/政策/新闻片段是 **唯一可信** 的事实来源。
- 撰写时优先引用这些片段中的数字、年份、机构名；可在段尾用括号注明来源标题。
- 知识库未覆盖到的内容，必须用"约""估计""参考行业惯例"等限定语，不要硬编造。`;

const SYSTEM_PROMPT_NO_RAG = `${SYSTEM_PROMPT_BASE}

# 你当前没有外部知识库（RAG 未接入）
- 所有数字、增速、份额必须加 "约 / 估计 / 参考 / 根据公开行业惯例" 等限定语；禁止给出小数点后两位的"精确"数字。
- 政策清单不要写具体文件标题除非你高置信记得，宁可用"近期国务院/工信部出台的某项产业升级政策"这种概括口径。
- 在 4.1 第 2 段（市场规模）首句必须加一句类似 "**当前知识库未接入**，以下数据为公开行业惯例参考值" 的免责声明。`;

function renderContext(context: IndustryContext): string {
  if (context.items.length === 0) {
    return [
      `# 知识库检索结果`,
      `（无 —— 当前 RAG 未接入，按"无知识库"模式撰写，注意系统提示中的限定词要求）`,
    ].join('\n');
  }
  const lines: string[] = [`# 知识库检索结果（${context.items.length} 条）`];
  for (let i = 0; i < context.items.length; i++) {
    const it = context.items[i];
    const meta = [it.source, it.date ?? '', it.ref ?? ''].filter(Boolean).join(' · ');
    lines.push(`\n[${i + 1}] ${it.title}${meta ? `（${meta}）` : ''}`);
    lines.push(it.snippet);
  }
  return lines.join('\n');
}

function buildUserPrompt(
  input: IndustryAgentInput,
  industryName: string,
  context: IndustryContext,
): string {
  return [
    `# 任务`,
    `为国标行业代码 \`${input.industryCode}\`（${industryName}）输出尽调报告第四部分的两章内容：`,
    `- 4.1 行业概况与景气度（约 1000-1500 字）`,
    `- 4.2 行业政策环境（约 600-1000 字）`,
    ``,
    renderContext(context),
    ``,
    `# 4.1 输出格式（overview.paragraphs）`,
    `共 5 段，每段以"【小标题】"开头：`,
    `1. 【行业归属】产业链定位、上下游、子赛道划分；`,
    `2. 【市场规模】近 3 年市场规模 / CAGR / 区域分布（数值要标"约""估计"避免硬编造）；`,
    `3. 【市场结构】CR5/CR10、龙头企业类型、集中度趋势；`,
    `4. 【近期动态】近 12 月行业重大事件、技术变化、需求/价格波动；`,
    `5. 【景气度判断】综合给出"热/稳/冷"三档结论 + 推理依据。`,
    ``,
    `# 4.1 量化指标`,
    `- overview.prosperityScore：0-100 整数，景气度量化得分（< 40 冷 / 40-70 稳 / > 70 热）。`,
    `- overview.prosperityLabel："热" / "稳" / "冷" 三选一，与 prosperityScore 区间一致。`,
    ``,
    `# 4.2 输出格式`,
    `- policy.paragraphs：2-3 段连贯叙事；先总述政策环境基调，再分述利好/风险逻辑，最后给出"行业内企业普遍应关注的政策风险点"。`,
    `- policy.policies：3-6 条结构化政策清单，覆盖近 12-24 月对该行业有重大影响的中央/部委/地方政策。每条字段：`,
    `  - title：政策名称（30 字内）`,
    `  - issuer：发布机构 + 年月`,
    `  - impact：利好 / 风险 / 中性`,
    `  - industryImpact：对该行业内企业的*普遍*影响（不要写"本企业"，因为本 Agent 不知道具体企业）。`,
    ``,
    `# 输出 JSON 结构`,
    JSON.stringify(
      {
        overview: {
          paragraphs: ['【行业归属】...', '【市场规模】...', '【市场结构】...', '【近期动态】...', '【景气度判断】...'],
          prosperityScore: 65,
          prosperityLabel: '稳',
        },
        policy: {
          paragraphs: ['...', '...'],
          policies: [
            { title: '...', issuer: '...', impact: '利好', industryImpact: '...' },
          ],
        },
      },
      null,
      2,
    ),
    ``,
    `# 输出`,
    `严格输出上述 JSON 对象，不要前缀、后缀、解释、代码栅栏。`,
  ].join('\n');
}

// ─────────────────────────────────────────────
// DeepSeek 调用（与 scripts/generate-agent-content.ts 一致的协议）
// ─────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RawUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

function mapUsage(u: RawUsage | undefined): TokenUsage {
  const promptTokens = u?.prompt_tokens ?? 0;
  const completionTokens = u?.completion_tokens ?? 0;
  const cacheHitTokens = u?.prompt_cache_hit_tokens ?? 0;
  // 未命中字段缺失时，把剩余输入 token 都按未命中计（更保守，偏高不偏低）
  const cacheMissTokens =
    u?.prompt_cache_miss_tokens ?? Math.max(0, promptTokens - cacheHitTokens);
  return {
    promptTokens,
    completionTokens,
    totalTokens: u?.total_tokens ?? promptTokens + completionTokens,
    cacheHitTokens,
    cacheMissTokens,
  };
}

async function callDeepSeek(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<{ content: string; usage: TokenUsage }> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 2400,
      response_format: { type: 'json_object' },
    }),
    signal,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API ${resp.status} ${resp.statusText}: ${text.slice(0, 300)}`);
  }
  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: RawUsage;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 响应缺少 choices[0].message.content');
  return { content, usage: mapUsage(data.usage) };
}

interface RawAgentJson {
  overview?: {
    paragraphs?: unknown;
    prosperityScore?: unknown;
    prosperityLabel?: unknown;
  };
  policy?: {
    paragraphs?: unknown;
    policies?: unknown;
  };
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function clampScore(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pickLabel(score: number, raw: unknown): ProsperityLabel {
  if (raw === '热' || raw === '稳' || raw === '冷') return raw;
  if (score > 70) return '热';
  if (score < 40) return '冷';
  return '稳';
}

function asPolicies(v: unknown): IndustryPolicy[] {
  if (!Array.isArray(v)) return [];
  const out: IndustryPolicy[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const title = typeof obj.title === 'string' ? obj.title.trim() : '';
    const issuer = typeof obj.issuer === 'string' ? obj.issuer.trim() : '';
    const impactRaw = typeof obj.impact === 'string' ? obj.impact.trim() : '';
    const impact: IndustryPolicy['impact'] =
      impactRaw === '利好' || impactRaw === '风险' || impactRaw === '中性' ? impactRaw : '中性';
    const industryImpact =
      typeof obj.industryImpact === 'string' ? obj.industryImpact.trim() : '';
    if (title && industryImpact) {
      out.push({ title, issuer, impact, industryImpact });
    }
  }
  return out;
}

function parseAgentJson(raw: string): RawAgentJson {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const lb = s.indexOf('{');
  const rb = s.lastIndexOf('}');
  if (lb >= 0 && rb > lb) s = s.slice(lb, rb + 1);
  try {
    return JSON.parse(s) as RawAgentJson;
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────
// 配置加载（与 scripts/ 同套路：env > .env.local）
// ─────────────────────────────────────────────

let envLocalCache: Record<string, string> | null = null;
async function readEnvLocal(): Promise<Record<string, string>> {
  if (envLocalCache) return envLocalCache;
  try {
    const text = await fs.readFile(resolve(process.cwd(), '.env.local'), 'utf-8');
    const out: Record<string, string> = {};
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
    envLocalCache = out;
    return out;
  } catch {
    envLocalCache = {};
    return envLocalCache;
  }
}

export interface RunOptions {
  /** 强制走 mock，不调用外部 API（用于演示/测试） */
  forceMock?: boolean;
  /** 上层传入的 AbortSignal */
  signal?: AbortSignal;
  /** 模型；默认 deepseek-v4-flash */
  model?: string;
  /** Base URL；默认 https://api.deepseek.com */
  baseUrl?: string;
  /**
   * 知识库检索器；不传则用 stubRetriever（返回空，Agent 进入"无 RAG"模式）。
   * 接入真实 RAG 时把检索结果包装成 IndustryContext 即可。
   */
  retriever?: IndustryRetriever;
}

// ─────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────

function buildRagStatus(context: IndustryContext): RagStatus {
  if (context.items.length === 0) {
    return {
      enabled: false,
      itemCount: 0,
      sources: [],
      note: 'RAG 未接入：行业研报库 / 政策法规库 / 行业新闻均未对接，输出数字仅作公开行业惯例参考',
    };
  }
  const sources = Array.from(new Set(context.items.map((i) => i.source)));
  return {
    enabled: true,
    itemCount: context.items.length,
    sources,
  };
}

export async function runIndustryAgent(
  input: IndustryAgentInput,
  options: RunOptions = {},
): Promise<IndustryAgentOutput> {
  const code = (input.industryCode ?? '').trim();
  if (!code) {
    throw new Error('industryCode 不能为空');
  }
  const industryName = resolveIndustryName(code, input.industryName);
  const baseUrl = options.baseUrl ?? 'https://api.deepseek.com';
  const env = await readEnvLocal();
  // 计费要跟实际调用的模型一致，所以 model 取 DEEPSEEK_MODEL（与 callDeepSeek 同源）
  const model =
    options.model ?? process.env.DEEPSEEK_MODEL ?? env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash';

  // 1) 先跑 RAG 检索（没注入就用 stub，返回空）
  const retriever = options.retriever ?? stubRetriever;
  const context = await retriever({ industryCode: code, industryName });
  const ragStatus = buildRagStatus(context);

  if (options.forceMock) {
    return mockOutput(code, industryName, ragStatus, 'mock', model, context);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY ?? env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return mockOutput(code, industryName, ragStatus, 'mock', model, context);
  }

  // 2) 根据是否有 RAG 选 prompt 模式
  const systemPrompt = ragStatus.enabled ? SYSTEM_PROMPT_WITH_RAG : SYSTEM_PROMPT_NO_RAG;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: buildUserPrompt({ industryCode: code, industryName }, industryName, context),
    },
  ];

  let rawJson = '';
  let usage: TokenUsage;
  try {
    const r = await callDeepSeek(baseUrl, apiKey, model, messages, options.signal);
    rawJson = r.content;
    usage = r.usage;
  } catch (e) {
    throw new Error(`行业分析 Agent 调用失败：${(e as Error).message}`);
  }

  const parsed = parseAgentJson(rawJson);
  const overviewParagraphs = asStringArray(parsed.overview?.paragraphs);
  const policyParagraphs = asStringArray(parsed.policy?.paragraphs);
  const policies = asPolicies(parsed.policy?.policies);

  if (overviewParagraphs.length === 0 && policyParagraphs.length === 0 && policies.length === 0) {
    throw new Error('行业分析 Agent 返回结构不可解析');
  }

  const score = clampScore(parsed.overview?.prosperityScore);
  const label = pickLabel(score, parsed.overview?.prosperityLabel);

  return {
    industryCode: code,
    industryName,
    overview: {
      paragraphs: overviewParagraphs,
      prosperityScore: score,
      prosperityLabel: label,
    },
    policy: {
      paragraphs: policyParagraphs,
      policies,
    },
    ragStatus,
    source: model,
    model,
    usage,
    cost: computeCost(usage, model),
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Mock 输出：没 API key / 强制 mock 时用于演示
// ─────────────────────────────────────────────

function mockOutput(
  code: string,
  industryName: string,
  ragStatus: RagStatus,
  source: string = 'mock',
  model: string = 'deepseek-v4-flash',
  context: IndustryContext = { items: [] },
): IndustryAgentOutput {
  const overview: IndustryOverviewSection = {
      paragraphs: [
        `【行业归属】${industryName}（${code}）属于国民经济中游产业链，上承基础原材料、下接终端应用市场。子赛道按技术路径与下游应用大致可划分为 3-4 类，各赛道增长节奏存在分化。`,
        `【市场规模】**当前知识库未接入**，以下为公开行业惯例参考值：近三年市场规模年均增速约 6-8%，2025 年市场规模估计在万亿元量级；区域上以长三角、珠三角、成渝为三大集聚区，合计约占行业产值过半。`,
        `【市场结构】CR5 约 28-32%，集中度逐年小幅上升；龙头以 **A 股上市公司** 为主，中小厂商在细分领域以差异化路线生存；行业进入门槛中等偏上，资金 + 技术双壁垒。`,
        `【近期动态】近 12 月主要变化：①下游需求结构性分化，新兴应用场景同比 +15% 而传统场景 -3%；②上游原材料价格回落约 8%，行业毛利率改善 1-2 个百分点；③ESG 与碳排放法规趋严。`,
        `【景气度判断】综合需求端、成本端、政策端三维度，当前行业景气度判断为 **稳**：需求中性偏正、成本回落、政策温和支持，但需警惕个别细分赛道产能过剩信号。`,
      ],
      prosperityScore: 62,
      prosperityLabel: '稳',
  };
  const policy: IndustryPolicySection = {
      paragraphs: [
        `近 12-24 月，${industryName} 所处政策环境整体维持"鼓励 + 规范"双轨基调：产业升级、绿色低碳、专精特新方向获得中央及地方多层级文件支持；同时安全生产、环保排放、数据合规等约束性条款逐步收紧。`,
        `从政策力度看，**利好** 政策以财政补贴、税收优惠、产业园区扶持为主，覆盖中小企业的可及性较高；**风险** 政策集中在环保、能耗、用工合规领域，对历史合规记录薄弱的企业形成挤出。`,
        `行业内企业普遍应关注：①能耗双控指标对产能扩张的约束；②数据安全法对客户数据采集与跨境传输的合规要求；③地方政府专项补贴的申报窗口与配套条件。`,
      ],
      policies: [
        {
          title: '"十四五"现代产业体系建设规划',
          issuer: '国务院 2025-01',
          impact: '利好',
          industryImpact: '将该行业列入重点支持产业链，鼓励技术改造、智能制造转型，行业内企业可申报技改专项。',
        },
        {
          title: '工业领域碳达峰实施方案',
          issuer: '工信部 2025-06',
          impact: '风险',
          industryImpact: '提高单位产值能耗门槛，高耗能子赛道扩产受限，落后产能面临 24 个月内退出压力。',
        },
        {
          title: '专精特新中小企业培育办法',
          issuer: '工信部 2025-09',
          impact: '利好',
          industryImpact: '细分领域市占率高、研发投入强度 ≥ 5% 的中小企业可获得 500-1000 万元一次性奖励。',
        },
        {
          title: '数据安全管理条例（细则）',
          issuer: '网信办 2026-02',
          impact: '中性',
          industryImpact: '对涉及个人信息处理的行业内企业提出分级备案要求，新增合规成本约营收的 0.3-0.5%。',
        },
      ],
  };

  // mock 没有真实 token，按 prompt / 输出文本粗略估算（estimated=true）
  const systemPrompt = ragStatus.enabled ? SYSTEM_PROMPT_WITH_RAG : SYSTEM_PROMPT_NO_RAG;
  const promptText =
    systemPrompt +
    '\n' +
    buildUserPrompt({ industryCode: code, industryName }, industryName, context);
  const completionText = JSON.stringify({ overview, policy });
  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(completionText);
  const usage: TokenUsage = {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cacheHitTokens: 0,
    cacheMissTokens: promptTokens,
    estimated: true,
  };

  return {
    industryCode: code,
    industryName,
    overview,
    policy,
    ragStatus,
    source,
    model,
    usage,
    cost: computeCost(usage, model),
    generatedAt: new Date().toISOString(),
  };
}
