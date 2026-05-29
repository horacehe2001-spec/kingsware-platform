import { LE_AGENTS, SP_AGENTS } from './agents';
import type {
  AgentRunState,
  CrossValidationPair,
  DueDiligenceReport,
  ReportSection,
  RiskPoint,
} from './types';

// ─────────────────────────────────────────────
// 法人小微 · 完整 mock 报告（基于客户 LE-2026-04-001）
// 16 个 Agent：SE-01 + LE-A01~A12 + AC-01 + FB-01 + IM-01
// ─────────────────────────────────────────────

const LE_OUTPUT_PREVIEWS: Record<string, string> = {
  'SE-01':
    '一票否决 7 项全部通过 · 五步授权门控通过 · 数据池快照冻结 (snapshot_id: snap_20260429_001)',
  'LE-A01':
    '广州东海智能装备 · 2018-03 设立 · 注册资本 1,500 万 · 自有厂房 8,400㎡ · 6 大产品系列含 3 项发明专利',
  'LE-A02':
    '法定代表人陈志刚，男，48 岁，高中学历。1995 年起从事机械加工，2008 年自主创业……',
  'LE-A03':
    '专用设备制造业 · 景气度中性偏积极 · 近 12 月利好政策 7 项 · 上下游集中度 38.4% / 30.1%',
  'LE-A04':
    '近 36 月销项发票合计 2.18 亿元，前 5 大客户占比 38.4%（行业基准 45%）；资产负债率 48.6%，毛利率 22.4%……',
  'LE-A05': '近 36 月融资 6 笔 · 中标 23 项履约良好 · 长期多头正常 · 动产抵押 1 项',
  'LE-A06':
    '综合表现良好 · 经营较好 / 财务较好 / 履约较好 / 合规强 / 成长一般',
  'LE-A07':
    '5 对验证 · 2 对关注（发票×营收 24%、反欺诈×发票闭环 18%）· 综合财务真实性可控',
  'LE-A08':
    '4 类风险地图 · 1 红区（应收账款）/ 2 黄区（关联交易、用电波动）/ 1 蓝区（环保处罚）',
  'LE-A09': '保障倍数 1.8x · 第二还款来源不动产抵押估值 1,200 万 · 4 档压力测试可承受',
  'LE-A10':
    '测算可覆盖 800 万流贷（供审批参考）· LPR+75BP · 12 月 · 不动产抵押+实控人连带；核心风险 4 项已排序',
  'LE-A11':
    '配置 32 项监控维度 · 红灯：失信/用电连续 3 月归零；黄灯：关联交易月增/多头月增>3 家',
  'LE-A12':
    'Critic 通过 · 数据对账无偏差 · 跨章节一致 · 综合意见 320 字（已附入综合意见栏）',
  'AC-01':
    '93 表 + 7 附录已渲染 · docx 已生成 · 监控配置已写入企业监控系统 · 推送审批官',
};

const LE_AGENT_STATES: AgentRunState[] = LE_AGENTS.map((a) => {
  // FB-01 / IM-01 是贷后 + 季度运行，本次报告生成时仍排队中
  if (a.id === 'FB-01' || a.id === 'IM-01') {
    return { agentId: a.id, status: 'queued' };
  }
  return {
    agentId: a.id,
    status: 'success',
    startedAt: '2026-04-29 16:48:00',
    finishedAt: '2026-04-29 16:50:30',
    durationMs: 12000 + Math.floor(Math.random() * 30000),
    apiCalls: a.id === 'SE-01' ? 23 : a.id.startsWith('LE-A') ? 4 + Math.floor(Math.random() * 12) : 0,
    tokenUsage: 2200 + Math.floor(Math.random() * 4000),
    outputPreview: LE_OUTPUT_PREVIEWS[a.id],
  };
});

const LE_RISK_POINTS: RiskPoint[] = [
  {
    id: 'r1',
    severity: 'high',
    category: '财务',
    title: '应收账款周转天数偏离行业基准 60%',
    description:
      '应收账款周转天数 142 天，行业均值 90 天。结合销项发票数据显示前 5 大客户回款周期超过 120 天，存在资金占用风险。',
    evidence: 'API：企业核心财务指标 / API发票上下游汇总 · 字段：accounts_receivable_days',
    recommendation: '建议要求企业提供应收账款账龄分析，将主要客户回款情况作为放款条件。',
    triggeredBy: ['LE-A04', 'LE-A07'],
  },
  {
    id: 'r2',
    severity: 'medium',
    category: '关联方',
    title: '关联交易占比 22%（高于阈值 15%）',
    description:
      '与实控人陈志刚控制的「东海智能装备(香港)有限公司」之间存在持续的销项交易，近 12 月占比 22.4%。',
    evidence: 'API：关联方清单查询 / API发票上下游 · 字段：related_party_amount',
    recommendation: '建议要求企业披露关联交易定价依据，必要时穿透核查境外关联方。',
    triggeredBy: ['LE-A02', 'LE-A03'],
  },
  {
    id: 'r3',
    severity: 'medium',
    category: '经营',
    title: '近 6 月用电稳定性下降 12pp',
    description:
      '近 6 月用电量稳定性指数从 88 下降到 76，环比波动加大。可能由订单结构变化或产能调整引起。',
    evidence: 'API：企业用电数据标签 · 字段：stability_score',
    recommendation: '建议补充实地走访，确认产能利用率及订单变化原因。',
    triggeredBy: ['LE-A03', 'LE-A04'],
  },
  {
    id: 'r4',
    severity: 'low',
    category: '合规',
    title: '环保处罚记录（2024 年 1 起）',
    description:
      '2024-08 因 VOCs 排放超标被珠海生态环境局处罚 5 万元，已整改并通过验收。',
    evidence: 'API：企业行政处罚 / 环保处罚 · 字段：penalty_records',
    recommendation: '已整改完毕，作为辅助参考，不影响本次评级。',
    triggeredBy: ['LE-A08'],
  },
];

