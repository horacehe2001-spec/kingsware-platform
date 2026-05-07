#!/usr/bin/env tsx
/**
 * 调用 DeepSeek（OpenAI 兼容协议）按 src/lib/agent-prompts.ts 的 25 个 prompt 生成内容，
 * 写回 src/data/agent-content.ts。
 *
 * 用法：
 *   pnpm gen-agent-content                       # 生成全部 25 个 (LE 18 + SP 7)
 *   pnpm gen-agent-content -- --customer LE      # 只生成法人样例客户的 18 个
 *   pnpm gen-agent-content -- --customer SP      # 只生成个体户样例客户的 7 个
 *   pnpm gen-agent-content -- --block LE-4.1-industry  # 只重生成单个 block
 *
 * API Key 来源（按优先级）：
 *   1) 环境变量 DEEPSEEK_API_KEY
 *   2) 项目根 .env.local 里的 DEEPSEEK_API_KEY=xxx
 *   3) --api-key=xxx 命令行参数
 *
 * 模型：默认 deepseek-v4-flash（用户指定）。可通过 --model=xxx 覆盖。
 *
 * 输出：覆写 src/data/agent-content.ts，保留文件头部注释和工具函数，仅替换 AGENT_CONTENT 字典。
 */

import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { AGENT_PROMPTS, type AgentBlockPromptDef } from '../src/lib/agent-prompts';
import { ALL_CUSTOMERS as customers } from '../src/data/customers';
import { getLeProfile, getSpProfile } from '../src/data/customer-profiles';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'src/data/agent-content.ts');
const ENV_LOCAL = resolve(PROJECT_ROOT, '.env.local');

// ─────────────────────────────────────────────
// 读 .env.local + 解析参数
// ─────────────────────────────────────────────

interface CliArgs {
  apiKey?: string;
  model: string;
  customerFilter?: 'LE' | 'SP';
  customerId?: string;
  blockId?: string;
  baseUrl: string;
  dryRun: boolean;
}

async function loadEnvLocal(): Promise<Record<string, string>> {
  try {
    const text = await fs.readFile(ENV_LOCAL, 'utf-8');
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
    return out;
  } catch {
    return {};
  }
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const args: CliArgs = {
    model: 'deepseek-v4-flash',
    baseUrl: 'https://api.deepseek.com',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eqIdx = a.indexOf('=');
    const next = (): string | undefined => argv[++i];
    if (a.startsWith('--api-key=')) args.apiKey = a.slice(eqIdx + 1);
    else if (a === '--api-key') args.apiKey = next();
    else if (a.startsWith('--model=')) args.model = a.slice(eqIdx + 1);
    else if (a === '--model') args.model = next() ?? args.model;
    else if (a.startsWith('--base-url=')) args.baseUrl = a.slice(eqIdx + 1);
    else if (a === '--base-url') args.baseUrl = next() ?? args.baseUrl;
    else if (a.startsWith('--customer=')) {
      const v = a.slice(eqIdx + 1).toUpperCase();
      if (v === 'LE' || v === 'SP') args.customerFilter = v;
    } else if (a === '--customer') {
      const v = (next() ?? '').toUpperCase();
      if (v === 'LE' || v === 'SP') args.customerFilter = v;
    } else if (a.startsWith('--block=')) args.blockId = a.slice(eqIdx + 1);
    else if (a === '--block') args.blockId = next();
    else if (a.startsWith('--customer-id=')) args.customerId = a.slice(eqIdx + 1);
    else if (a === '--customer-id') args.customerId = next();
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

// ─────────────────────────────────────────────
// 业务上下文：根据 customerId 装配一段 fact-sheet 给 LLM
// ─────────────────────────────────────────────

interface CustomerLite {
  id: string;
  type: 'legal-entity' | 'sole-proprietor';
  name: string;
  industry: string;
  region: string;
  appliedAmount: number;
  factSheet: string; // 喂给 LLM 的事实清单
}

/** 已配齐 profile 的客户 ID（SAMPLE_REPORTS 里也有对应 report） */
const SAMPLE_CUSTOMER_IDS = [
  'LE-2026-04-001', // B 级良好
  'LE-2026-04-006', // D 级一票否决拒绝
  'LE-2026-04-008', // C 级风险关注
  'SP-2026-04-001', // 烟草零售 A 级
  'SP-2026-04-003', // 餐饮 B 级
];

function pickSampleCustomers(): CustomerLite[] {
  return customers
    .filter((c) => SAMPLE_CUSTOMER_IDS.includes(c.id))
    .map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      industry: c.industry,
      region: c.region,
      appliedAmount: c.appliedAmount,
      factSheet: factSheetFor(c),
    }));
}

