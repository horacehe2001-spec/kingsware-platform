/**
 * SDAFI 五张审计表 mock 数据
 *
 * 来源：SDAFI 白皮书 v2.0 §6 五张审计表
 *   1. cycle_log         Agent 运行轨迹（每次 Agent 调用一行）
 *   2. agent_signal_log  Agent 间信号 / 授权链条
 *   3. improve_log       模型 / 阈值 / Prompt 变更，需人工审批
 *   4. device_pool       数据池快照（不可变事实层）
 *   5. revenue_pool      营收 / 财务快照（同 device_pool 但用于财务核对）
 *
 * 真实环境下这些表存在数据库；前端只读。这里 mock 几条样本展示形态。
 */

export interface CycleLogRow {
  id: string;
  cycleId: string; // 一次完整尽调的 cycle_id
  customerId: string;
  customerName: string;
  agentId: string;
  agentVersion: string;
  promptTemplateId: string;
  modelVersion: string;
  status: 'success' | 'failed' | 'running' | 'critic-rejected';
  startedAt: string;
  durationMs: number;
  apiCalls: number;
  tokenUsage: number;
  outputRef: string; // 产物存储位置
}

export interface AgentSignalLogRow {
  id: string;
  customerId: string;
  customerName: string;
  signalType:
    | 'authorization'
    | 'snapshot-frozen'
    | 'critic-pass'
    | 'critic-reject'
    | 'veto-triggered'
    | 'human-handoff';
  subjectType: 'enterprise' | 'legal-person' | 'operator' | 'shop';
  fromAgent: string;
  toAgent?: string;
  detail: string;
  occurredAt: string;
}

export interface ImproveLogRow {
  id: string;
  changeType: 'prompt' | 'threshold' | 'weight' | 'rule';
  agentTarget: string;
  description: string;
  trigger: string; // 触发原因（FB-01 反馈 / Critic / 人工）
  approver: string;
  approvedAt: string;
  appliedAt: string;
  version: string;
}

export interface DataSnapshotRow {
  id: string;
  snapshotId: string;
  customerId: string;
  customerName: string;
  pool: 'device_pool' | 'revenue_pool';
  fieldCount: number;
  fieldHashSample: string; // 前 8 字符哈希展示
  observedAt: string; // 数据时点
  apiSourceCount: number;
}

// ─── cycle_log（10 条样本）────────────────────────
export const CYCLE_LOG: CycleLogRow[] = [
  {
    id: 'cl-001',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'SE-01',
    agentVersion: 'v2.1.4',
    promptTemplateId: 'tpl-se-01-v3',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:48:00',
    durationMs: 18420,
    apiCalls: 23,
    tokenUsage: 4200,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/SE-01.json',
  },
  {
    id: 'cl-002',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'LE-A04',
    agentVersion: 'v1.8.2',
    promptTemplateId: 'tpl-le-a04-v5',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:48:25',
    durationMs: 31240,
    apiCalls: 12,
    tokenUsage: 8830,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/LE-A04.json',
  },
  {
    id: 'cl-003',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'LE-A07',
    agentVersion: 'v1.4.0',
    promptTemplateId: 'tpl-le-a07-v2',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:49:12',
    durationMs: 6800,
    apiCalls: 0,
    tokenUsage: 3120,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/LE-A07.json',
  },
  {
    id: 'cl-004',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'LE-A12',
    agentVersion: 'v2.0.1',
    promptTemplateId: 'tpl-le-a12-v4',
    modelVersion: 'claude-opus-4-7',
    status: 'critic-rejected',
    startedAt: '2026-04-29 16:50:08',
    durationMs: 7820,
    apiCalls: 0,
    tokenUsage: 5410,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/LE-A12-r1.json',
  },
  {
    id: 'cl-005',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'LE-A04',
    agentVersion: 'v1.8.2',
    promptTemplateId: 'tpl-le-a04-v5',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:50:32',
    durationMs: 28910,
    apiCalls: 0,
    tokenUsage: 7220,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/LE-A04-r2.json',
  },
  {
    id: 'cl-006',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'LE-A12',
    agentVersion: 'v2.0.1',
    promptTemplateId: 'tpl-le-a12-v4',
    modelVersion: 'claude-opus-4-7',
    status: 'success',
    startedAt: '2026-04-29 16:51:08',
    durationMs: 6420,
    apiCalls: 0,
    tokenUsage: 4850,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/LE-A12-r2.json',
  },
  {
    id: 'cl-007',
    cycleId: 'cyc-20260429-LE001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    agentId: 'AC-01',
    agentVersion: 'v3.2.0',
    promptTemplateId: 'tpl-ac-01-v8',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:51:18',
    durationMs: 9130,
    apiCalls: 0,
    tokenUsage: 2100,
    outputRef: 's3://kingsware-cycle/2026/04/29/LE001/AC-01-final.docx',
  },
  {
    id: 'cl-008',
    cycleId: 'cyc-20260429-SP003',
    customerId: 'SP-2026-04-003',
    customerName: '南宁锦绣餐饮店',
    agentId: 'SE-01',
    agentVersion: 'v2.1.4',
    promptTemplateId: 'tpl-se-01-sp-v2',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:50:00',
    durationMs: 12100,
    apiCalls: 31,
    tokenUsage: 3680,
    outputRef: 's3://kingsware-cycle/2026/04/29/SP003/SE-01.json',
  },
  {
    id: 'cl-009',
    cycleId: 'cyc-20260429-SP003',
    customerId: 'SP-2026-04-003',
    customerName: '南宁锦绣餐饮店',
    agentId: 'SP-A04',
    agentVersion: 'v1.0.6',
    promptTemplateId: 'tpl-sp-a04-v3',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:50:18',
    durationMs: 4220,
    apiCalls: 0,
    tokenUsage: 1840,
    outputRef: 's3://kingsware-cycle/2026/04/29/SP003/SP-A04.json',
  },
  {
    id: 'cl-010',
    cycleId: 'cyc-20260429-SP003',
    customerId: 'SP-2026-04-003',
    customerName: '南宁锦绣餐饮店',
    agentId: 'AC-01',
    agentVersion: 'v3.2.0',
    promptTemplateId: 'tpl-ac-01-v8',
    modelVersion: 'claude-sonnet-4-6',
    status: 'success',
    startedAt: '2026-04-29 16:51:30',
    durationMs: 5810,
    apiCalls: 0,
    tokenUsage: 1620,
    outputRef: 's3://kingsware-cycle/2026/04/29/SP003/AC-01-final.docx',
  },
];

