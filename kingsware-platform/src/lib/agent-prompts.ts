/**
 * 25 个 Agent 生成区的 prompt 声明
 *
 * 来源：法人小微企业_授信尽调报告_空模板.docx + 个体工商户_授信尽调报告_空模板.docx 中
 *      所有 🤖 Agent生成区 单元格的描述，再叠加两份 Agent 对应矩阵的主责映射。
 *
 * 用途：① scripts/generate-agent-content.mjs 调 Claude API 生成实际内容时按此 prompt 投喂；
 *      ② 报告 UI 可在 AgentBlock 上展示主责 Agent / 输入 / 输出格式 / 篇幅。
 */

export type CustomerKind = 'legal-entity' | 'sole-proprietor';

export interface AgentBlockPromptDef {
  /** blockId：稳定唯一键，UI 与 generated content 通过它联接 */
  id: string;
  customerType: CustomerKind;
  /** 主责 Agent ID（来自 Agent 对应矩阵） */
  agentId: string;
  /** Agent 中文名称 */
  agentName: string;
  /** 章节编号（如 1.4 / 5.6.2） */
  sectionNumber: string;
  /** 章节标题 */
  sectionTitle: string;
  /** 模板里"输入数据"行的原文 */
  inputs: string;
  /** 模板里"输出格式"行的原文 */
  outputFormat: string;
  /** 模板里"预期篇幅"行的原文 */
  expectedLength: string;
  /** 投给 Claude 的 user prompt（不含 system 前缀，customer 元数据由调用方拼） */
  userPromptHint: string;
}

