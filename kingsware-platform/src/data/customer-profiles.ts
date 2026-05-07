/**
 * 客户深度档案（profile）
 *
 * customers.ts 只存基本信息（名称、注册资本、得分等），
 * 但报告章节里要呈现大量"具体事实"（厂房号、股东出资、客户名、抵押、财务三表等）。
 * 这些事实写死在 chapter 模板里会导致换客户报告就不对——
 * 把它们抽成 profile，按 customerId 索引，章节模块按字段读。
 *
 * - getLeProfile(customer): 永远返回完整 profile（缺失字段用 default 兜底，能从 customer 推的自动算）
 * - getSpProfile(customer): 同上
 * - 已知客户：CUSTOMER_PROFILES 里的 override，用对客户的真实字段覆盖默认值
 * - 未知客户：渲染 default profile（带"[请补充]"等占位提示，用户能看出哪里需要填）
 */

import type {
  Customer,
  LegalEntityCustomer,
  SoleProprietorCustomer,
} from './types';

// ─────────────────────────────────────────────
// 通用类型
// ─────────────────────────────────────────────

export interface Branch {
  name: string;
  type: string;
  foundedAt: string;
  status: string;
}

export interface HistoryChange {
  date: string;
  item: string;
  before: string;
  after: string;
}

export interface Shareholder {
  name: string;
  type: string;
  amount: string; // "900"（万元字符串，便于带千分位）
  ratio: string;
  method: string;
  paidIn: string;
}

export interface Certification {
  name: string;
  issuer: string;
  certNumber: string;
  issuedAt: string;
  validTill: string;
}

export interface Product {
  name: string;
  category: string;
  revenueShare: string;
  customers: string;
  competitiveness: string;
}

export interface ManagementMember {
  name: string;
  position: string;
  idMasked: string;
  credit: string;
  investments: string;
  negative: string;
  sanction: string;
}

export interface RelatedEnterprise {
  name: string;
  type: '股权关联' | '供应链关联' | '人员关联';
  basis: string;
  status: string;
  tag: string;
}

export interface TopParty {
  name: string;
  share: string;
  amount: string;
  type: string;
  stability: string;
}

export interface ThreeYearRow {
  item: string;
  y2: string;
  y1: string;
  y: string;
  latest?: string;
  growth?: string;
}

export interface RatioRow {
  metric: string;
  y2: string;
  y1: string;
  y: string;
  industry?: string;
  evaluation: string;
}

export interface FinancingRow {
  type: string;
  count: string;
  total: string;
  balance: string;
  status: string;
}

export interface ShortInquiryRow {
  window: string;
  count: string;
  institutions: string;
  alert: string;
}

export interface CollateralRow {
  type: string;
  description: string;
  mortgagee: string;
  amount: string;
  status: string;
}

// ─────────────────────────────────────────────
// LE Profile
// ─────────────────────────────────────────────

export interface LegalEntityProfile {
  // 2.1 工商
  formerName: string;
  enterpriseType: string;
  registrationAuthority: string;
  registrationStatus: string;
  registeredAddress: string;
  businessScope: string;
  // 2.1.2 / 2.1.3
  branches: Branch[];
  historyChanges: HistoryChange[];
  // 2.2 股权
  shareholders: Shareholder[];
  controllerName: string;
  controllerDirectStake: string;
  controllerIndirectStake: string;
  controllerTotalStake: string;
  controllerIndirectVehicle: string; // "广州智造合伙"
  shareholderEvents: Array<{ kind: string; subject: string; amount: string; status: string; period: string }>;
  // 2.5 产品 + 资质
  products: Product[];
  certifications: Certification[];
  // 2.6 经营场所
  realEstateRights: string; // 不动产权证号
  factoryArea: number; // 平方米
  productionLines: number;
  capacity: string; // "2.8 亿元"
  capacityUtilization: string; // "76%"
  warehouse: string;
  customsRegistration: string;
  electricityStability: number;
  electricityVolatility: string;
  // 3.1 法人
  legalRepIdMasked: string;
  legalRepAge: number;
  legalRepGender: string;
  legalRepEducation: string;
  legalRepYearsInIndustry: number;
  legalRepCreditStatus: string;
  legalRepForeignInvestments: Array<{ name: string; role: string; ratio: string; status: string; foundedAt: string }>;
  // 3.3 董监高
  managementTeam: ManagementMember[];
  managementStabilityNote: string;
  // 3.4 关联
  relatedEnterprises: RelatedEnterprise[];
  totalRelatedCount: number;
  equityRelatedCount: number;
  supplyChainRelatedCount: number;
  // 4.4 上下游
  topCustomers: TopParty[];
  topSuppliers: TopParty[];
  // 4.5 用电 / 招聘
  electricity12mTotal: string;
  electricity12mGrowth: string;
  electricityMonthlyAvg: string;
  recruitmentCount12m: number;
  recruitmentPositions: string;
  // 5.1 三表
  balanceSheet: ThreeYearRow[];
  incomeStatement: ThreeYearRow[];
  cashFlowStatement: ThreeYearRow[];
  // 5.2 / 5.3 / 5.4 / 5.5 关键比率
  liquidityRatios: RatioRow[];
  profitabilityRatios: RatioRow[];
  cashFlowRatios: RatioRow[];
  operationRatios: RatioRow[];
  // 5.6 发票
  invoiceOverview: ThreeYearRow[];
  // 5.7 纳税
  taxFiling: ThreeYearRow[];
  // 6.1 融资
  financingHistory: FinancingRow[];
  // 6.2 多头
  longInquiryTotal: string;
  longInquiryInstitutions: string;
  longInquiryBank: string;
  longInquiryNonBank: string;
  shortInquiries: ShortInquiryRow[];
  // 6.3 招投标
  bidsCount: number;
  bidsWonCount: number;
  bidsWinRate: string;
  bidsWonAmount: string;
  bidsPerformanceRate: string;
  bidsRenewRate: string;
  importExportAmount: string;
  // 6.4 抵押
  collateralAssets: CollateralRow[];
  // 8.3 担保
  collateralProposals: CollateralRow[];
  collateralRationale: string;
  // 9 风险与缓释（具体行业/经营/财务/合规风险点）
  industryRisks: Array<{ point: string; description: string; likelihood: string; severity: string; mitigation: string }>;
  operationRisks: Array<{ point: string; description: string; likelihood: string; severity: string; mitigation: string }>;
  financeRisks: Array<{ point: string; description: string; likelihood: string; severity: string; mitigation: string }>;
  complianceRisks: Array<{ point: string; description: string; likelihood: string; severity: string; mitigation: string }>;
}

// ─────────────────────────────────────────────
// SP Profile
// ─────────────────────────────────────────────

export interface SoleProprietorProfile {
  // 2.1 经营者
  ownerIdMasked: string;
  ownerAge: number;
  ownerGender: string;
  ownerHukou: string; // 户籍地
  ownerCurrentResidence: string;
  ownerBirthDate: string;
  ownerEthnicity: string;
  ownerMobile: string;
  // 2.2 通讯
  mobileMonthsOnline: number;
  mobileCarrier: string;
  mobile3mAvgFee: string;
  mobile3mFeeTrend: string; // "168 → 110 → 124 元"
  mobile3mFeeVolatility: string;
  mobile6mShutdownCount: number;
  mobileCallMinutes: number;
  mobileFrequentContacts: number;
  mobileResidenceMatch: string;
  imeiStability: string;
  // 2.3 婚姻
  maritalStatus: string;
  spouseName: string;
  spouseAge: number;
  marriageDate: string;
  childrenInfo: string;
  familyStability: string;
  marriageDispute: string;
  // 2.4 教育
  highestEducation: string;
  graduateSchool: string;
  graduateDate: string;
  professionalHistory: string;
  yearsInIndustry: number;
  industry: string;
  // 3.1 店铺
  shopRegistrationAuthority: string;
  shopBusinessScope: string;
  shopMainProducts: string;
  shopVenueType: string;
  // 3.1.1 变更
  shopHistoryChanges: HistoryChange[];
  // 3.2 经营场所
  shopAddress: string;
  shopVerification: string;
  shopRentTerm: string;
  shopMonthlyRent: string;
  shopSurroundings: string;
  // 4.2 银行卡
  bankCard12mTotal: string;
  bankCardMonthlyTxCount: string;
  bankCardCounterpartiesCount: string;
  bankCardNightTransactionRatio: string;
  bankCardCateringMerchantRatio: string;
  bankCardSuspiciousTransaction: string;
  bankCardRiskScore: string;
  // 4.3 不动产
  realEstate: Array<{ certNumber: string; usage: string; area: string; location: string; sealStatus: string; mortgageStatus: string }>;
  realEstateValuation: string;
  // 4.4 车辆
  vehicles: Array<{ plate: string; model: string; purchaseDate: string; valuation: string; usage: string }>;
  // 4.5 还款能力
  monthlyIncomeEstimate: string;
  monthlyExpenseEstimate: string;
  monthlyDisposableEstimate: string;
  thisMonthlyPayment: string;
  paymentCoverage: string;
  recommendedCreditLimit: string;
  // 7.1 反欺诈五步（部分动态）
  multiHeadResult: string;
  // 行业经营条件分支：是否电商、是否烟草
  ecommerce?: { platform: string; rating: string; monthlyOrders: string; monthlySales: string; avgPrice: string; favorRate: string; complaintRate: string; repurchaseRate?: string };
  yancao?: { licenseNumber: string; licenseExpiry: string; monthlyOrderAmount: string; creditGrade: string; violationRecord: string; monthlyOrderCount: string; trend12m: string; deduction: string };
}