function factSheetFor(c: typeof customers[number]): string {
  if (c.type === 'legal-entity') {
    const p = getLeProfile(c);
    const s = c.fiveDimensionScores!;
    const incomeY = p.incomeStatement.find((r) => r.item === '营业收入');
    const incomeNet = p.incomeStatement.find((r) => r.item === '净利润');
    const ar = p.operationRatios.find((r) => r.metric === '应收账款周转天数');
    const cashFlow = p.cashFlowStatement.find((r) => r.item === '经营活动现金流量净额');
    const lines = [
      `· 企业名称：${c.name}（${c.unifiedSocialCreditCode}）`,
      `· 法定代表人：${c.legalRepresentative}（${p.legalRepGender} ${p.legalRepAge} 岁 ${p.legalRepEducation} ${p.legalRepYearsInIndustry} 年从业）`,
      `· 实控人：${p.controllerName}直接 ${p.controllerDirectStake}${p.controllerIndirectStake !== '0%' ? ` + 通过${p.controllerIndirectVehicle}间接 ${p.controllerIndirectStake}` : ''}，合计穿透 ${p.controllerTotalStake}（央行 235 号文）`,
      `· 注册：${c.registeredAt} · 注册资本 ${c.registeredCapital} 万元（已实缴）`,
      `· 地址：${p.registeredAddress}${p.factoryArea > 0 ? ` · 自有厂房 ${p.factoryArea.toLocaleString('zh-CN')} ㎡（${p.realEstateRights}）` : ''}`,
      `· 行业：${c.industry}`,
      p.products.length > 0
        ? `· 主营：${p.products.map((pr) => `${pr.name} ${pr.revenueShare}`).join(' / ')}`
        : `· 主营：${c.industry}`,
      incomeY && incomeNet ? `· 财务：${incomeY.y} 营收 ${incomeY.y}（${incomeY.growth ?? '—'}）/ 净利 ${incomeNet.y}` : '',
      cashFlow ? `· 现金流：经营性 ${cashFlow.y}${ar ? ` · 应收周转 ${ar.y}（${ar.evaluation}，行业 ${ar.industry ?? '—'}）` : ''}` : '',
      `· 评分：综合 ${c.creditScore ?? '—'}（${c.creditGrade ?? '—'}）= 经营 ${s.operationStability}×30% + 财务 ${s.financialHealth}×25% + 履约 ${s.performance}×25% + 合规 ${s.compliance}×15% + 成长 ${s.growth}×5%`,
      p.relatedEnterprises.length > 0
        ? `· 关联：${p.relatedEnterprises.map((r) => `${r.name}（${r.tag}）`).join(' / ')}（共 ${p.totalRelatedCount} 家）`
        : '',
      p.financingHistory.length > 0
        ? `· 融资：${p.financingHistory.find((f) => f.type === '合计')?.count ?? '—'} 笔 · 在贷余额 ${p.financingHistory.find((f) => f.type === '合计')?.balance ?? '—'} 万`
        : '',
      `· 一票否决：10 项全部通过`,
      `· 申请：${c.appliedProduct} ${c.appliedAmount} 万`,
    ].filter(Boolean);
    return lines.join('\n');
  }
  const p = getSpProfile(c);
  const s = c.fourDimensionScores!;
  const re = p.realEstate[0];
  const ve = p.vehicles[0];
  return [
    `· 字号：${c.name}（${c.unifiedSocialCreditCode}）· 经营者 ${c.ownerName}`,
    `· 经营者：${p.ownerGender} ${p.ownerAge} 岁 ${p.highestEducation} ${p.industry}从业 ${p.yearsInIndustry} 年 · ${p.maritalStatus}`,
    `· 手机：在网 ${p.mobileMonthsOnline} 月 · 近 3 月话费波动 ${p.mobile3mFeeVolatility} · 停机 ${p.mobile6mShutdownCount} 次`,
    `· 店铺：${c.shopType} · 经营 ${Math.max(1, new Date().getFullYear() - parseInt(c.createdAt.split('-')[0], 10) || 0)} 年 · ${p.shopVenueType} · 月租 ${p.shopMonthlyRent}`,
    `· 经济：月均 ${p.monthlyIncomeEstimate}收入 / 月支出 ${p.monthlyExpenseEstimate} / 月可支配 ${p.monthlyDisposableEstimate}`,
    `· 资产：${re ? `住宅 1 套（${re.area}，${re.location}，${re.mortgageStatus}）` : '无房产'}${ve ? ` · 车 1 辆（${ve.model} ${ve.valuation} 万）` : ''}`,
    `· 评分：综合 ${c.creditScore ?? '—'}（${c.creditGrade ?? '—'}）= 个人信用 ${s.personalCredit}×35% + 经济 ${s.economicCapacity}×25% + 经营 ${s.operationAuthenticity}×25% + 合规 ${s.socialStability}×15%`,
    `· 多头：${p.multiHeadResult}`,
    `· 一票否决：10 项全部通过 · 五步反欺诈：通过`,
    `· 申请：${c.appliedAmount} 万 / 12 月 / ${c.appliedProduct}`,
  ].join('\n');
}

