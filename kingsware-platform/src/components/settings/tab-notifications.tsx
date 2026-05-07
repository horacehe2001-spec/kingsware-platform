'use client';

import { Bell, CheckCircle2, Mail, MessageSquare, PlugZap, Send, Webhook, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RuleRow {
  level: '红' | '黄' | '蓝';
  name: string;
  channels: string[];
  recipients: string;
  enabled: boolean;
}

const RULES: RuleRow[] = [
  { level: '红', name: '一票否决触发 / 失信被执行 / 限制高消费', channels: ['站内', '邮件', 'SMS', 'Webhook'], recipients: '审批官 + 风控总监 + 合规', enabled: true },
  { level: '红', name: '连续 3 月用电归零 / 企业注销', channels: ['站内', '邮件', 'SMS'], recipients: '客户经理 + 风控', enabled: true },
  { level: '红', name: '手机空号 / 停机（个体户）', channels: ['站内', 'SMS'], recipients: '客户经理', enabled: true },
  { level: '黄', name: '关联交易月增 > 30%', channels: ['站内', '邮件'], recipients: '客户经理 + 风控', enabled: true },
  { level: '黄', name: '多头查询新增 > 3 家', channels: ['站内', '邮件'], recipients: '客户经理', enabled: true },
  { level: '黄', name: '应收账款周转 > 行业基准 1.5×', channels: ['站内'], recipients: '客户经理', enabled: true },
  { level: '蓝', name: '行业政策变化', channels: ['站内'], recipients: '客户经理', enabled: false },
  { level: '蓝', name: '客户经理工作日报', channels: ['邮件'], recipients: '本人', enabled: true },
];

const WEBHOOKS = [
  { url: 'https://approval.bank.cn/api/v1/notify', event: '红灯触发', status: 'active', lastDelivery: '12 分钟前 · 200' },
  { url: 'https://crm.bank.cn/webhooks/diligence-done', event: '尽调完成', status: 'active', lastDelivery: '8 分钟前 · 200' },
  { url: 'https://oa.bank.cn/integration/risk-alert', event: '所有预警', status: 'paused', lastDelivery: '2 天前 · 502（已暂停）' },
];

export function TabNotifications() {
  const [emailFrom, setEmailFrom] = useState('credit-bot@bank.cn');
  const [smsSign, setSmsSign] = useState('【智慧信贷】');
  const [testTo, setTestTo] = useState('');
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* 通道配置 */}
      <Card className="overflow-hidden lg:col-span-5">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-[14px] font-semibold tracking-tight">通道配置</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">3 种推送通道</p>
        </div>
        <div className="divide-y divide-border/40">
          <ChannelBlock
            icon={<Mail className="size-4" />}
            name="邮件 (SMTP)"
            host="smtp.bank.cn:587 · TLS"
            ok
          >
            <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-[11.5px]">
              <span className="text-muted-foreground">发件人</span>
              <Input value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} className="h-7 font-mono text-[11px]" />
              <span className="text-muted-foreground">今日发送</span>
              <span className="font-mono tabular-nums">142 封 · 0 退信</span>
            </div>
          </ChannelBlock>
          <ChannelBlock
            icon={<MessageSquare className="size-4" />}
            name="短信 (阿里云)"
            host="dysmsapi.aliyuncs.com"
            ok
          >
            <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-[11.5px]">
              <span className="text-muted-foreground">签名</span>
              <Input value={smsSign} onChange={(e) => setSmsSign(e.target.value)} className="h-7 font-mono text-[11px]" />
              <span className="text-muted-foreground">今日发送</span>
              <span className="font-mono tabular-nums">38 条 · 余额 ¥1,240</span>
            </div>
          </ChannelBlock>
          <ChannelBlock
            icon={<Webhook className="size-4" />}
            name="Webhook"
            host="3 个端点已配置"
            ok
          >
            <ul className="space-y-1.5 text-[11px]">
              {WEBHOOKS.map((w) => (
                <li key={w.url} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[10.5px]">{w.url}</span>
                    {w.status === 'active' ? (
                      <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">已启用</span>
                    ) : (
                      <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">暂停</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {w.event} · {w.lastDelivery}
                  </span>
                </li>
              ))}
            </ul>
          </ChannelBlock>
        </div>
      </Card>

      {/* 推送规则 */}
      <Card className="overflow-hidden lg:col-span-7">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">推送规则（红/黄/蓝灯）</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">8 条规则 · 来自 LE-A11 / SP-A09 贷后监控配置</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">+ 新增规则</Button>
        </div>
        <table className="w-full text-[11.5px]">
          <thead className="bg-muted/30">
            <tr>
              <th className="w-12 px-3 py-2 text-left font-medium text-muted-foreground">级别</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">触发条件</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">通道</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">接收人</th>
              <th className="w-16 px-3 py-2 text-center font-medium text-muted-foreground">启用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {RULES.map((r, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="px-3 py-2">
                  <span className={cn(
                    'inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                    r.level === '红' ? 'bg-rose-100 text-rose-700' :
                    r.level === '黄' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700',
                  )}>
                    {r.level}
                  </span>
                </td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.channels.map((c) => (
                      <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.recipients}</td>
                <td className="px-3 py-2 text-center">
                  {r.enabled ? <CheckCircle2 className="mx-auto size-4 text-emerald-500" /> : <XCircle className="mx-auto size-4 text-muted-foreground/40" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 测试发送 */}
      <Card className="p-4 lg:col-span-12">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-primary" />
          <h3 className="text-[14px] font-semibold tracking-tight">测试推送</h3>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">验证邮件/SMS/Webhook 配置是否生效</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="邮箱 / 手机号 / Webhook URL"
            className="h-9 sm:flex-1"
          />
          <Button onClick={() => setSentMsg(testTo ? `测试消息已派发到 ${testTo}（mock）` : '请先输入收件人')} className="gap-1.5">
            <PlugZap className="size-3.5" />
            发送测试
          </Button>
        </div>
        {sentMsg && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            {sentMsg}
          </p>
        )}
      </Card>
    </div>
  );
}

function ChannelBlock({
  icon,
  name,
  host,
  ok,
  children,
}: {
  icon: React.ReactNode;
  name: string;
  host: string;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted/60 text-foreground/80">{icon}</div>
          <div>
            <p className="text-[12.5px] font-semibold">{name}</p>
            <p className="text-[10.5px] text-muted-foreground">{host}</p>
          </div>
        </div>
        {ok && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            <Bell className="size-2.5" />
            已连接
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
