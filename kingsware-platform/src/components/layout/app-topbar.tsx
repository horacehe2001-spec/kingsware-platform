'use client';

import { Bell, Check, ChevronDown, Search, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRoleStore } from '@/lib/role-store';
import { ROLES, ROLE_KEYS, type Role } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function AppTopbar() {
  const role = useRoleStore((s) => s.role);
  const setRole = useRoleStore((s) => s.setRole);
  const currentRoleLabel = ROLES[role].label;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      {/* 全局搜索 + AI 提问入口 */}
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <button
          type="button"
          className="group flex h-9 w-full items-center gap-2 rounded-md border border-border bg-muted/40 pl-9 pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="truncate">
            搜索客户、报告、Agent…  <span className="text-foreground/40">或</span>{' '}
            <span className="ai-gradient-text font-medium">向 AI 提问</span>
          </span>
          <kbd className="ml-auto hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium md:inline-flex">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* 角色切换（驱动 RoleGate 权限） */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 font-medium">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                角色
              </span>
              <span>{currentRoleLabel}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>切换工作角色</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLE_KEYS.map((key: Role) => {
            const isCurrent = key === role;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => setRole(key)}
                className={cn(
                  'flex items-center justify-between gap-2',
                  isCurrent && 'font-semibold',
                )}
              >
                <span>{ROLES[key].label}</span>
                {isCurrent && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5" />

      {/* AI 助手入口 */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-ai-from/30 bg-ai-from/5 text-ai-from hover:bg-ai-from/10 hover:text-ai-from"
            >
              <Sparkles className="size-3.5" />
              <span className="hidden md:inline">AI 助手</span>
            </Button>
          }
        />
        <TooltipContent>调起 AI 副驾，自然语言查询/分析</TooltipContent>
      </Tooltip>

      {/* 通知 */}
      <Button variant="ghost" size="icon" className="relative size-9">
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-risk-high" />
        <span className="sr-only">通知</span>
      </Button>

      {/* 用户 */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="h-9 gap-2 px-1.5 hover:bg-muted">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  LWB
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start leading-tight md:flex">
                <span className="text-[12px] font-medium">李文博</span>
                <span className="text-[10px] text-muted-foreground">广州天河支行</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">李文博</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                liwenbo@kingsware.cn
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>个人中心</DropdownMenuItem>
          <DropdownMenuItem>我的授权</DropdownMenuItem>
          <DropdownMenuItem>主题外观</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">退出登录</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
