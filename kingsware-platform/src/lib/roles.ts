/**
 * 角色与权限定义（单一信息源）
 *
 * 4 种角色对应金融机构常见岗位，权限按"最小够用"原则配置：
 *   客户经理（analyst）   = 创建尽调、修改、与 Agent 复核
 *   授信审批官（approver）= 签批通过/退回（核心审批权）
 *   风控总监（rd）        = 跨客户的风险维度查看 + 必要时干预
 *   合规审计（compliance）= 只读 + 导出 + 审计访问
 */

export const ROLES = {
  analyst: { label: '客户经理', short: 'AM' },
  approver: { label: '授信审批官', short: 'AP' },
  'risk-director': { label: '风控总监', short: 'RD' },
  compliance: { label: '合规审计', short: 'CA' },
} as const;

export type Role = keyof typeof ROLES;
export const ROLE_KEYS: Role[] = Object.keys(ROLES) as Role[];

const PERMISSIONS = {
  // 报告级
  'report.regenerate': ['analyst', 'approver'],
  'report.approve': ['approver'],
  'report.reject': ['approver', 'risk-director'],
  'report.review-with-agent': ['analyst', 'approver', 'risk-director'],
  'report.share': ['analyst', 'approver', 'risk-director', 'compliance'],
  'report.export': ['analyst', 'approver', 'risk-director', 'compliance'],

  // 客户管理
  'customer.create': ['analyst'],
  'customer.export': ['analyst', 'approver', 'risk-director', 'compliance'],

  // 工作台动作
  'dashboard.create-diligence': ['analyst'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