// ─────────────────────────────────────────────
// 默认填充：从 customer 基本字段推
// ─────────────────────────────────────────────

export function defaultLeProfile(c: LegalEntityCustomer): LegalEntityProfile {
  return {
    formerName: '—',
    enterpriseType: '有限责任公司（自然人投资或控股）',
    registrationAuthority: `${c.region.split(/省|市/)[0]}市监局（待补）`,
    registrationStatus: '存续（在营）',
    registeredAddress: c.region,
    businessScope: '一般项目（详见工商登记原文）；许可项目（依法须经批准）。',
    branches: [],
    historyChanges: [],
    shareholders: [
      { name: c.legalRepresentative, type: '自然人', amount: String(c.registeredCapital), ratio: '100%', method: '货币', paidIn: '已实缴' },
    ],
    controllerName: c.legalRepresentative,
    controllerDirectStake: '100%',
    controllerIndirectStake: '0%',
    controllerTotalStake: '100%',
    controllerIndirectVehicle: '—',
    shareholderEvents: [],
    products: [],
    certifications: [],
    realEstateRights: '—',
    factoryArea: 0,
    productionLines: 0,
    capacity: '—',
    capacityUtilization: '—',
    warehouse: '—',
    customsRegistration: '无海关备案',
    electricityStability: 70,
    electricityVolatility: '0.20',
    legalRepIdMasked: '———',
    legalRepAge: 0,
    legalRepGender: '—',
    legalRepEducation: '—',
    legalRepYearsInIndustry: 0,
    legalRepCreditStatus: '良好（无逾期、无失信）',
    legalRepForeignInvestments: [],
    managementTeam: [],
    managementStabilityNote: '近三年董监高情况待补充。',
    relatedEnterprises: [],
    totalRelatedCount: 0,
    equityRelatedCount: 0,
    supplyChainRelatedCount: 0,
    topCustomers: [],
    topSuppliers: [],
    electricity12mTotal: '—',
    electricity12mGrowth: '—',
    electricityMonthlyAvg: '—',
    recruitmentCount12m: 0,
    recruitmentPositions: '—',
    balanceSheet: [],
    incomeStatement: [],
    cashFlowStatement: [],
    liquidityRatios: [],
    profitabilityRatios: [],
    cashFlowRatios: [],
    operationRatios: [],
    invoiceOverview: [],
    taxFiling: [],
    financingHistory: [],
    longInquiryTotal: '—',
    longInquiryInstitutions: '—',
    longInquiryBank: '—',
    longInquiryNonBank: '—',
    shortInquiries: [],
    bidsCount: 0,
    bidsWonCount: 0,
    bidsWinRate: '—',
    bidsWonAmount: '—',
    bidsPerformanceRate: '—',
    bidsRenewRate: '—',
    importExportAmount: '—',
    collateralAssets: [],
    collateralProposals: [],
    collateralRationale: '担保方案待审批人员根据具体业务确认。',
    industryRisks: [],
    operationRisks: [],
    financeRisks: [],
    complianceRisks: [],
  };
}

export function defaultSpProfile(c: SoleProprietorCustomer): SoleProprietorProfile {
  return {
    ownerIdMasked: '———',
    ownerAge: 0,
    ownerGender: '—',
    ownerHukou: c.region,
    ownerCurrentResidence: c.region,
    ownerBirthDate: '—',
    ownerEthnicity: '—',
    ownerMobile: '—',
    mobileMonthsOnline: 0,
    mobileCarrier: '—',
    mobile3mAvgFee: '—',
    mobile3mFeeTrend: '—',
    mobile3mFeeVolatility: '—',
    mobile6mShutdownCount: 0,
    mobileCallMinutes: 0,
    mobileFrequentContacts: 0,
    mobileResidenceMatch: '与户籍地一致',
    imeiStability: '稳定',
    maritalStatus: '—',
    spouseName: '—',
    spouseAge: 0,
    marriageDate: '—',
    childrenInfo: '—',
    familyStability: '—',
    marriageDispute: '无',
    highestEducation: '—',
    graduateSchool: '—',
    graduateDate: '—',
    professionalHistory: '—',
    yearsInIndustry: 0,
    industry: c.industry,
    shopRegistrationAuthority: `${c.region.split(/省|市/)[0]}市场监督管理局`,
    shopBusinessScope: c.industry,
    shopMainProducts: c.shopType,
    shopVenueType: '—',
    shopHistoryChanges: [],
    shopAddress: c.region,
    shopVerification: '—',
    shopRentTerm: '—',
    shopMonthlyRent: '—',
    shopSurroundings: '—',
    bankCard12mTotal: '—',
    bankCardMonthlyTxCount: '—',
    bankCardCounterpartiesCount: '—',
    bankCardNightTransactionRatio: '—',
    bankCardCateringMerchantRatio: '—',
    bankCardSuspiciousTransaction: '无',
    bankCardRiskScore: '—',
    realEstate: [],
    realEstateValuation: '—',
    vehicles: [],
    monthlyIncomeEstimate: '—',
    monthlyExpenseEstimate: '—',
    monthlyDisposableEstimate: '—',
    thisMonthlyPayment: '—',
    paymentCoverage: '—',
    recommendedCreditLimit: '—',
    multiHeadResult: '关注（具体数据待补充）',
  };
}

// ─────────────────────────────────────────────
// 已知客户的 override（partial）
// 注意：键名必须与上面的字段一一对应；缺失字段自动用 default
// ─────────────────────────────────────────────