const LE_PROMPTS: AgentBlockPromptDef[] = [
  {
    id: 'LE-1.4-core-risks',
    customerType: 'legal-entity',
    agentId: 'LE-A10',
    agentName: '决策与结构化建议',
    sectionNumber: '1.4',
    sectionTitle: '核心风险点提示',
    inputs: '企业综合分析明细 + 五对交叉验证结果 + 风险标签 + 一票否决检查',
    outputFormat: '结构化风险点列表（3-5 项），每项 100-200 字',
    expectedLength: '约 300-500 字',
    userPromptHint:
      '基于企业综合分析、五对交叉验证和风险标签综合分析，按重要性排序输出 3-5 个核心风险点。每项包含：风险标题、严重程度（极高/高/中/低）、风险描述、触发依据、潜在影响、建议关注度。',
  },
  {
    id: 'LE-1.5-credit-structure',
    customerType: 'legal-entity',
    agentId: 'LE-A10',
    agentName: '决策与结构化建议',
    sectionNumber: '1.5',
    sectionTitle: '授信结构性建议',
    inputs: '综合分析结论 + 还款来源测算 + 核心风险点 + 银行授信政策',
    outputFormat: '结构化授信参考（各要素分项说明）',
    expectedLength: '约 300-400 字',
    userPromptHint:
      '基于综合分析、还款能力测算、核心风险点，生成授信结构建议，分点说明：授信形式、担保结构、还款方式、限制性条款、监控触发条件。',
  },
  {
    id: 'LE-2.3-history',
    customerType: 'legal-entity',
    agentId: 'LE-A01',
    agentName: '企业画像',
    sectionNumber: '2.3',
    sectionTitle: '企业历史沿革与发展',
    inputs: '企业工商基本信息 + 工商变更记录 + 企业舆情（网络公开信息）+ 行业资讯',
    outputFormat: '时间轴叙事（包含 3-5 个关键节点）',
    expectedLength: '约 600-800 字',
    userPromptHint:
      '基于工商档案、企业舆情、行业新闻，撰写企业从设立到现在的发展叙事，按时间轴列出 3-5 个关键节点（成立、增资、迁址、并购、获奖、重大事件等）。',
  },
  {
    id: 'LE-2.4-business-model',
    customerType: 'legal-entity',
    agentId: 'LE-A01',
    agentName: '企业画像',
    sectionNumber: '2.4',
    sectionTitle: '主营业务与商业模式',
    inputs: '经营范围 + 发票上下游分析 + 企业产品信息 + 行业舆情 + 招投标记录',
    outputFormat: '结构化分析（主业 / 模式 / 客户 / 供应商 / 收入特征）',
    expectedLength: '约 800-1200 字',
    userPromptHint:
      '分析企业主营业务、商业模式、收入来源、客户结构、供应商结构，识别核心商业逻辑。分小标题：主营业务、商业模式、客户结构、供应商结构、收入特征。',
  },
  {
    id: 'LE-3.1.3-legal-rep-portrait',
    customerType: 'legal-entity',
    agentId: 'LE-A02',
    agentName: '实控人画像',
    sectionNumber: '3.1.3',
    sectionTitle: '法人画像综合分析',
    inputs: '个人综合涉诉 + 限高 + 对外投资 + 关联企业经营状况 + 网络舆情',
    outputFormat: '结构化画像（从业经历 / 商业网络 / 信用历史 / 风险评估）',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '基于法人个人涉诉、限高、对外投资、关联企业经营状况、行业经验、人物口碑等，生成法定代表人多维度画像，分小标题：从业经历、商业网络、信用历史、风险评估。',
  },
  {
    id: 'LE-3.4.2-related-party',
    customerType: 'legal-entity',
    agentId: 'LE-A02',
    agentName: '实控人画像',
    sectionNumber: '3.4.2',
    sectionTitle: '关联方风险传导分析',
    inputs: '关联方清单 + 谱系成员 + 企业视角（扫描各关联方风险）+ 关联方涉诉/失信',
    outputFormat: '网络拓扑描述 + 风险传导评估 + 关联交易异常识别',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '识别企业的关联方网络，分析关联方经营状况、合规风险，评估对本企业的风险传导可能性。分点：关联交易集中度、关联方信用、资金占用、风险传导。',
  },
  {
    id: 'LE-4.1-industry',
    customerType: 'legal-entity',
    agentId: 'LE-A03',
    agentName: '行业经营（行业 RAG）',
    sectionNumber: '4.1',
    sectionTitle: '行业概况与景气度',
    inputs: '国标行业代码 + 行业研报库（RAG）+ 行业新闻 + 行业政策库',
    outputFormat: '结构化行业分析（规模 / 增长 / 格局 / 景气度）',
    expectedLength: '约 1000-1500 字',
    userPromptHint:
      '基于企业所属行业，生成行业宏观分析，分小标题：行业归属、市场规模、市场结构、近期动态、景气度判断。',
  },
  {
    id: 'LE-4.2-policy',
    customerType: 'legal-entity',
    agentId: 'LE-A03',
    agentName: '行业经营（行业 RAG）',
    sectionNumber: '4.2',
    sectionTitle: '行业政策环境',
    inputs: '国标行业代码 + 政策法规库（RAG）+ 国务院 / 部委 / 地方政府公开文件',
    outputFormat: '政策清单（近一年）+ 利好/风险分类 + 对本企业影响判断',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '梳理近一年内对企业所属行业有重大影响的中央和地方政策，识别政策利好和政策风险，并判断对本企业影响。',
  },
  {
    id: 'LE-4.4.3-supply-chain',
    customerType: 'legal-entity',
    agentId: 'LE-A03',
    agentName: '行业经营',
    sectionNumber: '4.4.3',
    sectionTitle: '上下游关系深度分析',
    inputs: 'API 发票数据（逐笔）+ 上下游清单 + 关联方清单 + 反欺诈三接口结论',
    outputFormat: '集中度分析 + 关联交易识别 + 异常交易预警',
    expectedLength: '约 500-800 字',
    userPromptHint:
      '基于发票数据深度分析企业上下游关系，识别集中度风险、关联交易嫌疑、闭环交易、贸易真实性问题。',
  },
  {
    id: 'LE-4.6-swot',
    customerType: 'legal-entity',
    agentId: 'LE-A03',
    agentName: '行业经营',
    sectionNumber: '4.6',
    sectionTitle: 'SWOT 分析',
    inputs: '前述所有章节的关键结论',
    outputFormat: 'Strengths / Weaknesses / Opportunities / Threats 四象限，各 3-5 条',
    expectedLength: '约 600-800 字',
    userPromptHint:
      '综合行业、企业自身经营、财务、合规所有维度，生成 SWOT 分析。四个维度各 3-5 条要点。',
  },
  {
    id: 'LE-5.2-balance-sheet',
    customerType: 'legal-entity',
    agentId: 'LE-A04',
    agentName: '财务诊断',
    sectionNumber: '5.2',
    sectionTitle: '资产负债结构分析',
    inputs: '近三年资产负债表 + 行业基准数据 + 财务分析报告 API',
    outputFormat: '结构化分析（资产质量 / 负债结构 / 比率分析 / 异动解读）',
    expectedLength: '约 800-1200 字',
    userPromptHint:
      '深度分析资产负债结构，分小标题：资产质量、负债结构、关键比率、异动解读。',
  },
  {
    id: 'LE-5.3-profitability',
    customerType: 'legal-entity',
    agentId: 'LE-A04',
    agentName: '财务诊断',
    sectionNumber: '5.3',
    sectionTitle: '盈利能力分析',
    inputs: '近三年利润表 + 发票收入 + 行业基准 + 财税分析',
    outputFormat: '结构化分析（毛利率 / 净利率 / 费用率 / 利润质量）',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '深度分析盈利能力，分小标题：毛利率、净利率、费用率、利润质量。',
  },
  {
    id: 'LE-5.4-cashflow',
    customerType: 'legal-entity',
    agentId: 'LE-A04',
    agentName: '财务诊断',
    sectionNumber: '5.4',
    sectionTitle: '现金流分析',
    inputs: '近三年现金流量表 + 利润表 + 应收账款数据',
    outputFormat: '三大现金流分析 + 净现比 + 收现比',
    expectedLength: '约 500-800 字',
    userPromptHint:
      '分析经营、投资、筹资活动现金流，识别现金流健康度、净利润与现金流匹配度。给出关键比率。',
  },
  {
    id: 'LE-5.6.2-invoice',
    customerType: 'legal-entity',
    agentId: 'LE-A04',
    agentName: '财务诊断',
    sectionNumber: '5.6.2',
    sectionTitle: '发票深度分析',
    inputs: 'API 发票逐笔数据 + 上下游企业清单 + 关联方清单 + 反欺诈接口',
    outputFormat: '结构化分析（季节性 / 集中度 / 异常识别 / 作废率）',
    expectedLength: '约 800-1200 字',
    userPromptHint:
      '深度分析发票数据，识别销售季节性、客户稳定性、关联交易、虚开嫌疑、闭环交易等异常。',
  },
  {
    id: 'LE-5.9-finance-anomaly',
    customerType: 'legal-entity',
    agentId: 'LE-A04',
    agentName: '财务诊断（异动）',
    sectionNumber: '5.9',
    sectionTitle: '财务异动与解释',
    inputs: '全部财务数据 + 发票 + 纳税 + 用电 + 社保 + 行业基准',
    outputFormat: '财务异动清单 + 每项异动的可能解释 + 建议关注度',
    expectedLength: '约 800-1500 字',
    userPromptHint:
      '识别财务异动点（同比/环比异常变化、与行业偏离、内部不一致），并给出可能解释和建议关注度。',
  },
  {
    id: 'LE-7.6.1-cross-validation',
    customerType: 'legal-entity',
    agentId: 'LE-A07',
    agentName: '交叉验证',
    sectionNumber: '7.6.1',
    sectionTitle: '交叉验证综合结论',
    inputs: '五对交叉验证原始数据 + 异常阈值',
    outputFormat: '综合结论 + 是否触发分析结论调整 + 是否需要人工复核',
    expectedLength: '约 300-500 字',
    userPromptHint:
      '基于五对交叉验证结果，综合判断是否存在财务造假、规模虚报、虚构贸易、资金链紧张等系统性问题。',
  },
  {
    id: 'LE-8.2-repayment',
    customerType: 'legal-entity',
    agentId: 'LE-A09',
    agentName: '授信用途与还款',
    sectionNumber: '8.2',
    sectionTitle: '第一还款来源测算',
    inputs: '财务报表（利润表/现金流量表）+ 发票数据 + 纳税数据 + 行业季节性',
    outputFormat: '还款能力测算 + 偿债保障倍数 + 还款时间表',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '基于经营性现金流、利润、税后留存等测算企业偿债能力。给出保障倍数、敏感性分析、还款时间表。',
  },
  {
    id: 'LE-9.1-risk-map',
    customerType: 'legal-entity',
    agentId: 'LE-A08',
    agentName: '风险地图',
    sectionNumber: '9.1',
    sectionTitle: '风险地图总览',
    inputs: '前述所有章节结论 + 风险标签 + 一票否决检查',
    outputFormat: '风险地图（分类 × 严重性矩阵）+ 详细风险点列表',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '综合所有数据维度和章节结论，绘制企业完整风险地图，按风险类型（行业/经营/财务/法律合规）和严重性分级。',
  },
];

