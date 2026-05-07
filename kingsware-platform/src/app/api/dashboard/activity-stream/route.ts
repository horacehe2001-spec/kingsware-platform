import type { ActivityEvent } from '@/data/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── 事件素材池（可循环采样的"今日发生"模板）────────────
const ACTORS_AGENT = [
  'LE-A01 企业画像',
  'LE-A02 实控人',
  'LE-A03 行业经营',
  'LE-A04 财务诊断',
  'LE-A05 履约征信',
  'LE-A06 五维评分',
  'LE-A07 交叉验证',
  'LE-A08 风险地图',
  'LE-A10 授信结论',
  'LE-A12 Critic 质检',
  'SP-A01 经营者画像',
  'SP-A02 店铺经营',
  'SP-A04 反欺诈流水线',
  'SP-A06 四维评分',
  'SP-A09 失联监控',
  'SE-01 感知与编排',
  'AC-01 报告组装',
];

const TARGETS_LE = [
  '广州东海智能装备',
  '佛山顺德嘉洋食品',
  '深圳前海智链科技',
  '东莞长安精密五金',
  '珠海高新化工材料',
  '惠州仲恺新能源科技',
  '中山小榄五金加工',
];

const TARGETS_SP = [
  '玉林鑫源烟草零售店',
  '南宁锦绣餐饮店',
  '柳州凯丽美容店',
  '北海银滩海鲜店',
  '桂林漓江竹编工坊',
];

const ACTORS_HUMAN = [
  '客户经理 何梓豪',
  '客户经理 李文博',
  '审批官 林雪琴',
  '风控总监 张伟',
];

type EventGenerator = () => Omit<ActivityEvent, 'id' | 'timestamp'>;

const GENERATORS: EventGenerator[] = [
  () => ({
    type: 'agent-finish',
    actor: pick(ACTORS_AGENT),
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: pick([
      `本环节耗时 ${(8 + Math.random() * 30).toFixed(1)}s · 调用 ${rand(3, 18)} 个接口`,
      `识别 ${rand(1, 4)} 项关注信号，已写入 cycle_log`,
      `综合得分 ${rand(60, 90)}，cycle_log 已落库`,
      `生成 ${rand(300, 1200)} 字结构化分析`,
    ]),
  }),
  () => ({
    type: 'agent-start',
    actor: pick(ACTORS_AGENT),
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: pick([
      `开始处理：从数据池快照读取 ${rand(8, 28)} 个字段`,
      `开始执行 SDAFI Sense 阶段，预计耗时 ${rand(8, 25)}s`,
      `进入 Decide 阶段，依赖 ${rand(2, 5)} 个上游 Agent 输出`,
    ]),
  }),
  () => ({
    type: 'risk-alert',
    actor: '贷中贷后风控引擎',
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: pick([
      '门面用电连续 2 月下滑超 30%，触发黄灯预警',
      '近 7 天非银多头查询 4 家，触发资金链紧张信号',
      '法人新增涉诉案件，金额 50 万以上',
      '手机号空号检测命中，立即触发失联红灯',
      '工商状态变更：经营异常名录新增',
    ]),
  }),
  () => ({
    type: 'report-generated',
    actor: 'Agent 编排引擎',
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: pick([
      `完成尽调报告生成，耗时 ${rand(4, 11)} 分 ${rand(10, 59)} 秒`,
      `综合评分 ${rand(60, 90)}（${pick(['A', 'B', 'C'])} 级），${pick(['建议批准', '有条件批准'])}`,
      `93 表 + 7 附录已渲染，docx 已生成`,
    ]),
  }),
  () => ({
    type: 'authorization',
    actor: pick(ACTORS_HUMAN),
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: '完成 H5 实人核身 + 电子签约授权',
  }),
  () => ({
    type: 'approval',
    actor: pick(ACTORS_HUMAN),
    target: pick([...TARGETS_LE, ...TARGETS_SP]),
    message: pick([
      `批准 ${rand(50, 800)} 万元授信，期限 12 个月`,
      `三方签字完成，授信报告归档`,
      `Critic 退回，请求 LE-A04 复核财务异动`,
    ]),
  }),
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

let counter = 0;
function nextEvent(): ActivityEvent {
  const tpl = GENERATORS[Math.floor(Math.random() * GENERATORS.length)]();
  return {
    id: `live-${Date.now()}-${counter++}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ...tpl,
  };
}

/**
 * GET /api/dashboard/activity-stream
 *
 * SSE 推流。客户端用 EventSource 订阅。每 ~3s push 一条新事件。
 * 客户端断开（或 abort）时立即清理 interval 防泄漏。
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ActivityEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // 客户端断开
      request.signal.addEventListener('abort', cleanup);

      // 立即 ping 一条以稳定连接
      controller.enqueue(encoder.encode(': connected\n\n'));

      // 每 2.5-4s 推一条，随机抖动避免规整感
      const tick = () => {
        send(nextEvent());
        const jitter = 2500 + Math.random() * 1500;
        interval = setTimeout(tick, jitter) as unknown as ReturnType<typeof setInterval>;
      };
      tick();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  });
}
