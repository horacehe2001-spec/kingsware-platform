/**
 * DeepSeek 计费（纯函数，无 node 依赖，server / client 均可 import）
 *
 * 价目表来源：https://api-docs.deepseek.com/zh-cn/quick_start/pricing
 * 单位：人民币元 / 百万（1e6）tokens。
 * 输入区分缓存命中 / 未命中（DeepSeek usage 返回 prompt_cache_hit_tokens /
 * prompt_cache_miss_tokens）。
 */

export interface ModelPricing {
  /** 输入·缓存命中 ¥/1M tokens */
  inputCacheHit: number;
  /** 输入·缓存未命中 ¥/1M tokens */
  inputCacheMiss: number;
  /** 输出 ¥/1M tokens */
  output: number;
}

export const DEFAULT_PRICING_MODEL = 'deepseek-v4-flash';

export const DEEPSEEK_PRICING: Record<string, ModelPricing> = {
  // deepseek-v4-flash（含弃用别名 deepseek-chat / deepseek-reasoner 的非思考/思考模式）
  'deepseek-v4-flash': { inputCacheHit: 0.02, inputCacheMiss: 1, output: 2 },
  // deepseek-v4-pro：2.5 折优惠价（至 2026-05-31，原价 命中0.1/未命中12/输出24）
  'deepseek-v4-pro': { inputCacheHit: 0.025, inputCacheMiss: 3, output: 6 },
};

export function getPricing(model?: string): ModelPricing {
  if (model && DEEPSEEK_PRICING[model]) return DEEPSEEK_PRICING[model];
  return DEEPSEEK_PRICING[DEFAULT_PRICING_MODEL];
}

export interface TokenUsage {
  /** 上行：输入 token 总数（= 命中 + 未命中） */
  promptTokens: number;
  /** 下行：输出 token 总数 */
  completionTokens: number;
  /** 上行 + 下行 */
  totalTokens: number;
  /** 输入中命中缓存的 token 数 */
  cacheHitTokens: number;
  /** 输入中未命中缓存的 token 数 */
  cacheMissTokens: number;
  /** true 表示 mock 估算值（非真实计费 token） */
  estimated?: boolean;
}

export interface CostBreakdown {
  /** 输入金额（命中 + 未命中），元 */
  inputCost: number;
  /** 输出金额，元 */
  outputCost: number;
  /** 合计金额，元 */
  totalCost: number;
  currency: 'CNY';
}

export function computeCost(usage: TokenUsage, model?: string): CostBreakdown {
  const p = getPricing(model);
  const inputCost =
    (usage.cacheHitTokens * p.inputCacheHit + usage.cacheMissTokens * p.inputCacheMiss) /
    1_000_000;
  const outputCost = (usage.completionTokens * p.output) / 1_000_000;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'CNY',
  };
}

export function emptyUsage(): TokenUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cacheHitTokens: 0,
    cacheMissTokens: 0,
  };
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    cacheHitTokens: a.cacheHitTokens + b.cacheHitTokens,
    cacheMissTokens: a.cacheMissTokens + b.cacheMissTokens,
    estimated: a.estimated || b.estimated,
  };
}

/**
 * token 粗略估算（仅 mock 用）。DeepSeek 经验值：中文 ≈ 0.6 token/字，
 * 其他字符（英文 / 数字 / 标点）≈ 0.3 token/字符。
 */
export function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (/[㐀-鿿豈-﫿]/.test(ch)) cjk++;
    else other++;
  }
  return Math.round(cjk * 0.6 + other * 0.3);
}

/** 金额格式化：金额很小，保留 6 位小数，去掉末尾多余 0。 */
export function formatCNY(amount: number): string {
  const s = amount.toFixed(6).replace(/\.?0+$/, '');
  return `¥${s === '' || s === '¥' ? '0' : s}`;
}