const SP_PROMPTS: AgentBlockPromptDef[] = [
  {
    id: 'SP-1.4-core-risks',
    customerType: 'sole-proprietor',
    agentId: 'SP-A08',
    agentName: '决策与建议',
    sectionNumber: '1.4',
    sectionTitle: '核心风险点提示',
    inputs: '四维评分明细 + 反欺诈结果 + 一票否决检查 + 多头借贷情况',
    outputFormat: '结构化风险点列表（3-5 项），每项 80-150 字',
    expectedLength: '约 300-500 字',
    userPromptHint:
      '综合四维评分、反欺诈检查、一票否决结果，按严重性排序输出经营者面临的核心风险点。',
  },
  {
    id: 'SP-2.5-owner-portrait',
    customerType: 'sole-proprietor',
    agentId: 'SP-A01',
    agentName: '经营者画像',
    sectionNumber: '2.5',
    sectionTitle: '经营者综合画像',
    inputs: '身份信息 + 手机行为 + 婚姻 + 学历 + 个人工商（关联企业）+ 个人涉诉',
    outputFormat: '结构化画像（基本特征 / 经营经历 / 信用历史 / 风险评估）',
    expectedLength: '约 500-800 字',
    userPromptHint:
      '综合个人基本信息、通讯稳定性、婚姻家庭、教育职业、关联企业等多维数据，生成经营者多维度人物画像，识别个人风险特征、还款意愿、社会稳定性。',
  },
  {
    id: 'SP-3.2.1-authenticity',
    customerType: 'sole-proprietor',
    agentId: 'SP-A02',
    agentName: '店铺经营',
    sectionNumber: '3.2.1',
    sectionTitle: '经营真实性综合判断',
    inputs: '工商基本信息 + 地址核验 + 用电数据 + 烟草/电商行业数据 + 手机活跃度',
    outputFormat: '经营真实性综合判断 + 风险信号识别',
    expectedLength: '约 500-800 字',
    userPromptHint:
      '综合工商登记年限、经营地址核验、用电数据、行业数据、手机行为等，判断个体工商户经营真实性。这是个体户尽调的核心一环。',
  },
  {
    id: 'SP-3.5.1-shop-analysis',
    customerType: 'sole-proprietor',
    agentId: 'SP-A02',
    agentName: '店铺经营',
    sectionNumber: '3.5.1',
    sectionTitle: '店铺经营情况综合分析',
    inputs: '工商基本信息 + 行业数据 + 用电 + 手机行为 + 行业舆情',
    outputFormat: '结构化分析（店铺概况 / 经营年限 / 经营状态 / 趋势 / 行业）',
    expectedLength: '约 600-1000 字',
    userPromptHint:
      '综合工商登记、经营地址、行业数据（烟草/电商）、用电、手机活跃度等，生成店铺经营综合分析。',
  },
  {
    id: 'SP-4.5-repayment',
    customerType: 'sole-proprietor',
    agentId: 'SP-A03',
    agentName: '经济能力',
    sectionNumber: '4.5',
    sectionTitle: '还款来源测算',
    inputs: '收入预测 + 银行卡流水 + 个税 + 资产数据 + 申请金额',
    outputFormat: '还款能力测算 + 偿债比 + 建议授信上限',
    expectedLength: '约 400-700 字',
    userPromptHint:
      '综合收入预测、银行卡流水、个税、不动产、车辆等所有经济能力数据，测算经营者真实还款能力，给出还款来源充裕度评估和建议授信金额。',
  },
  {
    id: 'SP-7.3-anti-fraud',
    customerType: 'sole-proprietor',
    agentId: 'SP-A04',
    agentName: '反欺诈流水线',
    sectionNumber: '7.3',
    sectionTitle: '反欺诈综合分析',
    inputs: '反欺诈五步结果 + 一票否决核查 + 手机/银行卡/经营行为异常信号',
    outputFormat: '结构化反欺诈结论 + 异常信号清单 + 建议',
    expectedLength: '约 300-500 字',
    userPromptHint:
      '综合五步反欺诈流水线和一票否决核查结果，识别经营者是否存在欺诈嫌疑、虚假身份、虚假经营、信贷套利等问题。',
  },
  {
    id: 'SP-8.1-risk-map',
    customerType: 'sole-proprietor',
    agentId: 'SP-A07',
    agentName: '风险地图',
    sectionNumber: '8.1',
    sectionTitle: '风险地图总览',
    inputs: '前述所有章节结论 + 一票否决检查 + 反欺诈结果',
    outputFormat: '风险地图（分类 × 严重性矩阵）+ 详细风险点列表',
    expectedLength: '约 500-800 字',
    userPromptHint:
      '综合所有数据维度，绘制经营者完整风险地图，按风险类型（经营/财务/合规/欺诈/失联）和严重性分级。注意：失联风险是个体户特有类别。',
  },
];

export const AGENT_PROMPTS: AgentBlockPromptDef[] = [...LE_PROMPTS, ...SP_PROMPTS];

export function findPrompt(id: string): AgentBlockPromptDef | undefined {
  return AGENT_PROMPTS.find((p) => p.id === id);
}

export function listPromptsByCustomer(t: CustomerKind): AgentBlockPromptDef[] {
  return AGENT_PROMPTS.filter((p) => p.customerType === t);
}
