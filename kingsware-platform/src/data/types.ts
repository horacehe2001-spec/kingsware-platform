/**
 * 智慧信贷智能体平台 · 业务领域类型
 * 基于产品文档 v2.0
 */

// ─────────────────────────────────────────────
// 客户类型
// ─────────────────────────────────────────────

export type CustomerType = 'legal-entity' | 'sole-proprietor';

export type CreditGrade = 'A' | 'B' | 'C' | 'D';

export type ApprovalStatus =
  | 'draft'
  | 'in-progress'
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'on-hold';

export interface BaseCustomer {
  id: string;
  name: string;
  type: CustomerType;
  unifiedSocialCreditCode: string;
  industry: string;
  region: string;
  appliedAmount: number; // 万元
  appliedProduct: string;
  status: ApprovalStatus;
  creditScore?: number;
  creditGrade?: CreditGrade;
  manager: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalEntityCustomer extends BaseCustomer {
  type: 'legal-entity';
  legalRepresentative: string;
  registeredCapital: number; // 万元
  registeredAt: string;
  enterpriseScale: '大' | '中' | '小' | '微';
  fiveDimensionScores?: {
    operationStability: number; // 30%
    financialHealth: number; // 25%
    performance: number; // 25%
    compliance: number; // 15%
    growth: number; // 5%
  };
}

export interface SoleProprietorCustomer extends BaseCustomer {
  type: 'sole-proprietor';
  ownerName: string;
  shopName: string;
  shopType: '烟草零售' | '电商个体' | '餐饮' | '零售' | '服务' | '其他';
  fourDimensionScores?: {
    personalCredit: number; // 35%
    economicCapacity: number; // 25%
    operationAuthenticity: number; // 25%
    socialStability: number; // 15%
  };
}

export type Customer = LegalEntityCustomer | SoleProprietorCustomer;

// ─────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────

export type AgentNamespace = 'LE' | 'SP'; // Legal Entity / Sole Proprietor

export type AgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped';

export interface AgentDefinition {
  id: string; // LE-A01, SP-A01...
  namespace: AgentNamespace;
  name: string; // 核心风险点 / 实控人画像 ...
  humanRole: string; // 信审委员秘书 / 客户经理 ...
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  batch?: 'A' | 'B';
  dependencies: string[];
  description: string;
  inputs: string;
  outputFormat: string;
  expectedLength: string;
  importance: '★' | '★★' | '★★★';
}

export interface AgentRunState {
  agentId: string;
  status: AgentStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  apiCalls?: number;
  tokenUsage?: number;
  errorMessage?: string;
  outputPreview?: string;
}

// ─────────────────────────────────────────────
// 尽调报告
// ─────────────────────────────────────────────

export interface RiskPoint {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: '行业' | '经营' | '财务' | '合规' | '关联方' | '欺诈' | '失联' | '个人信用';
  title: string;
  description: string;
  evidence: string; // 数据证据
  recommendation: string;
  triggeredBy: string[]; // Agent ID
}

export interface CrossValidationPair {
  id: string;
  pair: string; // 例：纳税×用电
  sourceA: string;
  sourceB: string;
  result: '正常' | '关注' | '异常';
  deviation: string;
  riskImplication: string;
}

export interface ReportSection {
  number: string; // 1.1 / 7.6.1
  title: string;
  description?: string;
  agentGenerated?: boolean;
  agentId?: string;
  contentPreview: string;
}

export interface DueDiligenceReport {
  id: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  reportNumber: string;
  status: 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved';
  progress: number; // 0-100
  generatedAt?: string;
  reviewedBy?: string;
  totalScore?: number;
  creditGrade?: CreditGrade;
  oneVoteVeto: {
    item: string;
    apiSource: string;
    triggered: boolean;
  }[];
  riskPoints: RiskPoint[];
  crossValidations?: CrossValidationPair[];
  agentStates: AgentRunState[];
  sections: ReportSection[];
  recommendation?: {
    decision: '建议批准' | '有条件批准' | '建议否决';
    amount: number;
    term: number; // 月
    rate: string;
    guarantee: string;
    conditions: string[];
  };
}

// ─────────────────────────────────────────────
// 贷后事件 / 风险预警
// ─────────────────────────────────────────────

export interface RiskEvent {
  id: string;
  customerId: string;
  customerName: string;
  triggeredAt: string;
  source: '工商' | '司法' | '税务' | '用电' | '舆情' | '关联方' | '反欺诈' | '多头';
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  acknowledged: boolean;
  assignee?: string;
}

// ─────────────────────────────────────────────
// 工作台
// ─────────────────────────────────────────────

export interface KpiMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  delta?: number; // 百分比变化
  deltaLabel?: string;
  trend?: number[]; // 迷你图数据
}

export interface ActivityEvent {
  id: string;
  type: 'agent-start' | 'agent-finish' | 'report-generated' | 'risk-alert' | 'approval' | 'authorization';
  actor: string; // Agent / 用户
  target: string; // 客户名或报告号
  message: string;
  timestamp: string;
}

export interface TodoItem {
  id: string;
  type: '待复核' | '待审批' | '风险处置' | '授权确认' | '贷后跟进';
  title: string;
  customerName: string;
  dueAt: string;
  priority: 'low' | 'medium' | 'high';
  link: string;
}