// ─────────────────────────────────────────────
// DeepSeek 调用
// ─────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callDeepSeek(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4, // 风控报告需要稳定 + 略带变化
      max_tokens: 2200,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API ${resp.status} ${resp.statusText}: ${text.slice(0, 500)}`);
  }
  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 响应缺少 choices[0].message.content');
  return content;
}

const SYSTEM_PROMPT = `你是金智维 KINGSWARE 智慧信贷智能体平台中负责生成尽职调查报告章节内容的 Agent。

输出要求：
- 中文，专业、克制，给信贷审批人员看；不夸大、不打招呼，不写"我作为 AI"。
- 严格按用户给定的"输出格式"和"预期篇幅"组织内容；不要超出 1.5 倍篇幅。
- 段与段之间用空行隔开，不要在段中插入回车；可以使用 **粗体** 标记关键词。
- 必须基于客户事实清单（fact sheet）的数字、名称，不许编造未提供的具体公司名/数字。
- 不要重复事实清单的元话术（如"根据您提供的资料"），直接进入正文。
- 输出 JSON：{"paragraphs": ["第一段", "第二段", ...]}，每段一项；不要 Markdown 代码栅栏。`;

function buildUserPrompt(prompt: AgentBlockPromptDef, customer: CustomerLite): string {
  return [
    `# 任务`,
    `撰写报告章节《${prompt.sectionNumber} ${prompt.sectionTitle}》。`,
    ``,
    `# 主责 Agent`,
    `${prompt.agentId} ${prompt.agentName}`,
    ``,
    `# 输入数据（声明，不必复述）`,
    prompt.inputs,
    ``,
    `# 输出格式`,
    prompt.outputFormat,
    ``,
    `# 预期篇幅`,
    prompt.expectedLength,
    ``,
    `# 写作指令`,
    prompt.userPromptHint,
    ``,
    `# 客户事实清单（必须严格基于此撰写，不可编造）`,
    customer.factSheet,
    ``,
    `# 输出`,
    `直接输出 JSON 对象 {"paragraphs": [...]}，不要任何前缀、后缀、解释、代码栅栏。`,
  ].join('\n');
}

interface BlockResult {
  customerId: string;
  blockId: string;
  /** 取自 model 名映射到字典 type，如 deepseek-v4-flash */
  source: string;
  model: string;
  generatedAt: string;
  paragraphs: string[];
}

/** 把模型名映射成字典文件里的 source 字段（要与 GenSource 类型保持兼容） */
function modelToSource(model: string): string {
  // 已知合法值：deepseek-chat / deepseek-reasoner / deepseek-v4-flash
  // 任何其它值，让生成的源类型字段使用 model 名本身
  return model;
}

async function generateBlock(
  args: CliArgs,
  apiKey: string,
  prompt: AgentBlockPromptDef,
  customer: CustomerLite,
): Promise<BlockResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(prompt, customer) },
  ];
  const raw = await callDeepSeek(args.baseUrl, apiKey, args.model, messages);
  const paragraphs = parseParagraphsLoose(raw);
  return {
    customerId: customer.id,
    blockId: prompt.id,
    source: modelToSource(args.model),
    model: args.model,
    generatedAt: new Date().toISOString(),
    paragraphs,
  };
}

