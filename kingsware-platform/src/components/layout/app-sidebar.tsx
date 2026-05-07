'use client';

import {
  ChevronRight,
  Cog,
  CreditCard,
  Eye,
  FileSearch,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';

type NavChild = { title: string; href: string };

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  ai?: boolean;
  children?: NavChild[];
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: '业务工作台',
    items: [
      { title: '工作台', href: '/dashboard', icon: LayoutDashboard },
      {
        title: '客户与批次',
        href: '/customers',
        icon: Users2,
        children: [
          { title: '法人小微客户', href: '/customers?type=legal-entity' },
          { title: '个体工商户', href: '/customers?type=sole-proprietor' },
          { title: '批次任务', href: '/customers/batches' },
        ],
      },
    ],
  },
  {
    label: 'SKU · 信贷全周期',
    items: [
      { title: '批量获客', href: '/acquisition', icon: Megaphone },
      { title: '智能征信报告', href: '/credit/reports', icon: FileSearch, ai: true },
      { title: '贷中贷后风控', href: '/monitor', icon: Eye, badge: '8' },
    ],
  },
  {
    label: 'AI 与合规',
    items: [
      { title: 'Agent 工作台', href: '/agents', icon: Sparkles, ai: true },
      { title: '合规审计', href: '/audit', icon: ShieldCheck },
      { title: '数据看板', href: '/insights', icon: CreditCard },
    ],
  },
  {
    label: '系统',
    items: [{ title: '系统管理', href: '/settings', icon: Cog }],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  const base = href.split('?')[0];
  if (base === '/dashboard') return pathname === '/dashboard';
  return pathname === base || pathname.startsWith(base + '/');
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex h-12 items-center gap-2.5 px-2 group-data-[collapsible=icon]:px-1"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md ai-gradient text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden min-w-0">
            <span className="truncate text-[13px] font-semibold tracking-tight">智慧信贷</span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">
              Kingsware
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] tracking-wider text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    currentUrl={currentUrl}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-gradient-to-br from-primary/5 to-ai-from/10 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3.5" />
            合规态势
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-sidebar-foreground/70">
            授权全程留痕 · SDAFI 决策可回放 · 等保 2.0 三级
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function NavMenuItem({
  item,
  pathname,
  currentUrl,
}: {
  item: NavItem;
  pathname: string;
  currentUrl: string;
}) {
  const Icon = item.icon;
  const isActive = isItemActive(pathname, item.href);

  const button = (
    <SidebarMenuButton
      render={<Link href={item.href} />}
      isActive={isActive}
      tooltip={item.title}
      className="font-medium data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
    >
      <Icon
        className={`size-4 shrink-0 ${item.ai ? 'text-[var(--ai-from)]' : ''}`}
      />
      <span>{item.title}</span>
      {item.badge && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-risk-high/15 px-1.5 text-[10px] font-semibold text-risk-high">
          {item.badge}
        </span>
      )}
      {item.ai && !item.badge && !item.children && (
        <span className="ml-auto rounded bg-[var(--ai-from)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--ai-from)]">
          AI
        </span>
      )}
    </SidebarMenuButton>
  );

  // 无子菜单：直接渲染
  if (!item.children || item.children.length === 0) {
    return <SidebarMenuItem>{button}</SidebarMenuItem>;
  }

  // 有子菜单：用 Collapsible，默认在激活时展开，用户可以独立切换
  // key 包含 isActive 以便路由切换到/离开本节点时重置默认状态
  return (
    <Collapsible key={`${item.title}-${isActive}`} defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        {button}
        <CollapsibleTrigger
          render={
            <SidebarMenuAction
              className="data-[state=open]:rotate-90"
              aria-label={`展开 ${item.title} 子菜单`}
            >
              <ChevronRight />
            </SidebarMenuAction>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  render={<Link href={child.href} />}
                  isActive={currentUrl === child.href}
                >
                  {child.title}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