const LE_CROSS_VALIDATIONS: CrossValidationPair[] = [
  {
    id: 'cv1',
    pair: '纳税 × 用电',
    sourceA: '纳税基础信息（月度）',
    sourceB: '企业用电数据标签（月度）',
    result: '正常',
    deviation: '12% （阈值 40%）',
    riskImplication: '财务真实性正常，未发现造假信号',
  },
  {
    id: 'cv2',
    pair: '发票 × 营收',
    sourceA: 'API 发票（月度销项）',
    sourceB: '核心财务指标（年报营收）',
    result: '关注',
    deviation: '24% （阈值 30%）',
    riskImplication: '存在一定差异，可能与销项发票时点和确认收入口径不同有关',
  },
  {
    id: 'cv3',
    pair: '社保 × 年报',
    sourceA: '社保实缴人数',
    sourceB: '年报自报人数',
    result: '正常',
    deviation: '8% （阈值 50%）',
    riskImplication: '规模真实，未发现虚报',
  },
  {
    id: 'cv4',
    pair: '反欺诈 × 发票',
    sourceA: '供应链反欺诈结论',
    sourceB: 'API 发票上下游',
    result: '关注',
    deviation: '闭环交易 18%（阈值 20%）',
    riskImplication: '存在一定关联交易，建议结合关联方分析进一步确认',
  },
  {
    id: 'cv5',
    pair: '多头 × 融资',
    sourceA: '多机构查询（短时）',
    sourceB: '融资综合查询',
    result: '正常',
    deviation: '近 7 天 3 家查询，融资记录 6 笔',
    riskImplication: '融资行为合理，未发现资金链紧张信号',
  },
];