// ─── agent_signal_log ───────────────────────────────
export const AGENT_SIGNAL_LOG: AgentSignalLogRow[] = [
  {
    id: 'sig-001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    signalType: 'authorization',
    subjectType: 'enterprise',
    fromAgent: 'SE-01',
    detail: '客户经理 李文博 上传授权书 + 法人电子签约（HASH: a3f9...）',
    occurredAt: '2026-04-29 16:47:42',
  },
  {
    id: 'sig-002',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    signalType: 'snapshot-frozen',
    subjectType: 'enterprise',
    fromAgent: 'SE-01',
    toAgent: 'L2 全部',
    detail: 'snapshot_id=snap_20260429_001 已冻结，134 字段，6 个 L2 Agent 共享',
    occurredAt: '2026-04-29 16:48:18',
  },
  {
    id: 'sig-003',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    signalType: 'critic-reject',
    subjectType: 'enterprise',
    fromAgent: 'LE-A12',
    toAgent: 'LE-A04',
    detail:
      'Critic 第 1 轮：财务诊断输出与发票数据偏差>15%，退回 LE-A04 重写第五章 5.6 节',
    occurredAt: '2026-04-29 16:50:08',
  },
  {
    id: 'sig-004',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    signalType: 'critic-pass',
    subjectType: 'enterprise',
    fromAgent: 'LE-A12',
    toAgent: 'AC-01',
    detail: 'Critic 第 2 轮通过，授权 AC-01 渲染 docx 报告',
    occurredAt: '2026-04-29 16:51:14',
  },
  {
    id: 'sig-005',
    customerId: 'SP-2026-04-006',
    customerName: '北海银滩海鲜店',
    signalType: 'veto-triggered',
    subjectType: 'operator',
    fromAgent: 'SE-01',
    detail:
      '一票否决：手机号「139****6182」命中风险手机号列表（涉诈类），Sense 阶段直接终止',
    occurredAt: '2026-04-29 16:12:08',
  },
  {
    id: 'sig-006',
    customerId: 'SP-2026-04-003',
    customerName: '南宁锦绣餐饮店',
    signalType: 'authorization',
    subjectType: 'operator',
    fromAgent: 'SE-01',
    detail: '经营者 H5 实人核身 + 人脸活体 + 电子签约（覆盖经营者 + 字号双主体）',
    occurredAt: '2026-04-29 16:49:30',
  },
  {
    id: 'sig-007',
    customerId: 'LE-2026-04-008',
    customerName: '江门台山亿达水产养殖',
    signalType: 'human-handoff',
    subjectType: 'legal-person',
    fromAgent: 'LE-A12',
    detail:
      'Critic 退回 2 轮仍不通过（财务异动解释不一致），转人工：客户经理 苏文静',
    occurredAt: '2026-04-28 14:22:15',
  },
];