const LE_OVERRIDES: Record<string, Partial<LegalEntityProfile>> = {
  // ─────────────────────────────────────────────
  // D 级风险拒绝场景 · 中山小榄五金加工
  // 多项一票否决触发，演示拦截
  // ─────────────────────────────────────────────
  'LE-2026-04-006': {
    formerName: '中山小榄日盛五金厂（2014-2019）',
    enterpriseType: '有限责任公司（自然人独资）',
    registrationAuthority: '中山市市场监督管理局小榄分局',
    registrationStatus: '存续（已被列入经营异常）',
    registeredAddress: '广东省中山市小榄镇广源路 38 号',
    businessScope: '一般项目：五金件加工、表面处理、机械零部件销售；金属冲压（依法须经批准的项目除外）。',
    branches: [],
    historyChanges: [
      { date: '2024-11-22', item: '法定代表人', before: '前法定代表人', after: '张伟强' },
      { date: '2023-08-15', item: '注册资本', before: '500 万', after: '300 万（减资）' },
      { date: '2022-03-08', item: '股东', before: '原股东', after: '股东变更' },
    ],
    shareholders: [
      { name: '张伟强', type: '自然人', amount: '270', ratio: '90%', method: '货币', paidIn: '部分实缴 180 万' },
      { name: '张明华', type: '自然人', amount: '30', ratio: '10%', method: '货币', paidIn: '已实缴' },
    ],
    controllerName: '张伟强',
    controllerDirectStake: '90%',
    controllerIndirectStake: '0%',
    controllerTotalStake: '90%',
    controllerIndirectVehicle: '—',
    shareholderEvents: [
      { kind: '股权冻结', subject: '张伟强（90%）', amount: '270 万', status: '已冻结', period: '2025-10-15 至今' },
    ],
    products: [
      { name: '五金冲压件', category: '通用零件', revenueShare: '70%', customers: '小型加工企业', competitiveness: '低端价格竞争，无技术壁垒' },
      { name: '表面处理服务', category: '加工服务', revenueShare: '30%', customers: '中山本地厂商', competitiveness: '环保设备老旧，已被处罚' },
    ],
    certifications: [],
    realEstateRights: '租赁（无自有产权）',
    factoryArea: 1200,
    productionLines: 2,
    capacity: '1,800 万元',
    capacityUtilization: '32%',
    warehouse: '原厂区共用 200 ㎡',
    customsRegistration: '无海关备案',
    electricityStability: 38,
    electricityVolatility: '0.62',
    legalRepIdMasked: '442000****0815',
    legalRepAge: 51,
    legalRepGender: '男',
    legalRepEducation: '初中',
    legalRepYearsInIndustry: 22,
    legalRepCreditStatus: '不良（已被列入失信被执行人）',
    legalRepForeignInvestments: [
      { name: '中山小榄五金加工有限公司', role: '法定代表人 / 大股东', ratio: '90%', status: '存续（异常）', foundedAt: '2014-09-10' },
      { name: '佛山张氏机械配件厂（已注销）', role: '股东', ratio: '60%', status: '已注销 2023', foundedAt: '2018-06-12' },
    ],
    managementTeam: [
      { name: '张伟强', position: '法人 / 总经理', idMasked: '442000****0815', credit: '不良（失信）', investments: '2', negative: '失信被执行 + 限高', sanction: '已限高' },
      { name: '张明华', position: '股东', idMasked: '442000****0712', credit: '一般', investments: '1', negative: '无', sanction: '无' },
    ],
    managementStabilityNote: '近一年法定代表人变更 1 次，涉及股权冻结。核心团队不稳定，无健全财务部门，资金流向监控薄弱。',
    relatedEnterprises: [
      { name: '佛山张氏机械配件厂', type: '股权关联', basis: '张伟强曾任股东', status: '已注销', tag: '已注销，关联减弱' },
    ],
    totalRelatedCount: 3,
    equityRelatedCount: 2,
    supplyChainRelatedCount: 1,
    topCustomers: [
      { name: 'A 加工厂', share: '32.4%', amount: '485 万', type: '本地小型', stability: '近 6 月减少 40%' },
      { name: 'B 五金贸易', share: '18.6%', amount: '278 万', type: '本地小型', stability: '回款逾期' },
      { name: 'C 工程公司', share: '12.1%', amount: '180 万', type: '本地小型', stability: '已停止合作' },
    ],
    topSuppliers: [
      { name: '本地钢材市场', share: '45%', amount: '670 万', type: '原材料', stability: '现款交易' },
      { name: '小榄电镀加工', share: '12%', amount: '180 万', type: '加工外包', stability: '已停止' },
    ],
    electricity12mTotal: '32 万度',
    electricity12mGrowth: '-58%',
    electricityMonthlyAvg: '2.7 万度（断崖下降）',
    recruitmentCount12m: 0,
    recruitmentPositions: '近 12 月未招聘（异常）',
    balanceSheet: [
      { item: '流动资产合计', y2: '1,560', y1: '1,180', y: '780', latest: '780', growth: '-33.9%' },
      { item: '　货币资金', y2: '180', y1: '85', y: '32', latest: '32', growth: '-62.4%' },
      { item: '　应收账款', y2: '820', y1: '690', y: '510', latest: '510', growth: '-26.1%' },
      { item: '　存货', y2: '460', y1: '380', y: '220', latest: '220', growth: '-42.1%' },
      { item: '资产总计', y2: '2,180', y1: '1,820', y: '1,420', latest: '1,420', growth: '-22.0%' },
      { item: '流动负债', y2: '1,420', y1: '1,580', y: '1,680', latest: '1,680', growth: '+6.3%' },
      { item: '　短期借款', y2: '320', y1: '480', y: '650', latest: '650', growth: '+35.4%' },
      { item: '所有者权益', y2: '600', y1: '120', y: '-380', latest: '-380', growth: '资不抵债' },
    ],
    incomeStatement: [
      { item: '营业收入', y2: '2,820', y1: '2,180', y: '1,490', latest: '1,490', growth: '-31.7%' },
      { item: '营业成本', y2: '2,480', y1: '2,090', y: '1,520', latest: '1,520', growth: '-27.3%' },
      { item: '毛利率', y2: '12.1%', y1: '4.1%', y: '-2.0%', latest: '-2.0%', growth: '转负' },
      { item: '净利润', y2: '180', y1: '-280', y: '-580', latest: '-580', growth: '亏损扩大' },
      { item: '净利率', y2: '6.4%', y1: '-12.8%', y: '-38.9%', latest: '-38.9%', growth: '严重恶化' },
    ],
    cashFlowStatement: [
      { item: '经营活动现金流量净额', y2: '180', y1: '-220', y: '-410', latest: '-410', growth: '持续流出' },
      { item: '投资活动现金流量净额', y2: '-50', y1: '-30', y: '-15', latest: '-15', growth: '已无投资' },
      { item: '筹资活动现金流量净额', y2: '+80', y1: '+260', y: '+360', latest: '+360', growth: '依赖借款' },
    ],
    liquidityRatios: [
      { metric: '资产负债率', y2: '72.5%', y1: '93.4%', y: '126.8%', industry: '52%', evaluation: '严重恶化（资不抵债）' },
      { metric: '流动比率', y2: '1.10', y1: '0.75', y: '0.46', industry: '1.65', evaluation: '远低于行业' },
      { metric: '速动比率', y2: '0.77', y1: '0.51', y: '0.33', industry: '1.10', evaluation: '极差' },
    ],
    profitabilityRatios: [
      { metric: '毛利率', y2: '12.1%', y1: '4.1%', y: '-2.0%', industry: '15%', evaluation: '严重恶化' },
      { metric: '净利率', y2: '6.4%', y1: '-12.8%', y: '-38.9%', industry: '5%', evaluation: '严重亏损' },
    ],
    cashFlowRatios: [
      { metric: '经营性现金流（万）', y2: '180', y1: '-220', y: '-410', evaluation: '持续流出' },
      { metric: '净现比', y2: '1.00', y1: '0.79', y: '0.71', evaluation: '已无意义（亏损）' },
    ],
    operationRatios: [
      { metric: '应收账款周转天数', y2: '105 天', y1: '128 天', y: '186 天', industry: '90 天', evaluation: '回款严重恶化' },
      { metric: '存货周转天数', y2: '62 天', y1: '78 天', y: '95 天', industry: '85 天', evaluation: '关注' },
    ],
    invoiceOverview: [
      { item: '销项发票数', y2: '485 张', y1: '362 张', y: '186 张', latest: '186 张' },
      { item: '销项金额（万）', y2: '2,810', y1: '2,160', y: '1,480', latest: '1,480' },
      { item: '作废率', y2: '3.2%', y1: '5.8%', y: '8.4%', latest: '8.4%' },
      { item: '上下游匹配度', y2: '78%', y1: '62%', y: '45%', latest: '45%' },
    ],
    taxFiling: [
      { item: '增值税申报额（万）', y2: '52', y1: '38', y: '12' },
      { item: '纳税信用评级', y2: 'C', y1: 'D', y: 'D（已下调）' },
      { item: '是否欠税', y2: '否', y1: '是（已结清）', y: '是（38 万元未结清）' },
      { item: '是否税收违法', y2: '否', y1: '是（轻微）', y: '是（重大税收违法 2025-08）' },
    ],
    financingHistory: [
      { type: '流动资金贷款', count: '4', total: '850', balance: '650', status: '逾期（90+ 天）' },
      { type: '银行承兑汇票', count: '0', total: '0', balance: '0', status: '—' },
      { type: '其他', count: '2', total: '180', balance: '120', status: '逾期' },
      { type: '合计', count: '6', total: '1,030', balance: '770', status: '存在逾期' },
    ],
    longInquiryTotal: '52 次',
    longInquiryInstitutions: '14 家',
    longInquiryBank: '23 次（44.2%）',
    longInquiryNonBank: '29 次（55.8%）',
    shortInquiries: [
      { window: '近 1 天', count: '3', institutions: '3', alert: '红（高危）' },
      { window: '近 3 天', count: '7', institutions: '5', alert: '红（高危）' },
      { window: '近 7 天', count: '12', institutions: '8', alert: '红（高危）' },
      { window: '近 15 天', count: '21', institutions: '12', alert: '红（高危）' },
    ],
    bidsCount: 0,
    bidsWonCount: 0,
    bidsWinRate: '—',
    bidsWonAmount: '—',
    bidsPerformanceRate: '—',
    bidsRenewRate: '—',
    importExportAmount: '无',
    collateralAssets: [
      { type: '动产抵押', description: '冲压设备 2 台', mortgagee: '中山某城商行', amount: '85', status: '已质押 + 二押' },
      { type: '不动产', description: '无', mortgagee: '—', amount: '0', status: '租赁厂房' },
    ],
    collateralProposals: [
      { type: '—', description: '不建议批准本次申请', mortgagee: '—', amount: '—', status: '不适用' },
    ],
    collateralRationale: '本企业已被列入失信被执行人，不动产无可抵押资产，动产已存在二次质押，不具备增信空间。建议直接拒绝。',
    industryRisks: [
      { point: '行业产能过剩', description: '小榄五金加工小作坊密集，价格战', likelihood: '高', severity: '高', mitigation: '已无缓释空间' },
      { point: '环保高压', description: '小榄镇电镀整治', likelihood: '高', severity: '高', mitigation: '已被处罚 2 次' },
    ],
    operationRisks: [
      { point: '订单断崖', description: '近 6 月订单减少 60%', likelihood: '已发生', severity: '极高', mitigation: '不可缓释' },
      { point: '客户集中度恶化', description: '前三客户占比 63%，回款逾期', likelihood: '已发生', severity: '极高', mitigation: '不可缓释' },
      { point: '用电断崖', description: '近 6 月用电下降 58%', likelihood: '已发生', severity: '高', mitigation: '已停产/半停产' },
    ],
    financeRisks: [
      { point: '资不抵债', description: '所有者权益 -380 万元', likelihood: '已发生', severity: '极高', mitigation: '不可缓释' },
      { point: '应收周转恶化', description: '186 天，行业 90 天', likelihood: '已发生', severity: '极高', mitigation: '已计提坏账' },
      { point: '亏损扩大', description: '净利率 -38.9%', likelihood: '已发生', severity: '极高', mitigation: '不可缓释' },
    ],
    complianceRisks: [
      { point: '失信被执行人', description: '法定代表人已被列入', likelihood: '已发生', severity: '极高', mitigation: '一票否决直接拒绝' },
      { point: '重大税收违法', description: '2025-08 被认定', likelihood: '已发生', severity: '极高', mitigation: '一票否决直接拒绝' },
      { point: '股权冻结', description: '90% 股权已被冻结', likelihood: '已发生', severity: '高', mitigation: '不可缓释' },
      { point: '经营异常', description: '已被列入企业经营异常名录', likelihood: '已发生', severity: '高', mitigation: '不可缓释' },
    ],
  },

  // ─────────────────────────────────────────────
  // C 级风险关注 · 江门台山亿达水产养殖
  // 雷达缺角、有条件批准
  // ─────────────────────────────────────────────
  'LE-2026-04-008': {
    formerName: '台山市亿达养殖场（个体工商户，2010-2016 转制）',
    enterpriseType: '有限责任公司（自然人独资）',
    registrationAuthority: '江门市台山市市场监督管理局',
    registrationStatus: '存续（在营）',
    registeredAddress: '广东省江门市台山市广海镇沙湾村',
    businessScope: '水产品养殖（鱼苗、对虾、海鲈鱼）；水产品收购、运输、批发；饲料零售。',
    branches: [],
    historyChanges: [
      { date: '2025-06-12', item: '注册资本', before: '150 万', after: '200 万' },
    ],
    shareholders: [
      { name: '邓建国', type: '自然人', amount: '200', ratio: '100%', method: '货币 + 实物', paidIn: '已实缴' },
    ],
    controllerName: '邓建国',
    controllerDirectStake: '100%',
    controllerIndirectStake: '0%',
    controllerTotalStake: '100%',
    controllerIndirectVehicle: '—',
    shareholderEvents: [],
    products: [
      { name: '海鲈鱼养殖', category: '水产养殖', revenueShare: '55%', customers: '广州、佛山批发商', competitiveness: '当地龙头之一，但议价能力弱' },
      { name: '对虾养殖', category: '水产养殖', revenueShare: '30%', customers: '本地市场 + 出口', competitiveness: '受疫病风险影响' },
      { name: '鱼苗销售', category: '配套', revenueShare: '15%', customers: '周边养殖户', competitiveness: '稳定' },
    ],
    certifications: [
      { name: '水产养殖许可证', issuer: '台山市农业农村局', certNumber: '台山农水（2021）X-038', issuedAt: '2021-04-10', validTill: '2026-04-09（即将到期）' },
    ],
    realEstateRights: '塘租赁（30 年承包，2015-2045）',
    factoryArea: 0,
    productionLines: 0,
    capacity: '年产成鱼 280 吨 / 对虾 95 吨',
    capacityUtilization: '85%（受疫病影响）',
    warehouse: '冷库 1 座（300 ㎡，自建）',
    customsRegistration: '无海关备案',
    electricityStability: 58,
    electricityVolatility: '0.42（季节性大）',
    legalRepIdMasked: '440783****0312',
    legalRepAge: 56,
    legalRepGender: '男',
    legalRepEducation: '初中',
    legalRepYearsInIndustry: 28,
    legalRepCreditStatus: '良好（人行征信无不良）',
    legalRepForeignInvestments: [
      { name: '江门台山亿达水产养殖有限公司', role: '法人 / 唯一股东', ratio: '100%', status: '存续', foundedAt: '2016-02-18' },
    ],
    managementTeam: [
      { name: '邓建国', position: '法人 / 总经理', idMasked: '440783****0312', credit: '良好', investments: '1', negative: '无', sanction: '无' },
      { name: '邓秀英', position: '出纳（家庭成员）', idMasked: '440783****0205', credit: '一般', investments: '0', negative: '无', sanction: '无' },
    ],
    managementStabilityNote: '家庭式管理，无独立财务体系，所有重大决策由法人个人决定。建议授信中要求规范财务管理。',
    relatedEnterprises: [],
    totalRelatedCount: 0,
    equityRelatedCount: 0,
    supplyChainRelatedCount: 0,
    topCustomers: [
      { name: '广州黄沙水产批发市场某档', share: '32.4%', amount: '178 万', type: '批发市场', stability: '8 年合作' },
      { name: '佛山顺德某餐饮供应商', share: '21.5%', amount: '118 万', type: '餐饮供应链', stability: '5 年合作' },
      { name: '台山本地批发', share: '18.2%', amount: '100 万', type: '本地', stability: '稳定' },
    ],
    topSuppliers: [
      { name: '通威饲料', share: '52%', amount: '210 万', type: '饲料', stability: '6 年' },
      { name: '本地虾苗供应', share: '18%', amount: '72 万', type: '虾苗', stability: '现款' },
    ],
    electricity12mTotal: '24 万度',
    electricity12mGrowth: '-12%',
    electricityMonthlyAvg: '2.0 万度',
    recruitmentCount12m: 2,
    recruitmentPositions: '养殖工 2 人',
    balanceSheet: [
      { item: '流动资产合计', y2: '385', y1: '420', y: '402', latest: '402', growth: '-4.3%' },
      { item: '　货币资金', y2: '32', y1: '28', y: '18', latest: '18', growth: '-35.7%' },
      { item: '　应收账款', y2: '128', y1: '155', y: '178', latest: '178', growth: '+14.8%' },
      { item: '　存货（生物资产）', y2: '180', y1: '210', y: '180', latest: '180', growth: '-14.3%' },
      { item: '资产总计', y2: '720', y1: '780', y: '760', latest: '760', growth: '-2.6%' },
      { item: '流动负债', y2: '380', y1: '450', y: '510', latest: '510', growth: '+13.3%' },
      { item: '所有者权益', y2: '320', y1: '300', y: '230', latest: '230', growth: '-23.3%' },
    ],
    incomeStatement: [
      { item: '营业收入', y2: '620', y1: '580', y: '548', latest: '548', growth: '-5.5%' },
      { item: '营业成本', y2: '510', y1: '498', y: '496', latest: '496', growth: '-0.4%' },
      { item: '毛利率', y2: '17.7%', y1: '14.1%', y: '9.5%', latest: '9.5%', growth: '-4.6pp' },
      { item: '净利润', y2: '52', y1: '20', y: '-72', latest: '-72', growth: '转亏' },
      { item: '净利率', y2: '8.4%', y1: '3.4%', y: '-13.1%', latest: '-13.1%', growth: '严重恶化' },
    ],
    cashFlowStatement: [
      { item: '经营活动现金流量净额', y2: '+85', y1: '+22', y: '-58', latest: '-58', growth: '转负' },
      { item: '投资活动现金流量净额', y2: '-25', y1: '-18', y: '-12', latest: '-12', growth: '减少投入' },
      { item: '筹资活动现金流量净额', y2: '-30', y1: '+15', y: '+62', latest: '+62', growth: '依赖借款' },
    ],
    liquidityRatios: [
      { metric: '资产负债率', y2: '55.6%', y1: '61.5%', y: '69.7%', industry: '58%', evaluation: '已超行业' },
      { metric: '流动比率', y2: '1.01', y1: '0.93', y: '0.79', industry: '1.40', evaluation: '关注' },
      { metric: '速动比率', y2: '0.54', y1: '0.47', y: '0.43', industry: '0.85', evaluation: '关注' },
    ],
    profitabilityRatios: [
      { metric: '毛利率', y2: '17.7%', y1: '14.1%', y: '9.5%', industry: '15%', evaluation: '低于行业' },
      { metric: '净利率', y2: '8.4%', y1: '3.4%', y: '-13.1%', industry: '5%', evaluation: '严重恶化' },
    ],
    cashFlowRatios: [
      { metric: '经营性现金流（万）', y2: '+85', y1: '+22', y: '-58', evaluation: '转负，关注' },
      { metric: '净现比', y2: '1.63', y1: '1.10', y: '0.81', evaluation: '下滑' },
    ],
    operationRatios: [
      { metric: '应收账款周转天数', y2: '78 天', y1: '95 天', y: '125 天', industry: '60 天', evaluation: '严重高于行业' },
      { metric: '存货周转天数', y2: '128 天', y1: '152 天', y: '135 天', industry: '110 天', evaluation: '偏高' },
    ],
    invoiceOverview: [
      { item: '销项发票数', y2: '186 张', y1: '162 张', y: '142 张', latest: '142 张' },
      { item: '销项金额（万）', y2: '618', y1: '578', y: '545', latest: '545' },
      { item: '作废率', y2: '0.5%', y1: '0.8%', y: '1.2%', latest: '1.2%' },
    ],
    taxFiling: [
      { item: '增值税申报额（万）', y2: '15', y1: '12', y: '8' },
      { item: '纳税信用评级', y2: 'B', y1: 'B', y: 'B' },
      { item: '是否欠税', y2: '否', y1: '否', y: '否' },
      { item: '是否税收违法', y2: '否', y1: '否', y: '否' },
    ],
    financingHistory: [
      { type: '流动资金贷款', count: '3', total: '180', balance: '120', status: '正常' },
      { type: '涉农经营贷', count: '2', total: '60', balance: '60', status: '正常' },
      { type: '合计', count: '5', total: '240', balance: '180', status: '全部正常' },
    ],
    longInquiryTotal: '18 次',
    longInquiryInstitutions: '7 家',
    longInquiryBank: '14 次（77.8%）',
    longInquiryNonBank: '4 次（22.2%）',
    shortInquiries: [
      { window: '近 1 天', count: '0', institutions: '0', alert: '蓝（正常）' },
      { window: '近 3 天', count: '2', institutions: '2', alert: '蓝（正常）' },
      { window: '近 7 天', count: '5', institutions: '4', alert: '黄（关注）' },
      { window: '近 15 天', count: '8', institutions: '6', alert: '黄（关注）' },
    ],
    bidsCount: 5,
    bidsWonCount: 2,
    bidsWinRate: '40.0%',
    bidsWonAmount: '180 万元（农业供应链项目）',
    bidsPerformanceRate: '100%',
    bidsRenewRate: '70%',
    importExportAmount: '无',
    collateralAssets: [
      { type: '动产抵押', description: '冷库设备 + 增氧设备', mortgagee: '台山农商行', amount: '60', status: '有效' },
    ],
    collateralProposals: [
      { type: '动产抵押（追加）', description: '增氧设备 / 投饵机', mortgagee: '—', amount: '40', status: '净覆盖额 30 / 抵押率 75%' },
      { type: '担保保证', description: '台山农担', mortgagee: '—', amount: '—', status: '建议接入农担分险' },
      { type: '联保', description: '本地养殖大户互保', mortgagee: '—', amount: '—', status: '可考虑' },
    ],
    collateralRationale:
      '本企业资产以生物资产（活鱼活虾）为主，难以传统抵押。建议采用「动产抵押 + 农担分险 + 主要客户回款托管」组合方案，控制风险敞口在 50 万元以内，期限不超过 6 个月。',
    industryRisks: [
      { point: '疫病风险', description: '近年华南地区对虾白斑病高发', likelihood: '中', severity: '高', mitigation: '要求购买养殖险' },
      { point: '台风极端天气', description: '广海镇属台风高发区', likelihood: '中', severity: '中', mitigation: '已购台风险' },
      { point: '饲料价格波动', description: '玉米/豆粕价格', likelihood: '高', severity: '中', mitigation: '签订半年期采购合同' },
    ],
    operationRisks: [
      { point: '客户集中度', description: '前三客户占 72%', likelihood: '中', severity: '高', mitigation: '客户多元化 + 月报' },
      { point: '应收账款延长', description: '125 天，行业 60 天', likelihood: '已发生', severity: '高', mitigation: '主要客户回款托管' },
      { point: '家庭式管理', description: '无独立财务', likelihood: '中', severity: '中', mitigation: '要求外部记账' },
    ],
    financeRisks: [
      { point: '净利转负', description: '2025 年 -72 万', likelihood: '已发生', severity: '高', mitigation: '严格控制额度' },
      { point: '现金流净流出', description: '经营性现金流 -58 万', likelihood: '已发生', severity: '高', mitigation: '回款托管 + 短期限' },
      { point: '资产负债率上升', description: '69.7%，已超行业', likelihood: '已发生', severity: '中', mitigation: '本次贷款不增加负债' },
    ],
    complianceRisks: [
      { point: '养殖许可证临期', description: '2026-04 到期', likelihood: '高', severity: '中', mitigation: '续期完成方可放款' },
      { point: '环保合规', description: '尾水排放新规', likelihood: '中', severity: '中', mitigation: '督促整改' },
      { point: '土地承包风险', description: '塘地为村集体土地', likelihood: '低', severity: '低', mitigation: '已签 30 年合同' },
    ],
  },

  'LE-2026-04-001': {
    formerName: '广州东海机电设备有限公司（2018-2020）',
    enterpriseType: '有限责任公司（自然人投资或控股）',
    registrationAuthority: '广州市市场监督管理局黄埔分局',
    registrationStatus: '存续（在营）',
    registeredAddress: '广东省广州市黄埔区科学城掬泉路 11 号',
    businessScope:
      '许可项目：第二类、第三类医疗器械生产；一般项目：智能机器人的研发、制造、销售；工业自动化控制系统装置制造；专用设备修理；机电设备销售；技术进出口；货物进出口（除依法须经批准的项目外，凭营业执照依法自主开展经营活动）。',
    branches: [
      { name: '广州东海智能装备东莞分公司', type: '分公司', foundedAt: '2022-08-15', status: '存续' },
      { name: '广州东海智能装备上海办事处', type: '办事处', foundedAt: '2023-04-20', status: '存续' },
    ],
    historyChanges: [
      { date: '2026-02-15', item: '经营范围', before: '原经营范围', after: '新增"智能机器人研发"' },
      { date: '2024-06-08', item: '注册资本', before: '1,000 万', after: '1,500 万' },
    ],
    shareholders: [
      { name: '陈志刚', type: '自然人', amount: '900', ratio: '60%', method: '货币', paidIn: '已实缴' },
      { name: '广州智造合伙企业（有限合伙）', type: '合伙企业', amount: '375', ratio: '25%', method: '货币', paidIn: '已实缴' },
      { name: '李敏', type: '自然人', amount: '225', ratio: '15%', method: '货币', paidIn: '已实缴' },
    ],
    controllerName: '陈志刚',
    controllerDirectStake: '60%',
    controllerIndirectStake: '12%',
    controllerTotalStake: '72%',
    controllerIndirectVehicle: '广州智造合伙',
    products: [
      { name: '智能物流分拣系统', category: '智能装备', revenueShare: '45%', customers: '电商物流、医药仓储', competitiveness: '华南区市占率 Top 3' },
      { name: '工业机器人集成', category: '机器人系统', revenueShare: '30%', customers: '汽车零部件、电子', competitiveness: '响应速度快，定制化能力强' },
      { name: '售后服务及配件', category: '服务', revenueShare: '25%', customers: '存量客户', competitiveness: '续约率 85%' },
    ],
    certifications: [
      { name: '高新技术企业证书', issuer: '广东省科技厅', certNumber: 'GR202144000XXX', issuedAt: '2021-11-30', validTill: '2024-11-29' },
      { name: 'ISO 9001 质量管理体系', issuer: '中环联合认证中心', certNumber: '00121Q3XXXX', issuedAt: '2022-05-12', validTill: '2025-05-11' },
    ],
    realEstateRights: '粤（2021）广州市不动产权第 06300142 号',
    factoryArea: 8400,
    productionLines: 5,
    capacity: '2.8 亿元',
    capacityUtilization: '76%',
    warehouse: '东莞租赁仓库 1,200 平方米',
    customsRegistration: '具备海关备案，2025 年进出口额 320 万美元',
    electricityStability: 76,
    electricityVolatility: '0.18',
    legalRepIdMasked: '440106****1015',
    legalRepAge: 52,
    legalRepGender: '男',
    legalRepEducation: '本科（机械工程）',
    legalRepYearsInIndustry: 30,
    legalRepCreditStatus: '良好（无逾期、无失信）',
    legalRepForeignInvestments: [
      { name: '广州东海智能装备有限公司', role: '法定代表人 / 股东', ratio: '60%', status: '存续', foundedAt: '2018-03-12' },
      { name: '东海智能装备（香港）有限公司', role: '董事', ratio: '70%（境外）', status: '存续', foundedAt: '2021-09-08' },
      { name: '广州智造合伙企业（有限合伙）', role: '执行事务合伙人', ratio: '出资 30%', status: '存续', foundedAt: '2020-05-15' },
    ],
    managementTeam: [
      { name: '陈志刚', position: '董事长 / 总经理', idMasked: '440106****1015', credit: '良好', investments: '3', negative: '无', sanction: '无' },
      { name: '王丽', position: '财务总监 / CFO', idMasked: '440106****2206', credit: '良好', investments: '1', negative: '无', sanction: '无' },
      { name: '张明', position: '技术总监 / CTO', idMasked: '440106****0708', credit: '良好', investments: '0', negative: '无', sanction: '无' },
      { name: '李强', position: '生产总监', idMasked: '440106****1809', credit: '良好', investments: '0', negative: '无', sanction: '无' },
    ],
    managementStabilityNote: '近三年董监高无变动，核心团队整体稳定。CFO 王丽为陈志刚配偶，需在关联交易披露中体现。家族成员任职 1 项（CFO），未达"重大关联"披露阈值。',
    relatedEnterprises: [
      { name: '东海智能装备（香港）', type: '股权关联', basis: '陈志刚控制 70%', status: '存续', tag: '关联交易关注' },
      { name: '广州智造合伙企业', type: '股权关联', basis: '陈志刚为执行合伙人', status: '存续', tag: '正常' },
      { name: '深圳东海贸易有限公司', type: '供应链关联', basis: '股东重叠', status: '存续', tag: '正常' },
    ],
    totalRelatedCount: 12,
    equityRelatedCount: 5,
    supplyChainRelatedCount: 7,
    topCustomers: [
      { name: 'XX 物流集团', share: '12.4%', amount: '2,710 万', type: '物流', stability: '5 年稳定' },
      { name: 'YY 医药仓储', share: '8.1%', amount: '1,770 万', type: '医药', stability: '3 年稳定' },
      { name: 'ZZ 电子', share: '7.5%', amount: '1,640 万', type: '电子', stability: '4 年稳定' },
      { name: '东海智能装备（香港）', share: '6.8%', amount: '1,490 万', type: '关联方', stability: '需审查' },
      { name: 'AA 智能科技', share: '3.6%', amount: '790 万', type: '电子', stability: '2 年新增' },
    ],
    topSuppliers: [
      { name: '汇川技术', share: '9.2%', amount: '1,310 万', type: '伺服电机', stability: '6 年稳定' },
      { name: '基恩士（中国）', share: '7.4%', amount: '1,050 万', type: '传感器', stability: '5 年稳定' },
      { name: '本地钢材代理', share: '6.8%', amount: '970 万', type: '原材料', stability: '6 年稳定' },
      { name: '深圳东海贸易', share: '6.7%', amount: '950 万', type: '关联方', stability: '需审查' },
    ],
    electricity12mTotal: '218.4 万度',
    electricity12mGrowth: '+12.4%',
    electricityMonthlyAvg: '18.2 万度',
    recruitmentCount12m: 12,
    recruitmentPositions: '高级机械工程师 4 / 销售经理 3 / 调试工程师 5',
    balanceSheet: [
      { item: '流动资产合计', y2: '4,820', y1: '5,640', y: '6,250', latest: '6,250', growth: '+10.8%' },
      { item: '　货币资金', y2: '820', y1: '1,150', y: '1,420', latest: '1,420', growth: '+23.5%' },
      { item: '　应收账款', y2: '1,650', y1: '2,210', y: '2,840', latest: '2,840', growth: '+28.5%' },
      { item: '　存货', y2: '1,860', y1: '1,950', y: '1,580', latest: '1,580', growth: '-19.0%' },
      { item: '非流动资产合计', y2: '1,540', y1: '1,750', y: '1,950', latest: '1,950', growth: '+11.4%' },
      { item: '　固定资产', y2: '1,420', y1: '1,580', y: '1,740', latest: '1,740', growth: '+10.1%' },
      { item: '资产总计', y2: '6,360', y1: '7,390', y: '8,200', latest: '8,200', growth: '+11.0%' },
      { item: '流动负债', y2: '2,580', y1: '3,120', y: '3,620', latest: '3,620', growth: '+16.0%' },
      { item: '　应付账款', y2: '1,180', y1: '1,420', y: '1,650', latest: '1,650', growth: '+16.2%' },
      { item: '　短期借款', y2: '500', y1: '700', y: '900', latest: '900', growth: '+28.6%' },
      { item: '非流动负债', y2: '320', y1: '360', y: '365', latest: '365', growth: '+1.4%' },
      { item: '所有者权益', y2: '3,460', y1: '3,910', y: '4,215', latest: '4,215', growth: '+7.8%' },
    ],
    incomeStatement: [
      { item: '营业收入', y2: '16,200', y1: '18,900', y: '21,800', latest: '21,800', growth: '+15.3%' },
      { item: '营业成本', y2: '12,860', y1: '14,890', y: '16,920', latest: '16,920', growth: '+13.6%' },
      { item: '毛利率', y2: '20.6%', y1: '21.2%', y: '22.4%', latest: '22.4%', growth: '+1.2pp' },
      { item: '销售费用', y2: '780', y1: '910', y: '1,090', latest: '1,090', growth: '+19.8%' },
      { item: '管理费用', y2: '650', y1: '710', y: '870', latest: '870', growth: '+22.5%' },
      { item: '研发费用', y2: '1,180', y1: '1,360', y: '1,570', latest: '1,570', growth: '+15.4%' },
      { item: '净利润', y2: '1,410', y1: '1,650', y: '1,900', latest: '1,900', growth: '+15.2%' },
      { item: '净利率', y2: '8.7%', y1: '8.7%', y: '8.7%', latest: '8.7%', growth: '持平' },
    ],
    cashFlowStatement: [
      { item: '经营活动现金流量净额', y2: '1,820', y1: '2,150', y: '2,340', latest: '2,340', growth: '+8.8%' },
      { item: '投资活动现金流量净额', y2: '-580', y1: '-820', y: '-1,080', latest: '-1,080', growth: '+31.7%' },
      { item: '筹资活动现金流量净额', y2: '+150', y1: '+220', y: '+320', latest: '+320', growth: '+45.5%' },
      { item: '现金净增加额', y2: '+1,390', y1: '+1,550', y: '+1,580', latest: '+1,580', growth: '+1.9%' },
      { item: '期末现金余额', y2: '820', y1: '1,150', y: '1,420', latest: '1,420', growth: '+23.5%' },
    ],
    liquidityRatios: [
      { metric: '资产负债率', y2: '45.6%', y1: '47.3%', y: '48.6%', industry: '52%', evaluation: '优于行业' },
      { metric: '流动比率', y2: '1.87', y1: '1.81', y: '1.73', industry: '1.65', evaluation: '优' },
      { metric: '速动比率', y2: '1.15', y1: '1.18', y: '1.29', industry: '1.10', evaluation: '优' },
      { metric: '利息保障倍数', y2: '5.8×', y1: '6.1×', y: '6.2×', industry: '4.5×', evaluation: '优' },
    ],
    profitabilityRatios: [
      { metric: '毛利率', y2: '20.6%', y1: '21.2%', y: '22.4%', industry: '19.8%', evaluation: '优' },
      { metric: '净利率', y2: '8.7%', y1: '8.7%', y: '8.7%', industry: '6.5%', evaluation: '优' },
      { metric: 'ROE', y2: '10.8%', y1: '11.5%', y: '12.4%', industry: '9.2%', evaluation: '优' },
      { metric: 'ROA', y2: '5.5%', y1: '5.8%', y: '6.1%', industry: '4.8%', evaluation: '优' },
    ],
    cashFlowRatios: [
      { metric: '经营性现金流（万）', y2: '1,820', y1: '2,150', y: '2,340', evaluation: '稳健增长' },
      { metric: '净现比', y2: '1.29', y1: '1.30', y: '1.23', evaluation: '优' },
      { metric: '收现比', y2: '0.96', y1: '0.97', y: '0.98', evaluation: '良好' },
      { metric: '现金 / 流动负债', y2: '0.32', y1: '0.37', y: '0.39', evaluation: '良' },
    ],
    operationRatios: [
      { metric: '应收账款周转天数', y2: '128 天', y1: '135 天', y: '142 天', industry: '90 天', evaluation: '关注' },
      { metric: '存货周转天数', y2: '92 天', y1: '88 天', y: '86 天', industry: '95 天', evaluation: '优' },
      { metric: '总资产周转率', y2: '0.42', y1: '0.43', y: '0.42', industry: '0.50', evaluation: '一般' },
      { metric: '应付账款周转天数', y2: '76 天', y1: '78 天', y: '82 天', industry: '70 天', evaluation: '一般' },
    ],
    invoiceOverview: [
      { item: '销项发票数', y2: '1,820 张', y1: '2,160 张', y: '2,480 张', latest: '2,480 张' },
      { item: '销项金额（万）', y2: '16,180', y1: '18,910', y: '21,830', latest: '21,830' },
      { item: '进项发票数', y2: '3,250 张', y1: '3,820 张', y: '4,310 张', latest: '4,310 张' },
      { item: '进项金额（万）', y2: '12,820', y1: '14,920', y: '16,950', latest: '16,950' },
      { item: '作废率', y2: '1.2%', y1: '1.1%', y: '0.9%', latest: '0.9%' },
      { item: '上下游匹配度', y2: '94%', y1: '96%', y: '97%', latest: '97%' },
    ],
    taxFiling: [
      { item: '增值税申报额（万）', y2: '410', y1: '478', y: '550' },
      { item: '企业所得税申报额（万）', y2: '353', y1: '413', y: '475' },
      { item: '纳税信用评级', y2: 'B', y1: 'B', y: 'B' },
      { item: '是否欠税', y2: '否', y1: '否', y: '否' },
      { item: '是否税收违法', y2: '否', y1: '否', y: '否' },
      { item: '增值税税负率', y2: '2.5%', y1: '2.5%', y: '2.5%' },
      { item: '所得税实际税率', y2: '15%', y1: '15%', y: '15%' },
      { item: '留抵退税', y2: '0', y1: '0', y: '0' },
      { item: '出口退税', y2: '32', y1: '48', y: '62' },
    ],
    financingHistory: [
      { type: '流动资金贷款', count: '5', total: '1,300', balance: '300', status: '正常' },
      { type: '银行承兑汇票', count: '1', total: '150', balance: '150', status: '正常' },
      { type: '融资租赁', count: '0', total: '0', balance: '0', status: '—' },
      { type: '保理融资', count: '0', total: '0', balance: '0', status: '—' },
      { type: '担保融资', count: '0', total: '0', balance: '0', status: '—' },
      { type: '信托融资', count: '0', total: '0', balance: '0', status: '—' },
      { type: '其他', count: '0', total: '0', balance: '0', status: '—' },
      { type: '合计', count: '6', total: '1,450', balance: '450', status: '全部正常' },
    ],
    longInquiryTotal: '28 次',
    longInquiryInstitutions: '5 家',
    longInquiryBank: '24 次（85.7%）',
    longInquiryNonBank: '4 次（14.3%）',
    shortInquiries: [
      { window: '近 1 天', count: '0', institutions: '0', alert: '蓝（正常）' },
      { window: '近 3 天', count: '0', institutions: '0', alert: '蓝（正常）' },
      { window: '近 7 天', count: '3', institutions: '3', alert: '蓝（正常）' },
      { window: '近 15 天', count: '5', institutions: '4', alert: '蓝（正常）' },
    ],
    bidsCount: 37,
    bidsWonCount: 23,
    bidsWinRate: '62.2%',
    bidsWonAmount: '8,420 万元',
    bidsPerformanceRate: '100%（无延期 / 无质量纠纷）',
    bidsRenewRate: '85%',
    importExportAmount: '320 万美元（2025 年）',
    collateralAssets: [
      { type: '动产抵押', description: '3 台数控加工中心', mortgagee: '建设银行广州分行', amount: '180', status: '有效' },
      { type: '不动产', description: '广州黄埔区自有厂房', mortgagee: '—', amount: '0', status: '未抵押' },
      { type: '知识产权出质', description: '—', mortgagee: '—', amount: '0', status: '无' },
      { type: '股权出质', description: '—', mortgagee: '—', amount: '0', status: '无' },
    ],
    collateralProposals: [
      { type: '不动产抵押', description: '广州黄埔区自有厂房 8,400㎡', mortgagee: '—', amount: '1,200', status: '抵押率 66.7% / 净覆盖额 800' },
      { type: '连带责任保证', description: '实控人陈志刚（个人）', mortgagee: '—', amount: '—', status: '—' },
      { type: '连带责任保证', description: '配偶王丽（家庭代偿能力）', mortgagee: '—', amount: '—', status: '—' },
    ],
    collateralRationale:
      '担保方式选择依据：① 不动产产权清晰，无其他抵押；② 评估值由第三方机构出具；③ 实控人 + 配偶连带提供二次保障。变现可行性：黄埔区工业用地市场活跃，6 个月内可处置。',
    industryRisks: [
      { point: '原材料价格波动', description: '伺服电机进口波动', likelihood: '中', severity: '中', mitigation: '签订长协 + 库存对冲' },
      { point: '下游需求周期', description: '制造业投资周期', likelihood: '中', severity: '中', mitigation: '客户多元化' },
      { point: '行业政策变化', description: 'VOCs 排放新国标', likelihood: '低', severity: '低', mitigation: '已合规整改' },
    ],
    operationRisks: [
      { point: '客户集中度', description: 'CR5 38.4%', likelihood: '低', severity: '中', mitigation: '客户分散化 + 月报披露' },
      { point: '关联交易占比', description: '香港关联占销项 22%', likelihood: '中', severity: '中', mitigation: '按月披露 + 阈值监控' },
      { point: '用电稳定性下降', description: '近 6 月波动加大', likelihood: '中', severity: '低', mitigation: '补充实地走访' },
      { point: '核心岗位家族化', description: 'CFO 为配偶', likelihood: '低', severity: '低', mitigation: '审计委员会监督' },
    ],
    financeRisks: [
      { point: '应收账款周转长', description: '142 天，恶化趋势', likelihood: '高', severity: '高', mitigation: '高频监控 + 账龄分析' },
      { point: '短期借款增加', description: '近两年 +28.6%', likelihood: '中', severity: '中', mitigation: '多头查询月频复查' },
      { point: '汇率敞口', description: '海外收入 320 万美元', likelihood: '中', severity: '低', mitigation: '建议外汇套保' },
      { point: '存货异常下降', description: '同比 -19%', likelihood: '低', severity: '低', mitigation: '已有合理解释' },
    ],
    complianceRisks: [
      { point: '环保处罚记录', description: '2024 年 1 起，已整改', likelihood: '低', severity: '低', mitigation: '辅助参考，不影响评级' },
      { point: '行政许可有效期', description: '高新证书 2024-11 到期', likelihood: '中', severity: '低', mitigation: '续期跟踪' },
      { point: '知识产权侵权', description: '专利涉诉风险', likelihood: '低', severity: '低', mitigation: 'IP 风险扫描' },
      { point: '劳动用工合规', description: '社保实缴比例 87%', likelihood: '低', severity: '低', mitigation: '按月跟踪' },
    ],
  },
};

