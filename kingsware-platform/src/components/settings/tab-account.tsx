'use client';

import { CheckCircle2, Plus, Search, UserCircle, X } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLES, ROLE_KEYS, type Role } from '@/lib/roles';
import { cn } from '@/lib/utils';

interface MockUser {
  id: string;
  name: string;
  initials: string;
  role: Role;
  branch: string;
  email: string;
  status: 'active' | 'invited' | 'suspended';
  lastLogin: string;
}

const USERS: MockUser[] = [
  { id: 'u1', name: '李文博', initials: 'LWB', role: 'analyst', branch: '广州天河支行', email: 'liwenbo@bank.cn', status: 'active', lastLogin: '5 分钟前' },
  { id: 'u2', name: '王雅婷', initials: 'WYT', role: 'approver', branch: '广州天河支行', email: 'wangyt@bank.cn', status: 'active', lastLogin: '12 分钟前' },
  { id: 'u3', name: '张志远', initials: 'ZZY', role: 'risk-director', branch: '广东分行', email: 'zhangzy@bank.cn', status: 'active', lastLogin: '1 小时前' },
  { id: 'u4', name: '黄艳红', initials: 'HYH', role: 'analyst', branch: '玉林玉州支行', email: 'huangyh@bank.cn', status: 'active', lastLogin: '昨日 18:42' },
  { id: 'u5', name: '林海英', initials: 'LHY', role: 'analyst', branch: '南宁青秀支行', email: 'linhy@bank.cn', status: 'active', lastLogin: '昨日 16:08' },
  { id: 'u6', name: '杨敬业', initials: 'YJY', role: 'approver', branch: '中山小榄支行', email: 'yangjy@bank.cn', status: 'active', lastLogin: '昨日 14:20' },
  { id: 'u7', name: '陈佩琪', initials: 'CPQ', role: 'compliance', branch: '广东分行 · 合规部', email: 'chenpq@bank.cn', status: 'active', lastLogin: '前天 09:33' },
  { id: 'u8', name: '苏文静', initials: 'SWJ', role: 'analyst', branch: '江门台山支行', email: 'suwj@bank.cn', status: 'invited', lastLogin: '邀请待接受' },
];

const ROLE_PERMISSIONS: Array<{ key: string; name: string; allowed: Role[] }> = [
  { key: 'report.regenerate', name: '尽调报告 · 重新生成', allowed: ['analyst', 'approver'] },
  { key: 'report.approve', name: '尽调报告 · 审批通过', allowed: ['approver'] },
  { key: 'report.reject', name: '尽调报告 · 否决', allowed: ['approver', 'risk-director'] },
  { key: 'report.review-with-agent', name: '尽调报告 · 与 Agent 复核', allowed: ['analyst', 'approver', 'risk-director'] },
  { key: 'report.share', name: '尽调报告 · 分享', allowed: ['analyst', 'approver', 'risk-director', 'compliance'] },
  { key: 'report.export', name: '尽调报告 · 导出 docx/pdf', allowed: ['analyst', 'approver', 'risk-director', 'compliance'] },
  { key: 'customer.create', name: '客户管理 · 新建', allowed: ['analyst'] },
  { key: 'customer.export', name: '客户管理 · 批量导出', allowed: ['analyst', 'approver', 'risk-director', 'compliance'] },
  { key: 'dashboard.create-diligence', name: '工作台 · 新建尽调', allowed: ['analyst'] },
  { key: 'audit.view-cycle-log', name: '审计 · 查看 cycle_log', allowed: ['compliance', 'risk-director'] },
  { key: 'audit.view-data-pool', name: '审计 · 查看数据池快照', allowed: ['compliance'] },
  { key: 'system.manage-users', name: '系统 · 管理用户', allowed: ['risk-director'] },
  { key: 'system.manage-models', name: '系统 · 管理模型 / Prompt', allowed: ['risk-director'] },
];

export function TabAccount() {
  const [filter, setFilter] = useState('');
  const filtered = USERS.filter((u) =>
    !filter || u.name.includes(filter) || u.email.includes(filter) || u.branch.includes(filter),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* 用户列表 */}
      <Card className="overflow-hidden lg:col-span-7">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h3 className="text-[14px] font-semibold tracking-tight">用户列表（{USERS.length}）</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索姓名 / 邮箱 / 支行"
                className="h-8 w-52 pl-8 text-[12px]"
              />
            </div>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="size-3.5" />
              邀请用户
            </Button>
          </div>
        </div>
        <ul className="divide-y divide-border/50">
          {filtered.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {u.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{u.name}</span>
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium',
                    u.role === 'approver' ? 'bg-grade-b-bg text-grade-b' :
                    u.role === 'risk-director' ? 'bg-amber-100 text-amber-700' :
                    u.role === 'compliance' ? 'bg-violet-100 text-violet-700' :
                    'bg-muted text-muted-foreground',
                  )}>
                    {ROLES[u.role].label}
                  </span>
                  {u.status === 'invited' && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">邀请中</span>
                  )}
                  {u.status === 'suspended' && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">已停用</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {u.email} · {u.branch}
                </p>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                {u.lastLogin}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* 权限矩阵 */}
      <Card className="overflow-hidden lg:col-span-5">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-[14px] font-semibold tracking-tight">角色权限矩阵</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">单一权限源，应用全平台</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground">权限</th>
                {ROLE_KEYS.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium text-muted-foreground" title={ROLES[r].label}>
                    {ROLES[r].short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ROLE_PERMISSIONS.map((p) => (
                <tr key={p.key} className="hover:bg-muted/20">
                  <td className="sticky left-0 bg-card px-3 py-2 text-[11px]">{p.name}</td>
                  {ROLE_KEYS.map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {p.allowed.includes(r) ? (
                        <CheckCircle2 className="mx-auto size-3.5 text-emerald-500" />
                      ) : (
                        <X className="mx-auto size-3 text-muted-foreground/30" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/60 bg-muted/30 px-4 py-2 text-[10.5px] text-muted-foreground">
          <UserCircle className="mr-1 inline size-3" />
          AM 客户经理 · AP 授信审批官 · RD 风控总监 · CA 合规审计 · 数据来自 src/lib/roles.ts
        </div>
      </Card>
    </div>
  );
}