// ─── improve_log ────────────────────────────────────
export const IMPROVE_LOG: ImproveLogRow[] = [
  {
    id: 'imp-001',
    changeType: 'weight',
    agentTarget: 'SP-A06 维度四',
    description: '"近6月欠费停机次数" 权重 15% → 25%（提升失联预警敏感度）',
    trigger: 'FB-01 季度反馈：失联客户中 SP-A06 维度四平均 70+ 分，模型预测能力不足',
    approver: '风控总监 陈志明',
    approvedAt: '2026-04-15 11:30',
    appliedAt: '2026-04-16 02:00',
    version: 'v1.4.0 → v1.5.0',
  },
  {
    id: 'imp-002',
    changeType: 'threshold',
    agentTarget: 'LE-A07 反欺诈×发票',
    description: '闭环交易占比阈值 25% → 20%（更严格识别虚构贸易）',
    trigger: 'Critic 半年内 5 次发现 20-25% 区间假阴性',
    approver: '风控总监 陈志明',
    approvedAt: '2026-03-22 09:15',
    appliedAt: '2026-03-23 02:00',
    version: 'v1.3.0 → v1.4.0',
  },
  {
    id: 'imp-003',
    changeType: 'prompt',
    agentTarget: 'LE-A02 实控人画像',
    description: '增加"近 12 月跨省持股变动"识别提示语',
    trigger: '风控团队 Q1 复盘：跨省关联方风险传导识别率偏低',
    approver: '风控总监 陈志明',
    approvedAt: '2026-02-10 16:40',
    appliedAt: '2026-02-11 02:00',
    version: 'tpl-le-a02-v4 → v5',
  },
  {
    id: 'imp-004',
    changeType: 'rule',
    agentTarget: 'SE-01 一票否决',
    description: '新增"风险手机号列表（涉诈类）"为一票否决项',
    trigger: '银保监 2026Q1 关于反诈通报',
    approver: '合规审计 王建华',
    approvedAt: '2026-01-28 14:10',
    appliedAt: '2026-01-29 02:00',
    version: 'rule-veto-v3 → v4',
  },
];

// ─── data_pool snapshots ────────────────────────────
export const DATA_SNAPSHOTS: DataSnapshotRow[] = [
  {
    id: 'snap-001',
    snapshotId: 'snap_20260429_001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    pool: 'device_pool',
    fieldCount: 134,
    fieldHashSample: 'a3f9e21c',
    observedAt: '2026-04-29 16:48:18',
    apiSourceCount: 90,
  },
  {
    id: 'snap-002',
    snapshotId: 'snap_20260429_001',
    customerId: 'LE-2026-04-001',
    customerName: '广州东海智能装备',
    pool: 'revenue_pool',
    fieldCount: 78,
    fieldHashSample: 'b7c3a014',
    observedAt: '2026-04-29 16:48:18',
    apiSourceCount: 12,
  },
  {
    id: 'snap-003',
    snapshotId: 'snap_20260429_103',
    customerId: 'SP-2026-04-003',
    customerName: '南宁锦绣餐饮店',
    pool: 'device_pool',
    fieldCount: 86,
    fieldHashSample: 'c92f618d',
    observedAt: '2026-04-29 16:50:18',
    apiSourceCount: 86,
  },
  {
    id: 'snap-004',
    snapshotId: 'snap_20260428_417',
    customerId: 'LE-2026-04-008',
    customerName: '江门台山亿达水产养殖',
    pool: 'device_pool',
    fieldCount: 128,
    fieldHashSample: 'd5a8f032',
    observedAt: '2026-04-28 14:11:08',
    apiSourceCount: 90,
  },
  {
    id: 'snap-005',
    snapshotId: 'snap_20260428_417',
    customerId: 'LE-2026-04-008',
    customerName: '江门台山亿达水产养殖',
    pool: 'revenue_pool',
    fieldCount: 72,
    fieldHashSample: 'e1b6c479',
    observedAt: '2026-04-28 14:11:08',
    apiSourceCount: 12,
  },
];