/** DeepSeek 偶尔会带 markdown 代码栅栏；做容错解析。 */
function parseParagraphsLoose(raw: string): string[] {
  let s = raw.trim();
  // 去掉 ```json / ``` 栅栏
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // 提取首个 { ... }
  const lb = s.indexOf('{');
  const rb = s.lastIndexOf('}');
  if (lb >= 0 && rb > lb) s = s.slice(lb, rb + 1);
  try {
    const obj = JSON.parse(s) as { paragraphs?: unknown };
    if (Array.isArray(obj.paragraphs)) {
      return obj.paragraphs.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
    }
  } catch {
    /* fall through */
  }
  // 最后兜底：按空行切分
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

// ─────────────────────────────────────────────
// 写回 src/data/agent-content.ts
// ─────────────────────────────────────────────

interface ExistingEntry {
  customerId: string;
  blockId: string;
  source: string;
  model?: string;
  generatedAt: string;
  paragraphs: string[];
}

async function readExistingContent(): Promise<Map<string, ExistingEntry>> {
  const map = new Map<string, ExistingEntry>();
  try {
    // 动态 import 当前 agent-content.ts，把已有条目装载为兜底，
    // 这样部分生成（--block / --customer）不会破坏其它块。
    // Windows: ESM loader 要求 file:// URL，绝对路径不行。
    const mod = (await import(pathToFileURL(OUTPUT_PATH).href)) as {
      AGENT_CONTENT?: Record<string, ExistingEntry & { source: string }>;
    };
    const dict = mod.AGENT_CONTENT ?? {};
    for (const [k, v] of Object.entries(dict)) {
      const sep = k.indexOf('::');
      if (sep < 0) continue;
      const customerId = k.slice(0, sep);
      const blockId = k.slice(sep + 2);
      map.set(`${customerId}::${blockId}`, {
        customerId,
        blockId,
        source: v.source,
        model: v.model,
        generatedAt: v.generatedAt,
        paragraphs: v.paragraphs,
      });
    }
  } catch (e) {
    console.warn(`[w] 读取现有 agent-content.ts 失败，所有未生成块将占位：${(e as Error).message}`);
  }
  return map;
}

const FILE_HEADER = `/**
 * Agent 生成区内容字典
 *
 * - 部分由 scripts/generate-agent-content.ts 调用 DeepSeek 生成（source: 'deepseek-*'）。
 * - 部分由人工 mock 提供作为兜底（source: 'mock'）。
 *
 * paragraphs 数组每一项渲染为一段；段内可使用 **粗体**。
 */

export type GenSource = 'mock' | 'deepseek-chat' | 'deepseek-reasoner' | 'deepseek-v4-flash' | 'manual';

export interface AgentBlockContent {
  id: string;
  generatedAt: string;
  source: GenSource;
  model?: string;
  paragraphs: string[];
}

export type AgentContentMap = Record<string, AgentBlockContent>;

function k(customerId: string, blockId: string): string {
  return \`\${customerId}::\${blockId}\`;
}
`;

const FILE_FOOTER = `
export function getAgentContent(customerId: string, blockId: string): AgentBlockContent | undefined {
  return AGENT_CONTENT[k(customerId, blockId)];
}

export function parseInlineBold(s: string): Array<{ bold: boolean; text: string }> {
  const out: Array<{ bold: boolean; text: string }> = [];
  const re = /\\*\\*([^*]+)\\*\\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push({ bold: false, text: s.slice(last, m.index) });
    out.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ bold: false, text: s.slice(last) });
  return out;
}
`;

function escapeForTemplate(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function emitEntry(entry: BlockResult | ExistingEntry): string {
  const lines: string[] = [];
  lines.push(`  [k('${entry.customerId}', '${entry.blockId}')]: {`);
  lines.push(`    id: '${entry.blockId}',`);
  lines.push(`    generatedAt: '${entry.generatedAt}',`);
  lines.push(`    source: '${entry.source}',`);
  if ('model' in entry && entry.model) lines.push(`    model: '${entry.model}',`);
  lines.push(`    paragraphs: [`);
  for (const p of entry.paragraphs) {
    lines.push(`      \`${escapeForTemplate(p)}\`,`);
  }
  lines.push(`    ],`);
  lines.push(`  },`);
  return lines.join('\n');
}

async function writeOutput(allEntries: Array<BlockResult | ExistingEntry>): Promise<void> {
  const body = allEntries.map(emitEntry).join('\n\n');
  const out = `${FILE_HEADER}\nexport const AGENT_CONTENT: AgentContentMap = {\n${body}\n};\n${FILE_FOOTER}`;
  await fs.writeFile(OUTPUT_PATH, out, 'utf-8');
}

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const env = await loadEnvLocal();
  const apiKey = args.apiKey ?? process.env.DEEPSEEK_API_KEY ?? env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('[!] 缺少 DEEPSEEK_API_KEY。可通过：');
    console.error('    1) export DEEPSEEK_API_KEY=sk-xxxx');
    console.error('    2) 在项目根创建 .env.local 写 DEEPSEEK_API_KEY=sk-xxxx');
    console.error('    3) 命令行 --api-key=sk-xxxx');
    process.exit(1);
  }

  const sampleCustomers = pickSampleCustomers();

  // 客户 × prompt 笛卡尔积：每个 prompt 跨所有同类型客户都跑一遍
  const targets: Array<{ prompt: AgentBlockPromptDef; customer: CustomerLite }> = [];
  for (const c of sampleCustomers) {
    if (args.customerId && c.id !== args.customerId) continue;
    for (const p of AGENT_PROMPTS) {
      if (args.blockId && p.id !== args.blockId) continue;
      if (args.customerFilter === 'LE' && p.customerType !== 'legal-entity') continue;
      if (args.customerFilter === 'SP' && p.customerType !== 'sole-proprietor') continue;
      if (p.customerType !== c.type) continue;
      targets.push({ prompt: p, customer: c });
    }
  }

  console.log(`[i] 将生成 ${targets.length} 个 Agent 块（model=${args.model}）`);
  if (args.dryRun) {
    console.log('[i] --dry-run，仅打印任务列表，不调 API：');
    for (const t of targets) {
      console.log(`    - ${t.customer.id} :: ${t.prompt.id} (${t.prompt.agentId} ${t.prompt.agentName})`);
    }
    return;
  }

  const existing = await readExistingContent();

  const results: BlockResult[] = [];
  let okCount = 0;
  let failCount = 0;

  for (const t of targets) {
    const tag = `${t.customer.id} :: ${t.prompt.id}`;
    process.stdout.write(`[…] ${tag} ... `);
    const t0 = Date.now();
    try {
      const r = await generateBlock(args, apiKey, t.prompt, t.customer);
      results.push(r);
      okCount++;
      console.log(`OK (${r.paragraphs.length} 段, ${Date.now() - t0}ms)`);
    } catch (e) {
      failCount++;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`FAIL\n      ${msg}`);
    }
  }

  if (results.length === 0) {
    console.error(`[!] 没有任何成功条目（失败 ${failCount}），保留原 agent-content.ts 不变`);
    process.exit(2);
  }

  // 输出条目顺序：按 AGENT_PROMPTS 声明顺序枚举每个客户 × prompt
  // 1) 本次生成的 → 用 results
  // 2) 未生成但旧字典里有 → 用旧条目（保留之前 LLM 或 mock 的内容）
  // 3) 都没有的 → 占位
  const generatedMap = new Map<string, BlockResult>(
    results.map((r) => [`${r.customerId}::${r.blockId}`, r]),
  );
  const allEntries: Array<BlockResult | ExistingEntry> = [];
  for (const c of sampleCustomers) {
    for (const p of AGENT_PROMPTS) {
      if (p.customerType !== c.type) continue;
      const key = `${c.id}::${p.id}`;
      const fresh = generatedMap.get(key);
      if (fresh) {
        allEntries.push(fresh);
        continue;
      }
      const old = existing.get(key);
      if (old) {
        allEntries.push(old);
        continue;
      }
      allEntries.push({
        customerId: c.id,
        blockId: p.id,
        source: 'mock',
        generatedAt: 'mock',
        paragraphs: [`【${p.agentId} ${p.agentName} · ${p.sectionNumber} ${p.sectionTitle}】尚未由 LLM 生成；运行 \`pnpm gen-agent-content\` 重新生成。`],
      });
    }
  }

  await writeOutput(allEntries);
  console.log(`[✓] 成功写入 ${results.length} 个 LLM 生成块（兜底 ${allEntries.length - results.length} 个），失败 ${failCount} 个`);
  console.log(`[i] 输出：${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});