// 法人 10 章 + 7 附录 + 93 张表，章节主责按 法人小微Agent对应矩阵_最终版.docx 映射
const LE_SECTIONS: ReportSection[] = [
  // 第一部分（LE-A10 主责摘要 + 核心风险 + 结构性建议）
  { number: '1.1', title: '企业综合分析摘要', contentPreview: '综合表现良好（经营/财务/履约较好）', agentGenerated: true, agentId: 'LE-A06' },
  { number: '1.2', title: '综合分析档位与授信参考', contentPreview: '测算可覆盖 800 万 · 供审批参考', agentGenerated: true, agentId: 'LE-A10' },
  { number: '1.3', title: '一票否决项检查', contentPreview: '10 项全部通过', agentGenerated: true, agentId: 'SE-01' },
  { number: '1.4', title: '核心风险点提示', contentPreview: '识别 4 项核心风险', agentGenerated: true, agentId: 'LE-A10' },
  { number: '1.5', title: '授信结构性建议', contentPreview: '组合担保 + 季报报送', agentGenerated: true, agentId: 'LE-A10' },

  // 第二部分（LE-A01 主责）
  { number: '2.1', title: '工商登记基本信息', contentPreview: '注册 2018-03-12，注册资本 1,500 万', agentGenerated: true, agentId: 'LE-A01' },
  { number: '2.2', title: '股权结构与穿透', contentPreview: '陈志刚 60%，实控人识别清晰', agentGenerated: true, agentId: 'LE-A01' },
  { number: '2.3', title: '企业历史沿革', contentPreview: '2018 设立 → 2020 增资 → 2023 拓展华东', agentGenerated: true, agentId: 'LE-A01' },
  { number: '2.4', title: '主营业务与商业模式', contentPreview: 'B2B 直销，订单制 + 标准品双线', agentGenerated: true, agentId: 'LE-A01' },
  { number: '2.5', title: '核心产品与服务', contentPreview: '6 大产品系列，3 项发明专利', agentGenerated: true, agentId: 'LE-A01' },
  { number: '2.6', title: '经营场所与产能', contentPreview: '自有厂房 8,400㎡', agentGenerated: true, agentId: 'LE-A01' },

  // 第三部分（LE-A02 主责）
  { number: '3.1', title: '法定代表人画像', contentPreview: '从业 30 年，无负面信息', agentGenerated: true, agentId: 'LE-A02' },
  { number: '3.1.3', title: '法人画像综合分析', contentPreview: '稳定型经营者，信用良好', agentGenerated: true, agentId: 'LE-A02' },
  { number: '3.2', title: '实际控制人识别', contentPreview: '陈志刚（央行 235 号文受益所有人）', agentGenerated: true, agentId: 'LE-A02' },
  { number: '3.3', title: '董监高履历', contentPreview: '5 名核心人员，近 3 年稳定', agentGenerated: true, agentId: 'LE-A02' },
  { number: '3.4', title: '关联企业网络', contentPreview: '识别关联企业 12 家', agentGenerated: true, agentId: 'LE-A02' },
  { number: '3.4.2', title: '关联方风险传导分析', contentPreview: '识别 1 项关联交易关注', agentGenerated: true, agentId: 'LE-A02' },

  // 第四部分（LE-A03 主责，需 RAG）
  { number: '4.1', title: '行业概况与景气度', contentPreview: '专用设备制造业 · 景气度中性偏积极', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.2', title: '行业政策环境', contentPreview: '近 12 月利好政策 7 项', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.3', title: '竞争格局与企业地位', contentPreview: '区域 Top 3，细分领域专精', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.4', title: '上下游产业链', contentPreview: '客户集中度 38.4%, 供应商 30.1%', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.4.3', title: '上下游关系深度分析', contentPreview: '识别关联交易闭环 1 项', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.5', title: '经营波动性分析', contentPreview: '用电稳定性 76 / 招聘活跃', agentGenerated: true, agentId: 'LE-A03' },
  { number: '4.6', title: 'SWOT 分析', contentPreview: 'S/W/O/T 各 4 条', agentGenerated: true, agentId: 'LE-A03' },

  // 第五部分（LE-A04 主责）
  { number: '5.1', title: '财务报表概览', contentPreview: '近三年营收 1.6/1.9/2.2 亿', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.2', title: '资产负债结构分析', contentPreview: '资产负债率 48.6%', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.3', title: '盈利能力分析', contentPreview: '毛利率 22.4%, 净利率 8.7%', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.4', title: '现金流分析', contentPreview: '经营现金流为正，覆盖倍数 1.8', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.5', title: '营运能力分析', contentPreview: '应收周转 142 天（关注）', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.6', title: '发票流水深度分析', contentPreview: '近 36 月销项 2.18 亿', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.7', title: '纳税申报', contentPreview: '纳税信用较好', agentGenerated: true, agentId: 'LE-A04' },
  { number: '5.9', title: '财务异动与解释', contentPreview: '识别 3 项异动', agentGenerated: true, agentId: 'LE-A04' },

  // 第六部分（LE-A05 主责）
  { number: '6.1', title: '历史融资记录', contentPreview: '近 36 月融资 6 笔', agentGenerated: true, agentId: 'LE-A05' },
  { number: '6.2', title: '多头借贷分析', contentPreview: '正常', agentGenerated: true, agentId: 'LE-A05' },
  { number: '6.3', title: '招投标与履约', contentPreview: '中标 23 项，履约良好', agentGenerated: true, agentId: 'LE-A05' },
  { number: '6.4', title: '资产抵质押', contentPreview: '动产抵押 1 项', agentGenerated: true, agentId: 'LE-A05' },

  // 第七部分（LE-A06 评分 + LE-A07 交叉验证）
  { number: '7.1', title: '维度一 经营稳定性 30%', contentPreview: '较好', agentGenerated: true, agentId: 'LE-A06' },
  { number: '7.2', title: '维度二 财务健康度 25%', contentPreview: '较好', agentGenerated: true, agentId: 'LE-A06' },
  { number: '7.3', title: '维度三 履约能力 25%', contentPreview: '较好', agentGenerated: true, agentId: 'LE-A06' },
  { number: '7.4', title: '维度四 合规性 15%', contentPreview: '强', agentGenerated: true, agentId: 'LE-A06' },
  { number: '7.5', title: '维度五 成长性 5%', contentPreview: '一般', agentGenerated: true, agentId: 'LE-A06' },
  { number: '7.6', title: '五对交叉验证', contentPreview: '5 对验证 / 2 对关注', agentGenerated: true, agentId: 'LE-A07' },
  { number: '7.6.1', title: '交叉验证综合结论', contentPreview: '财务真实性可控', agentGenerated: true, agentId: 'LE-A07' },

  // 第八部分（LE-A09 主责）
  { number: '8.1', title: '授信用途分析', contentPreview: '采购原材料 + 扩产能', agentGenerated: true, agentId: 'LE-A09' },
  { number: '8.2', title: '第一还款来源', contentPreview: '保障倍数 1.8x', agentGenerated: true, agentId: 'LE-A09' },
  { number: '8.3', title: '第二还款来源', contentPreview: '不动产抵押估值 1,200 万', agentGenerated: true, agentId: 'LE-A09' },
  { number: '8.4', title: '压力测试', contentPreview: '-20% 场景下保障倍数 1.4x', agentGenerated: true, agentId: 'LE-A09' },

  // 第九部分（LE-A08 主责）
  { number: '9.1', title: '风险地图总览', contentPreview: '4 类风险，1 红区 / 2 黄区 / 1 蓝区', agentGenerated: true, agentId: 'LE-A08' },
  { number: '9.2', title: '行业风险与缓释', contentPreview: '景气度中性，授信条件常规', agentGenerated: true, agentId: 'LE-A08' },
  { number: '9.3', title: '经营/财务/合规风险', contentPreview: '应收账款风险需关注', agentGenerated: true, agentId: 'LE-A08' },

  // 第十部分（LE-A11 主责）
  { number: '10.1', title: '事件驱动监控配置', contentPreview: '配置 32 项监控维度', agentGenerated: true, agentId: 'LE-A11' },
  { number: '10.2', title: '预警分级与处置流程', contentPreview: '红/黄/蓝灯 SOP', agentGenerated: true, agentId: 'LE-A11' },
];

export const LE_SAMPLE_REPORT: DueDiligenceReport = {
  id: 'LE-2026-04-001',
  customerId: 'LE-2026-04-001',
  customerName: '广州东海智能装备有限公司',
  customerType: 'legal-entity',
  reportNumber: 'FR-2026-04-001',
  status: 'reviewing',
  progress: 100, // 报告已完成生成（FB-01/IM-01 是贷后 + 季度，独立于报告生成）
  totalScore: 78,
  creditGrade: 'B',
  oneVoteVeto: [
    { item: '企业失信被执行', apiSource: '企业失信公告', triggered: false },
    { item: '法人失信被执行', apiSource: '个人综合涉诉(全量版)', triggered: false },
    { item: '疑似空壳企业', apiSource: '企业疑似空壳查询', triggered: false },
    { item: '法人涉赌涉诈', apiSource: '银行卡涉赌涉诈查询', triggered: false },
    { item: '重大税收违法', apiSource: '企业重大税收违法查询', triggered: false },
    { item: '企业严重违法', apiSource: '企业严重违法查询', triggered: false },
    { item: '破产重整', apiSource: '企业破产重整查询', triggered: false },
    { item: '法人限制高消费', apiSource: '限制高消费', triggered: false },
    { item: '连续 3 月用电归零', apiSource: '企业用电数据标签', triggered: false },
    { item: '风险标签"刚性"', apiSource: '风险标签接口', triggered: false },
  ],
  riskPoints: LE_RISK_POINTS,
  crossValidations: LE_CROSS_VALIDATIONS,
  agentStates: LE_AGENT_STATES,
  sections: LE_SECTIONS,
  recommendation: {
    decision: '建议批准',
    amount: 800,
    term: 12,
    rate: 'LPR + 75 BP',
    guarantee: '不动产抵押 + 实控人连带责任保证',
    conditions: [
      '保持纳税信用良好',
      '财务季报报送',
      '前 5 大客户回款情况按月披露',
      '关联交易超过单笔 50 万事先知会',
    ],
  },
};

// ─────────────────────────────────────────────
// 个体户 · 完整 mock 报告（基于 SP-2026-04-003 餐饮店）
// 14 个 Agent：SE-01 + SP-A01~A10 + AC-01 + FB-01 + IM-01
// ─────────────────────────────────────────────

const SP_OUTPUT_PREVIEWS: Record<string, string> = {
  'SE-01':
    '8 项一票否决通过 · 五步反欺诈门控全部通过 · 双主体快照冻结 (snapshot_id: snap_20260429_103)',
  'SP-A01':
    '王志刚，男，42 岁，高中。手机在网 96 月（>5 年=可信）· 已婚 · 名下个体户 1 家',
  'SP-A02':
    '注册 2018-05-12 · 临街铺面 · 用电稳定 · 经营真实性证据充足',
  'SP-A03':
    '月收入区间 2-3 万 · 名下 1 套住宅未抵押 · 还款覆盖率 32% · 充裕度合理',
  'SP-A04':
    '5 步反欺诈全部通过：身份核实 ✓ 手机验真 ✓ 工商验真 ✓ 欺诈过滤 ✓ 多头预警 ✓',
  'SP-A05':
    '信用预测 720 分（A 类）· 逾期无 · 近 6 月银行多头 1 家 · 非银 2 家（关注）',
  'SP-A06': '四维加权 76 分（B 级良）· 个人信用 78 / 经济能力 72 / 经营存续 80 / 合规 75',
  'SP-A07': '4 类风险地图 · 失联风险（黄）· 个人信用风险（蓝）',
  'SP-A08': '有条件批准 25 万 · LPR+150BP · 12 月 · 信用 · 核心风险 2 项已排序',
  'SP-A09':
    '失联监控配置：手机空号月频检测 + 多头月频复查；红灯=空号/停机/字号注销/新增失信',
  'SP-A10':
    'Critic 通过 · 反欺诈一致性核查 ✓ · 综合意见 240 字（已附入综合意见栏）',
  'AC-01':
    '62 表 + 6 附录已渲染 · docx 已生成 · 双主体监控配置已写入 · 推送审批官',
};

const SP_AGENT_STATES: AgentRunState[] = SP_AGENTS.map((a) => {
  if (a.id === 'FB-01' || a.id === 'IM-01') {
    return { agentId: a.id, status: 'queued' };
  }
  return {
    agentId: a.id,
    status: 'success',
    startedAt: '2026-04-29 16:50:00',
    finishedAt: '2026-04-29 16:51:30',
    durationMs: 6000 + Math.floor(Math.random() * 18000),
    apiCalls:
      a.id === 'SE-01'
        ? 31
        : a.id === 'SP-A04' || a.id === 'SP-A06' || a.id === 'SP-A07' || a.id === 'SP-A08' || a.id === 'SP-A09' || a.id === 'SP-A10'
          ? 0 // 这几个 Agent 零接口（复用快照）
          : 4 + Math.floor(Math.random() * 10),
    tokenUsage: 1400 + Math.floor(Math.random() * 2800),
    outputPreview: SP_OUTPUT_PREVIEWS[a.id],
  };
});

const SP_RISK_POINTS: RiskPoint[] = [
  {
    id: 'sp-r1',
    severity: 'medium',
    category: '失联',
    title: '手机话费近 3 月波动 35%',
    description:
      '经营者手机话费从月均 168 元下降到 110 元，停机 1 次。可能反映个人活跃度下降或经济状况变化。',
    evidence: 'API：手机近三个月话费 / 近 6 月欠费停机次数',
    recommendation: '建议在贷中贷后风控配置中将手机状态设为高频复查（每周）。',
    triggeredBy: ['SP-A01', 'SP-A07'],
  },
  {
    id: 'sp-r2',
    severity: 'low',
    category: '个人信用',
    title: '近 6 月非银多头 2 家',
    description:
      '近 6 月非银金融机构（消金/网贷）查询 2 家，未达预警线（>3 家），但需持续关注。',
    evidence: 'API：借贷意向验证细分版',
    recommendation: '在贷中贷后风控配置中按月复查多头变化。',
    triggeredBy: ['SP-A05'],
  },
];

// 个体户 9 章 + 6 附录 + 62 张表，章节主责按 个体户Agent对应矩阵.docx 映射
const SP_SECTIONS: ReportSection[] = [
  { number: '1.1', title: '四维综合评分摘要', contentPreview: '76 分（B 级良）', agentGenerated: true, agentId: 'SP-A06' },
  { number: '1.2', title: '信用等级与授信建议', contentPreview: '有条件批准 25 万', agentGenerated: true, agentId: 'SP-A08' },
  { number: '1.3', title: '一票否决项检查', contentPreview: '10 项全部通过', agentGenerated: true, agentId: 'SE-01' },
  { number: '1.4', title: '核心风险点提示', contentPreview: '识别 2 项核心风险', agentGenerated: true, agentId: 'SP-A08' },

  { number: '2.1', title: '经营者基本信息', contentPreview: '王志刚，男，42 岁', agentGenerated: true, agentId: 'SP-A01' },
  { number: '2.2', title: '通讯与生活稳定性', contentPreview: '手机在网 96 月', agentGenerated: true, agentId: 'SP-A01' },
  { number: '2.3', title: '婚姻与家庭', contentPreview: '已婚', agentGenerated: true, agentId: 'SP-A01' },
  { number: '2.4', title: '教育与职业', contentPreview: '高中，餐饮从业 18 年', agentGenerated: true, agentId: 'SP-A01' },
  { number: '2.5', title: '经营者综合画像', contentPreview: '稳定型经营者', agentGenerated: true, agentId: 'SP-A01' },
  { number: '2.6', title: '关联企业网络', contentPreview: '名下 1 家个体户', agentGenerated: true, agentId: 'SP-A01' },

  { number: '3.1', title: '店铺工商登记', contentPreview: '注册 2018-05，正餐服务', agentGenerated: true, agentId: 'SP-A02' },
  { number: '3.2', title: '经营场所核验', contentPreview: '地址一致，临街铺面', agentGenerated: true, agentId: 'SP-A02' },
  { number: '3.2.1', title: '经营真实性综合判断', contentPreview: '真实经营，证据充足', agentGenerated: true, agentId: 'SP-A02' },
  { number: '3.5', title: '经营活跃度信号', contentPreview: '电商月销售 4.2 万', agentGenerated: true, agentId: 'SP-A02' },
  { number: '3.5.1', title: '店铺经营综合分析', contentPreview: '近 6 月稳中有升', agentGenerated: true, agentId: 'SP-A02' },

  { number: '4.1', title: '收入水平评估', contentPreview: '月收入区间 2-3 万', agentGenerated: true, agentId: 'SP-A03' },
  { number: '4.2', title: '银行卡交易特征', contentPreview: '交易稳定', agentGenerated: true, agentId: 'SP-A03' },
  { number: '4.3', title: '不动产资产', contentPreview: '名下 1 套住宅，无抵押', agentGenerated: true, agentId: 'SP-A03' },
  { number: '4.4', title: '车辆资产', contentPreview: '名下 1 辆车', agentGenerated: true, agentId: 'SP-A03' },
  { number: '4.5', title: '还款能力测算', contentPreview: '月还款比 32%（合理）', agentGenerated: true, agentId: 'SP-A03' },

  { number: '5.1', title: '信用预测评分', contentPreview: '720 分', agentGenerated: true, agentId: 'SP-A05' },
  { number: '5.2', title: '信贷行为指数', contentPreview: '逾期无', agentGenerated: true, agentId: 'SP-A05' },
  { number: '5.3', title: '多头借贷分析', contentPreview: '近 6 月 2 家（关注）', agentGenerated: true, agentId: 'SP-A05' },

  { number: '6.1', title: '维度一 个人信用画像 35%', contentPreview: '78 分', agentGenerated: true, agentId: 'SP-A06' },
  { number: '6.2', title: '维度二 经济能力 25%', contentPreview: '72 分', agentGenerated: true, agentId: 'SP-A06' },
  { number: '6.3', title: '维度三 经营存续 25%', contentPreview: '80 分', agentGenerated: true, agentId: 'SP-A06' },
  { number: '6.4', title: '维度四 合规社会稳定 15%', contentPreview: '75 分', agentGenerated: true, agentId: 'SP-A06' },

  { number: '7.1', title: '五步反欺诈流水线', contentPreview: '5 步全部通过', agentGenerated: true, agentId: 'SP-A04' },
  { number: '7.2', title: '一票否决详细核查', contentPreview: '10 项核查证据', agentGenerated: true, agentId: 'SP-A04' },
  { number: '7.3', title: '反欺诈综合分析', contentPreview: '通过', agentGenerated: true, agentId: 'SP-A04' },

  { number: '8.1', title: '风险地图总览', contentPreview: '识别 2 项关注风险', agentGenerated: true, agentId: 'SP-A07' },
  { number: '8.5', title: '失联风险与缓释', contentPreview: '中风险，建议高频回访', agentGenerated: true, agentId: 'SP-A07' },

  { number: '9.2', title: '贷中行为监控', contentPreview: '配置 8 项监控（手机月频/多头月频）', agentGenerated: true, agentId: 'SP-A09' },
  { number: '9.3', title: '贷后分级预警', contentPreview: '红/黄/蓝灯规则已配置', agentGenerated: true, agentId: 'SP-A09' },
];

export const SP_SAMPLE_REPORT: DueDiligenceReport = {
  id: 'SP-2026-04-003',
  customerId: 'SP-2026-04-003',
  customerName: '南宁锦绣餐饮店',
  customerType: 'sole-proprietor',
  reportNumber: 'SR-2026-04-003',
  status: 'completed',
  progress: 100,
  totalScore: 76,
  creditGrade: 'B',
  oneVoteVeto: [
    { item: '身份核验失败', apiSource: '身份二要素 + 人脸', triggered: false },
    { item: '手机号涉风险', apiSource: '风险手机号列表', triggered: false },
    { item: '银行卡涉赌涉诈', apiSource: '银行卡涉赌涉诈查询', triggered: false },
    { item: '银行卡黑名单', apiSource: '银行卡黑名单核验', triggered: false },
    { item: '个人失信被执行', apiSource: '个人综合涉诉', triggered: false },
    { item: '限制高消费', apiSource: '限制高消费', triggered: false },
    { item: '店铺严重违法', apiSource: '企业严重违法', triggered: false },
    { item: '店铺疑似空壳', apiSource: '企业疑似空壳', triggered: false },
    { item: '不良行为记录', apiSource: '不良行为', triggered: false },
    { item: '羊毛党/欺诈嫌疑', apiSource: '检测羊毛党', triggered: false },
  ],
  riskPoints: SP_RISK_POINTS,
  agentStates: SP_AGENT_STATES,
  sections: SP_SECTIONS,
  recommendation: {
    decision: '有条件批准',
    amount: 25,
    term: 12,
    rate: 'LPR + 150 BP',
    guarantee: '信用',
    conditions: ['保持手机号在网且话费正常', '按月监控多头借贷情况'],
  },
};

// ─────────────────────────────────────────────
// 个体户 · 烟草零售 A 级 · 玉林鑫源烟酒便利店（SP-2026-04-001）
// 演示烟草分支表 + 良好信用画像批量审批
// ─────────────────────────────────────────────

const SP_TOBACCO_AGENT_STATES: AgentRunState[] = SP_AGENTS.map((a) => {
  if (a.id === 'FB-01' || a.id === 'IM-01') return { agentId: a.id, status: 'queued' };
  return {
    agentId: a.id,
    status: 'success',
    startedAt: '2026-04-21 10:08:00',
    finishedAt: '2026-04-21 10:09:25',
    durationMs: 5500 + Math.floor(Math.random() * 12000),
    apiCalls:
      a.id === 'SE-01' ? 28 :
      a.id === 'SP-A04' || a.id === 'SP-A06' || a.id === 'SP-A07' || a.id === 'SP-A08' || a.id === 'SP-A09' || a.id === 'SP-A10' ? 0 :
      4 + Math.floor(Math.random() * 8),
    tokenUsage: 1300 + Math.floor(Math.random() * 1800),
    outputPreview: `(${a.name})`,
  };
});

const SP_TOBACCO_REPORT: DueDiligenceReport = {
  id: 'SP-2026-04-001',
  customerId: 'SP-2026-04-001',
  customerName: '玉林鑫源烟草零售店',
  customerType: 'sole-proprietor',
  reportNumber: 'SR-2026-04-001',
  status: 'approved',
  progress: 100,
  generatedAt: '2026-04-21 10:09:25',
  totalScore: 82,
  creditGrade: 'A',
  oneVoteVeto: [
    { item: '身份核验失败', apiSource: '身份二要素 + 人脸', triggered: false },
    { item: '手机号涉风险', apiSource: '风险手机号列表', triggered: false },
    { item: '银行卡涉赌涉诈', apiSource: '银行卡涉赌涉诈查询', triggered: false },
    { item: '银行卡黑名单', apiSource: '银行卡黑名单核验', triggered: false },
    { item: '个人失信被执行', apiSource: '个人综合涉诉', triggered: false },
    { item: '限制高消费', apiSource: '限制高消费', triggered: false },
    { item: '店铺严重违法', apiSource: '企业严重违法', triggered: false },
    { item: '店铺疑似空壳', apiSource: '企业疑似空壳', triggered: false },
    { item: '不良行为记录', apiSource: '不良行为', triggered: false },
    { item: '羊毛党/欺诈嫌疑', apiSource: '检测羊毛党', triggered: false },
  ],
  riskPoints: [
    {
      id: 'sp-tob-r1',
      severity: 'low',
      category: '合规',
      title: '烟草许可证 2028 年到期，需提前续办',
      description: '烟草专卖零售许可证 2028-06 到期，需提前 6 个月办理续展手续，否则影响经营。',
      evidence: 'API：烟草数据查询 · license_expiry',
      recommendation: '在贷后监控中设置许可证到期提醒（提前 12 个月）。',
      triggeredBy: ['SP-A02', 'SP-A07'],
    },
  ],
  agentStates: SP_TOBACCO_AGENT_STATES,
  sections: SP_SECTIONS,
  recommendation: {
    decision: '建议批准',
    amount: 15,
    term: 24,
    rate: 'LPR + 80 BP（A 级利率优惠）',
    guarantee: '信用',
    conditions: [
      '保持烟草信用等级 A',
      '按季度复查多头借贷',
      '烟草许可证到期前 6 个月提醒续办',
    ],
  },
};

// ─────────────────────────────────────────────
// 法人 · C 级风险关注 · 江门台山亿达水产养殖（LE-2026-04-008）
// 雷达明显缺角（财务 / 成长偏低）+ 有条件批准
// ─────────────────────────────────────────────

const LE_AQUA_AGENT_STATES: AgentRunState[] = LE_AGENTS.map((a) => {
  if (a.id === 'FB-01' || a.id === 'IM-01') return { agentId: a.id, status: 'queued' };
  return {
    agentId: a.id,
    status: 'success',
    startedAt: '2026-04-28 09:35:00',
    finishedAt: '2026-04-28 09:38:10',
    durationMs: 14000 + Math.floor(Math.random() * 28000),
    apiCalls: a.id === 'SE-01' ? 21 : a.id.startsWith('LE-A') ? 3 + Math.floor(Math.random() * 9) : 0,
    tokenUsage: 2400 + Math.floor(Math.random() * 3200),
    outputPreview: `(${a.name})`,
  };
});

const LE_AQUA_RISK_POINTS: RiskPoint[] = [
  {
    id: 'le-aqua-r1',
    severity: 'high',
    category: '财务',
    title: '净利润转负，2025 年亏损 72 万元',
    description: '近三年净利率从 8.4% 下滑至 -13.1%，主要因饲料涨价 + 单价下跌。经营活动现金流转负 -58 万元。',
    evidence: 'API：核心财务指标 / 利润表 · net_profit_2025',
    recommendation: '严格控制本次授信额度（≤ 50 万）+ 期限不超过 6 个月 + 主要客户回款托管。',
    triggeredBy: ['LE-A04', 'LE-A07'],
  },
  {
    id: 'le-aqua-r2',
    severity: 'high',
    category: '经营',
    title: '应收账款周转 125 天（行业 60 天）',
    description: '应收账款 178 万元（占总资产 23%），前三客户回款周期超过 100 天，存在严重资金占用。',
    evidence: 'API：核心财务指标 / 上下游清单',
    recommendation: '要求主要客户回款托管账户 + 月度账龄披露。',
    triggeredBy: ['LE-A04', 'LE-A05'],
  },
  {
    id: 'le-aqua-r3',
    severity: 'high',
    category: '行业',
    title: '对虾白斑病疫情 + 台风极端天气',
    description: '广海镇属台风高发区，近年华南地区对虾白斑病高发，对养殖业生物资产构成系统性风险。',
    evidence: '行业 RAG：水产养殖业疫情通报',
    recommendation: '要求购买完整养殖险（含台风险 + 疫病险）作为放款条件。',
    triggeredBy: ['LE-A03', 'LE-A08'],
  },
  {
    id: 'le-aqua-r4',
    severity: 'medium',
    category: '合规',
    title: '水产养殖许可证 2026-04 到期',
    description: '养殖许可证将于 2026-04 到期，距今 < 12 个月，需提前续期。',
    evidence: 'API：企业行政许可',
    recommendation: '续期完成方可放款。',
    triggeredBy: ['LE-A01', 'LE-A08'],
  },
  {
    id: 'le-aqua-r5',
    severity: 'medium',
    category: '经营',
    title: '客户集中度过高（CR3 72%）',
    description: '前三客户占营收 72%，远高于行业基准 45%。任一大客户流失对企业现金流冲击巨大。',
    evidence: 'API 发票上下游分析',
    recommendation: '要求月报披露 + 客户多元化进度。',
    triggeredBy: ['LE-A03', 'LE-A04'],
  },
];

const LE_AQUA_CROSS_VALIDATIONS: CrossValidationPair[] = [
  { id: 'cv1', pair: '纳税 × 用电', sourceA: '纳税基础信息', sourceB: '用电数据标签', result: '正常', deviation: '15%', riskImplication: '财务真实性正常' },
  { id: 'cv2', pair: '发票 × 营收', sourceA: '发票（销项）', sourceB: '核心财务指标', deviation: '32%', result: '异常', riskImplication: '差异较大，可能存在收入确认或开票延迟问题' },
  { id: 'cv3', pair: '社保 × 年报', sourceA: '社保实缴人数', sourceB: '年报自报人数', result: '关注', deviation: '40%', riskImplication: '差异接近阈值，需现场核实人员真实数' },
  { id: 'cv4', pair: '反欺诈 × 发票', sourceA: '供应链反欺诈', sourceB: '发票上下游', result: '正常', deviation: '5%（无闭环）', riskImplication: '贸易关系真实' },
  { id: 'cv5', pair: '多头 × 融资', sourceA: '多机构查询', sourceB: '融资综合查询', result: '关注', deviation: '近 7 天 5 家查询', riskImplication: '近期融资压力上升，建议关注资金链' },
];

const LE_AQUA_REPORT: DueDiligenceReport = {
  id: 'LE-2026-04-008',
  customerId: 'LE-2026-04-008',
  customerName: '江门台山亿达水产养殖有限公司',
  customerType: 'legal-entity',
  reportNumber: 'FR-2026-04-008',
  status: 'reviewing',
  progress: 100,
  generatedAt: '2026-04-28 09:38:10',
  totalScore: 58,
  creditGrade: 'C',
  oneVoteVeto: [
    { item: '企业失信被执行', apiSource: '企业失信公告', triggered: false },
    { item: '法人失信被执行', apiSource: '个人综合涉诉(全量版)', triggered: false },
    { item: '疑似空壳企业', apiSource: '企业疑似空壳查询', triggered: false },
    { item: '法人涉赌涉诈', apiSource: '银行卡涉赌涉诈查询', triggered: false },
    { item: '重大税收违法', apiSource: '企业重大税收违法查询', triggered: false },
    { item: '企业严重违法', apiSource: '企业严重违法查询', triggered: false },
    { item: '破产重整', apiSource: '企业破产重整查询', triggered: false },
    { item: '法人限制高消费', apiSource: '限制高消费', triggered: false },
    { item: '连续 3 月用电归零', apiSource: '企业用电数据标签', triggered: false },
    { item: '风险标签"刚性"', apiSource: '风险标签接口', triggered: false },
  ],
  riskPoints: LE_AQUA_RISK_POINTS,
  crossValidations: LE_AQUA_CROSS_VALIDATIONS,
  agentStates: LE_AQUA_AGENT_STATES,
  sections: LE_SECTIONS,
  recommendation: {
    decision: '有条件批准',
    amount: 50,
    term: 6,
    rate: 'LPR + 280 BP（C 级风险溢价）',
    guarantee: '动产抵押 + 农担分险 + 主要客户回款托管',
    conditions: [
      '养殖许可证 2026-04 续期完成',
      '购买完整养殖险（台风 + 疫病）',
      '主要客户回款托管账户',
      '月度账龄披露 + 客户多元化进度',
      '净利润恢复正向方可考虑授信续作',
    ],
  },
};

// ─────────────────────────────────────────────
// 法人 · D 级一票否决拒绝 · 中山小榄五金加工（LE-2026-04-006）
// 演示一票否决拦截 + 失信被执行触发
// ─────────────────────────────────────────────

const LE_REJECT_AGENT_STATES: AgentRunState[] = LE_AGENTS.map((a) => {
  // SE-01 一票否决前置阶段就触发 → 后续 LE-A01-A12 大多 skipped
  if (a.id === 'SE-01') {
    return {
      agentId: 'SE-01',
      status: 'success',
      startedAt: '2026-04-22 13:18:00',
      finishedAt: '2026-04-22 13:18:42',
      durationMs: 42000,
      apiCalls: 18,
      tokenUsage: 800,
      outputPreview: '一票否决触发 3 项 · 后续 D 阶段直接拒绝，跳过明细 Agent',
    };
  }
  if (a.id === 'AC-01') {
    return {
      agentId: 'AC-01',
      status: 'success',
      startedAt: '2026-04-22 13:18:50',
      finishedAt: '2026-04-22 13:18:58',
      durationMs: 8000,
      apiCalls: 0,
      tokenUsage: 600,
      outputPreview: '组装拒绝报告 · 触发 3 项一票否决证据 · 推送审批官',
    };
  }
  if (a.id === 'FB-01' || a.id === 'IM-01') {
    return { agentId: a.id, status: 'queued' };
  }
  return { agentId: a.id, status: 'skipped', outputPreview: 'SE-01 一票否决触发，本 Agent 跳过' };
});

const LE_REJECT_RISK_POINTS: RiskPoint[] = [
  {
    id: 'le-rej-r1',
    severity: 'critical',
    category: '合规',
    title: '法人张伟强已被列入失信被执行人',
    description: '张伟强（法定代表人 / 90% 股东）被法院列入失信被执行人名单，限制高消费已生效。',
    evidence: '人行征信 / 失信被执行 / 限高名单',
    recommendation: '一票否决直接拒绝，无可缓释。',
    triggeredBy: ['SE-01'],
  },
  {
    id: 'le-rej-r2',
    severity: 'critical',
    category: '合规',
    title: '企业重大税收违法（2025-08 被认定）',
    description: '中山市税务局认定本企业 2024-2025 年存在虚开发票嫌疑，纳税信用降至 D 级，欠税 38 万未结清。',
    evidence: 'API：企业重大税收违法 / 纳税信用',
    recommendation: '一票否决直接拒绝。',
    triggeredBy: ['SE-01'],
  },
  {
    id: 'le-rej-r3',
    severity: 'critical',
    category: '财务',
    title: '资不抵债（所有者权益 -380 万）',
    description: '近三年持续亏损，2025 年所有者权益由 +120 万转为 -380 万，资产负债率 126.8%。',
    evidence: 'API：核心财务指标 / 资产负债表',
    recommendation: '已资不抵债，授信无意义。',
    triggeredBy: ['SE-01'],
  },
];

const LE_REJECT_REPORT: DueDiligenceReport = {
  id: 'LE-2026-04-006',
  customerId: 'LE-2026-04-006',
  customerName: '中山小榄五金加工有限公司',
  customerType: 'legal-entity',
  reportNumber: 'FR-2026-04-006',
  status: 'failed',
  progress: 100,
  generatedAt: '2026-04-22 13:18:58',
  totalScore: 38,
  creditGrade: 'D',
  oneVoteVeto: [
    { item: '企业失信被执行', apiSource: '企业失信公告', triggered: false },
    { item: '法人失信被执行', apiSource: '个人综合涉诉(全量版)', triggered: true },
    { item: '疑似空壳企业', apiSource: '企业疑似空壳查询', triggered: false },
    { item: '法人涉赌涉诈', apiSource: '银行卡涉赌涉诈查询', triggered: false },
    { item: '重大税收违法', apiSource: '企业重大税收违法查询', triggered: true },
    { item: '企业严重违法', apiSource: '企业严重违法查询', triggered: false },
    { item: '破产重整', apiSource: '企业破产重整查询', triggered: false },
    { item: '法人限制高消费', apiSource: '限制高消费', triggered: true },
    { item: '连续 3 月用电归零', apiSource: '企业用电数据标签', triggered: false },
    { item: '风险标签"刚性"', apiSource: '风险标签接口', triggered: false },
  ],
  riskPoints: LE_REJECT_RISK_POINTS,
  crossValidations: [
    { id: 'cv1', pair: '纳税 × 用电', sourceA: '纳税基础信息', sourceB: '用电数据标签', result: '异常', deviation: '85%', riskImplication: '用电断崖下降 + 纳税虚高，疑似经营造假' },
    { id: 'cv2', pair: '发票 × 营收', sourceA: '发票（销项）', sourceB: '核心财务指标', result: '异常', deviation: '52%', riskImplication: '严重不一致' },
    { id: 'cv3', pair: '社保 × 年报', sourceA: '社保实缴人数', sourceB: '年报自报人数', result: '异常', deviation: '70%', riskImplication: '社保仅 2 人但年报 18 人，疑似空壳' },
    { id: 'cv4', pair: '反欺诈 × 发票', sourceA: '供应链反欺诈', sourceB: '发票上下游', result: '异常', deviation: '闭环交易 38%', riskImplication: '存在虚开发票嫌疑' },
    { id: 'cv5', pair: '多头 × 融资', sourceA: '多机构查询', sourceB: '融资综合查询', result: '异常', deviation: '近 7 天 12 家查询', riskImplication: '严重多头借贷 + 资金链断裂信号' },
  ],
  agentStates: LE_REJECT_AGENT_STATES,
  sections: LE_SECTIONS,
  recommendation: {
    decision: '建议否决',
    amount: 0,
    term: 0,
    rate: '—',
    guarantee: '—',
    conditions: [
      '一票否决触发：失信被执行 + 重大税收违法 + 限制高消费',
      '资不抵债（所有者权益 -380 万）',
      '现金流持续流出，无可缓释方案',
      '建议关注是否启动诉前保全',
    ],
  },
};

export const SAMPLE_REPORTS: Record<string, DueDiligenceReport> = {
  [LE_SAMPLE_REPORT.id]: LE_SAMPLE_REPORT,
  [SP_SAMPLE_REPORT.id]: SP_SAMPLE_REPORT,
  [SP_TOBACCO_REPORT.id]: SP_TOBACCO_REPORT,
  [LE_AQUA_REPORT.id]: LE_AQUA_REPORT,
  [LE_REJECT_REPORT.id]: LE_REJECT_REPORT,
};

export function getReportByCustomerId(id: string): DueDiligenceReport | undefined {
  return SAMPLE_REPORTS[id];
}