const SP_OVERRIDES: Record<string, Partial<SoleProprietorProfile>> = {
  // ─────────────────────────────────────────────
  // 烟草零售个体户 · A 级好客户 · 玉林鑫源烟酒便利店
  // 演示烟草分支表 + 良好信用画像
  // ─────────────────────────────────────────────
  'SP-2026-04-001': {
    ownerIdMasked: '450903****0807',
    ownerAge: 45,
    ownerGender: '男',
    ownerHukou: '广西玉林市玉州区',
    ownerCurrentResidence: '广西玉林市玉州区',
    ownerBirthDate: '1981-07-22',
    ownerEthnicity: '汉',
    ownerMobile: '139****2308',
    mobileMonthsOnline: 132,
    mobileCarrier: '中国电信',
    mobile3mAvgFee: '月均 165 元',
    mobile3mFeeTrend: '160 → 168 → 167 元',
    mobile3mFeeVolatility: '5%（稳定）',
    mobile6mShutdownCount: 0,
    mobileCallMinutes: 240,
    mobileFrequentContacts: 28,
    mobileResidenceMatch: '与户籍地一致',
    imeiStability: '稳定（华为设备使用 ≥ 48 月）',
    maritalStatus: '已婚',
    spouseName: '陈丽华',
    spouseAge: 43,
    marriageDate: '2005-03-08',
    childrenInfo: '2 子女（17 岁高中、12 岁小学）',
    familyStability: '高（共同经营 12 年）',
    marriageDispute: '无',
    highestEducation: '中专',
    graduateSchool: '玉林市第二职业中学',
    graduateDate: '2000-07',
    professionalHistory: '2000-2008 烟草批发学徒 / 2008-2014 中烟分销商 / 2014- 自主经营',
    yearsInIndustry: 24,
    industry: '烟草零售',
    shopRegistrationAuthority: '玉林市玉州区市场监督管理局',
    shopBusinessScope: '烟草零售（持证）+ 酒水饮料零售',
    shopMainProducts: '卷烟 / 白酒 / 啤酒 / 饮料',
    shopVenueType: '自有',
    shopHistoryChanges: [],
    shopAddress: '广西玉林市玉州区人民东路 156 号',
    shopVerification: '地址一致 / 临街铺面 / 正常经营 / 有醒目烟草专卖标志',
    shopRentTerm: '自有（无租赁）',
    shopMonthlyRent: '—（自有）',
    shopSurroundings: '主干道商业街 / 客流量大 / 周边住宅密集',
    bankCard12mTotal: '约 78 万元',
    bankCardMonthlyTxCount: '95 笔',
    bankCardCounterpartiesCount: '约 65 家',
    bankCardNightTransactionRatio: '极少（< 3%）',
    bankCardCateringMerchantRatio: '8%',
    bankCardSuspiciousTransaction: '无',
    bankCardRiskScore: '92 / 100',
    realEstate: [
      { certNumber: '桂（2016）玉林市不产权第 06800****', usage: '商住两用', area: '120 ㎡', location: '玉林市玉州区', sealStatus: '未查封', mortgageStatus: '未抵押' },
    ],
    realEstateValuation: '约 100-130 万元',
    vehicles: [
      { plate: '桂K·****', model: '本田 CR-V 2022', purchaseDate: '2022-04', valuation: '15.0', usage: '家用 + 进货' },
    ],
    monthlyIncomeEstimate: '4.8 万元',
    monthlyExpenseEstimate: '3.2 万元（含进货成本）',
    monthlyDisposableEstimate: '1.6 万元',
    thisMonthlyPayment: '1,360 元',
    paymentCoverage: '8.5%（充裕）',
    recommendedCreditLimit: '20 万元',
    multiHeadResult: '近 6 月银行 0 / 非银 0：优秀',
    yancao: {
      licenseNumber: '450903-2014-X-00231',
      licenseExpiry: '至 2028-06-30',
      monthlyOrderAmount: '32,400 元',
      creditGrade: 'A 级',
      violationRecord: '无',
      monthlyOrderCount: '8 次',
      trend12m: '稳健增长（同比 +8.6%）',
      deduction: '0 分',
    },
  },

  // ─────────────────────────────────────────────
  // 餐饮 B 级 · 南宁锦绣餐饮店（保留原 demo 客户）
  // ─────────────────────────────────────────────
  'SP-2026-04-003': {
    ownerIdMasked: '450103****1015',
    ownerAge: 42,
    ownerGender: '男',
    ownerHukou: '广西南宁市青秀区',
    ownerCurrentResidence: '广西南宁市青秀区',
    ownerBirthDate: '1984-02-15',
    ownerEthnicity: '汉',
    ownerMobile: '139****5680',
    mobileMonthsOnline: 96,
    mobileCarrier: '中国移动',
    mobile3mAvgFee: '月均 134 元',
    mobile3mFeeTrend: '168 → 110 → 124 元',
    mobile3mFeeVolatility: '35%（关注）',
    mobile6mShutdownCount: 1,
    mobileCallMinutes: 180,
    mobileFrequentContacts: 18,
    mobileResidenceMatch: '与户籍地一致',
    imeiStability: '稳定（vivo 设备使用 ≥ 36 月）',
    maritalStatus: '已婚',
    spouseName: '李芳',
    spouseAge: 41,
    marriageDate: '2008-05-12',
    childrenInfo: '1 子（15 岁，本地中学就读）',
    familyStability: '高（共同经营餐饮店 18 年）',
    marriageDispute: '无',
    highestEducation: '高中',
    graduateSchool: '南宁市第二十中学',
    graduateDate: '2002-06',
    professionalHistory: '2002-2008 厨师 / 2008-2015 厨师长 / 2018- 个体户老板',
    yearsInIndustry: 18,
    industry: '餐饮',
    shopRegistrationAuthority: '南宁市青秀区市场监督管理局',
    shopBusinessScope: '餐饮服务（正餐）',
    shopMainProducts: '正餐 / 家常菜',
    shopVenueType: '租赁',
    shopHistoryChanges: [
      { date: '2024-03-08', item: '经营范围', before: '正餐服务', after: '正餐服务（增加饮品）' },
    ],
    shopAddress: '广西南宁市青秀区民族大道 88 号临街铺面',
    shopVerification: '地址一致 / 铺面可见 / 正常经营',
    shopRentTerm: '租期 2023-2028',
    shopMonthlyRent: '8,500 元',
    shopSurroundings: '商住混合区 / 客流量中等',
    bankCard12mTotal: '约 28 万元',
    bankCardMonthlyTxCount: '45 笔',
    bankCardCounterpartiesCount: '约 38 家（分散）',
    bankCardNightTransactionRatio: '极少（< 5%）',
    bankCardCateringMerchantRatio: '12%',
    bankCardSuspiciousTransaction: '无',
    bankCardRiskScore: '85 / 100',
    realEstate: [
      { certNumber: '桂（2018）南宁市不产权第 04200****', usage: '住宅', area: '98 ㎡', location: '南宁市青秀区', sealStatus: '未查封', mortgageStatus: '未抵押' },
    ],
    realEstateValuation: '约 80-100 万元',
    vehicles: [
      { plate: '桂A·****', model: '丰田 卡罗拉 2021', purchaseDate: '2021-08', valuation: '8.0', usage: '家用' },
    ],
    monthlyIncomeEstimate: '2.6 万元',
    monthlyExpenseEstimate: '1.8 万元',
    monthlyDisposableEstimate: '0.8 万元',
    thisMonthlyPayment: '2,260 元',
    paymentCoverage: '28.3%（充裕）',
    recommendedCreditLimit: '30 万元',
    multiHeadResult: '关注（3 家）→ 通过',
    // 餐饮店：非烟草、非纯电商，但有外卖辅助
    ecommerce: undefined,
    yancao: undefined,
  },
};

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export function getLeProfile(c: LegalEntityCustomer): LegalEntityProfile {
  const def = defaultLeProfile(c);
  const override = LE_OVERRIDES[c.id];
  return override ? { ...def, ...override } : def;
}

export function getSpProfile(c: SoleProprietorCustomer): SoleProprietorProfile {
  const def = defaultSpProfile(c);
  const override = SP_OVERRIDES[c.id];
  return override ? { ...def, ...override } : def;
}

export function getProfile(c: Customer): LegalEntityProfile | SoleProprietorProfile {
  if (c.type === 'legal-entity') return getLeProfile(c);
  return getSpProfile(c);
}
