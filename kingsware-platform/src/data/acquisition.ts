/**
 * 批量获客（acquisition）相关数据
 *
 * 业务背景：玉林普惠金融场景下，35 万个体工商户 + 10 万法人小微为目标客群。
 * 「批量获客」做的是把这 45 万户通过逐层预筛收敛到能进尽调的"高质量意向"。
 */

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** 上一级保留率 */
  passRate: number;
  /** 该阶段说明 */
  description: string;
}

export interface AcquisitionBatch {
  id: string;
  name: string;
  segment: 'legal-entity' | 'sole-proprietor';
  region: string;
  inputCount: number;
  passedCount: number;
  status: 'queued' | 'running' | 'completed' | 'paused';
  progress: number; // 0-100
  startedAt: string;
  estimatedCompletion?: string;
  owner: string;
}

export interface DataSource {
  id: string;
  name: string;
  category: '营销数据' | '小微分' | '工商存证' | '行业白名单';
  provider: '正菱（珠海）数据服务' | '玉林市监局' | '广西小微经营户联盟' | '内部沉淀';
  fields: number;
  refreshFreq: '实时' | '日频' | '周频' | '月频';
  status: 'active' | 'maintenance' | 'pending';
}

// ─── 漏斗（35 万 + 10 万 = 45 万 → ~3.4 万进尽调）──────
export const FUNNEL: FunnelStage[] = [
  {
    key: 'pool',
    label: '目标客群池',
    count: 450000,
    passRate: 100,
    description: '玉林市区 + 周边县市的个体工商户 + 法人小微全量名单',
  },
  {
    key: 'marketing',
    label: '营销数据筛选',
    count: 168000,
    passRate: 37.3,
    description:
      '小微分 ≥ 60 + 申请分 ≥ 50 + 授信分 ≥ 55 三维交叉，过滤无意向客群',
  },
  {
    key: 'whitelist',
    label: '行业白名单',
    count: 92500,
    passRate: 55.1,
    description:
      '叠加烟草零售户 / 电商白名单 / 小微制造业三个白名单，仅保留可承做的行业',
  },
  {
    key: 'veto',
    label: '一票否决前置',
    count: 78600,
    passRate: 84.9,
    description: '失信、限高、空壳、严重违法、破产 5 项硬过滤（无授权可调）',
  },
  {
    key: 'reverse-fraud',
    label: '反欺诈预筛',
    count: 51200,
    passRate: 65.1,
    description:
      '羊毛党 + 风险手机号 + 银行卡黑名单 + 涉赌涉诈四类标签批量过滤',
  },
  {
    key: 'soft-score',
    label: '软评分通过',
    count: 38400,
    passRate: 75.0,
    description:
      '基于公开数据的软评分：经济能力预测 + 信用预测 + 经营存续，分数 ≥ 60 通过',
  },
  {
    key: 'invitation',
    label: '触达邀请',
    count: 34100,
    passRate: 88.8,
    description: '短信 + 公众号 + 客户经理一对一三通道触达，剔除拒绝/无应答',
  },
  {
    key: 'in-diligence',
    label: '进入尽调',
    count: 8200,
    passRate: 24.0,
    description:
      '完成 H5 实人核身 + 电签授权后正式进入 SDAFI 尽调流水线',
  },
];

// ─── 当前在跑的批次任务 ─────────────────────────────
export const ACQUISITION_BATCHES: AcquisitionBatch[] = [
  {
    id: 'batch-2026-04-001',
    name: '玉林市玉州区烟草零售户批量预筛',
    segment: 'sole-proprietor',
    region: '广西玉林市玉州区',
    inputCount: 8420,
    passedCount: 1320,
    status: 'completed',
    progress: 100,
    startedAt: '2026-04-26 08:00',
    owner: '客户经理 何梓豪',
  },
  {
    id: 'batch-2026-04-002',
    name: '玉林市北流市电商个体户批量预筛',
    segment: 'sole-proprietor',
    region: '广西玉林市北流市',
    inputCount: 6280,
    passedCount: 1842,
    status: 'running',
    progress: 67,
    startedAt: '2026-04-29 09:00',
    estimatedCompletion: '2026-04-30 02:00',
    owner: '客户经理 黎海洋',
  },
  {
    id: 'batch-2026-04-003',
    name: '广州天河区先进制造业小微批量',
    segment: 'legal-entity',
    region: '广东广州市天河区',
    inputCount: 1820,
    passedCount: 540,
    status: 'running',
    progress: 88,
    startedAt: '2026-04-29 14:30',
    estimatedCompletion: '2026-04-29 19:30',
    owner: '客户经理 李文博',
  },
  {
    id: 'batch-2026-04-004',
    name: '佛山顺德食品制造业小微批量',
    segment: 'legal-entity',
    region: '广东佛山市顺德区',
    inputCount: 980,
    passedCount: 0,
    status: 'queued',
    progress: 0,
    startedAt: '2026-04-30 09:00',
    owner: '客户经理 王小辉',
  },
  {
    id: 'batch-2026-04-005',
    name: '南宁西乡塘区餐饮服务个体批量',
    segment: 'sole-proprietor',
    region: '广西南宁市西乡塘区',
    inputCount: 4120,
    passedCount: 1240,
    status: 'paused',
    progress: 40,
    startedAt: '2026-04-28 10:00',
    owner: '客户经理 陈梓涵',
  },
];

// ─── 数据源 ───────────────────────────────────────
export const DATA_SOURCES: DataSource[] = [
  {
    id: 'src-001',
    name: '画像标签',
    category: '营销数据',
    provider: '正菱（珠海）数据服务',
    fields: 600,
    refreshFreq: '日频',
    status: 'active',
  },
  {
    id: 'src-002',
    name: '小微分 / 申请分 / 授信分',
    category: '小微分',
    provider: '正菱（珠海）数据服务',
    fields: 12,
    refreshFreq: '实时',
    status: 'active',
  },
  {
    id: 'src-003',
    name: '反欺诈标签',
    category: '营销数据',
    provider: '正菱（珠海）数据服务',
    fields: 45,
    refreshFreq: '实时',
    status: 'active',
  },
  {
    id: 'src-004',
    name: '玉林市烟草零售户名册',
    category: '行业白名单',
    provider: '玉林市监局',
    fields: 28,
    refreshFreq: '月频',
    status: 'active',
  },
  {
    id: 'src-005',
    name: '电商个体户白名单',
    category: '行业白名单',
    provider: '正菱（珠海）数据服务',
    fields: 18,
    refreshFreq: '周频',
    status: 'active',
  },
  {
    id: 'src-006',
    name: '广西小微制造业联盟会员',
    category: '行业白名单',
    provider: '广西小微经营户联盟',
    fields: 14,
    refreshFreq: '月频',
    status: 'maintenance',
  },
  {
    id: 'src-007',
    name: '历史授信样本（5 万户）',
    category: '工商存证',
    provider: '内部沉淀',
    fields: 124,
    refreshFreq: '日频',
    status: 'active',
  },
];
