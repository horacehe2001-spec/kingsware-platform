'use client';

import { Building2, Download, Plus, SearchX, Store } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import {
  CustomerFilters,
  type CustomerFilterValues,
} from '@/components/customer/customer-filters';
import { CustomerTable } from '@/components/customer/customer-table';
import { RoleGate } from '@/components/shared/role-gate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer } from '@/data/types';

type TabKey = 'all' | 'legal-entity' | 'sole-proprietor';

const REGION_PREFIX: Record<string, string> = {
  gd: '广东',
  gx: '广西',
  bj: '北京',
};

function applyFilters(rows: Customer[], f: CustomerFilterValues): Customer[] {
  return rows.filter((row) => {
    if (f.status !== 'all' && row.status !== f.status) return false;
    if (f.grade !== 'all' && row.creditGrade !== f.grade) return false;
    if (f.region !== 'all') {
      const prefix = REGION_PREFIX[f.region];
      if (prefix && !row.region.startsWith(prefix)) return false;
    }
    if (f.q.trim()) {
      const needle = f.q.trim().toLowerCase();
      const haystack = [
        row.name,
        row.unifiedSocialCreditCode,
        row.industry,
        row.manager,
        row.branch,
        'legalRepresentative' in row ? row.legalRepresentative : '',
        'ownerName' in row ? row.ownerName : '',
        'shopName' in row ? row.shopName : '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

interface CustomersViewProps {
  initialCustomers: Customer[];
}

export function CustomersView({ initialCustomers }: CustomersViewProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 客群分流（一次计算，filters 变化不重算）
  const { allCustomers, legalEntityCustomers, soleProprietorCustomers } = useMemo(() => {
    const le: Customer[] = [];
    const spList: Customer[] = [];
    for (const c of initialCustomers) {
      if (c.type === 'legal-entity') le.push(c);
      else if (c.type === 'sole-proprietor') spList.push(c);
    }
    return {
      allCustomers: initialCustomers,
      legalEntityCustomers: le,
      soleProprietorCustomers: spList,
    };
  }, [initialCustomers]);

  const filters: CustomerFilterValues = useMemo(
    () => ({
      q: sp.get('q') ?? '',
      status: sp.get('status') ?? 'all',
      grade: sp.get('grade') ?? 'all',
      region: sp.get('region') ?? 'all',
    }),
    [sp],
  );
  const activeTab = (sp.get('type') ?? 'all') as TabKey;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === 'all' || v === '') {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );

  const handleFilterChange = useCallback(
    (updates: Partial<CustomerFilterValues>) => updateParams(updates),
    [updateParams],
  );

  const handleClear = useCallback(
    () => updateParams({ q: null, status: null, grade: null, region: null }),
    [updateParams],
  );

  const handleTabChange = useCallback(
    (v: string) => updateParams({ type: v === 'all' ? null : v }),
    [updateParams],
  );

  const hasActiveFilters =
    filters.q !== '' ||
    filters.status !== 'all' ||
    filters.grade !== 'all' ||
    filters.region !== 'all';

  // 先按 Tab 选择基础集合，再应用筛选条件
  const allFiltered = useMemo(
    () => applyFilters(allCustomers, filters),
    [allCustomers, filters],
  );
  const leFiltered = useMemo(
    () => applyFilters(legalEntityCustomers, filters),
    [legalEntityCustomers, filters],
  );
  const spFiltered = useMemo(
    () => applyFilters(soleProprietorCustomers, filters),
    [soleProprietorCustomers, filters],
  );

  const counts = {
    all: allFiltered.length,
    'legal-entity': leFiltered.length,
    'sole-proprietor': spFiltered.length,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 标题区 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">客户与批次</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            法人小微 + 个体工商户 客户清单 · 总 {allCustomers.length} 户
            {hasActiveFilters && ` · 筛选后 ${counts.all} 户`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleGate permission="customer.export">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              导出
            </Button>
          </RoleGate>
          <RoleGate permission="customer.create">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              新建客户
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* 客户类型概览卡 */}
      <div className="grid gap-3 md:grid-cols-3">
        <CustomerSummaryCard
          icon={<Building2 className="size-4" />}
          label="法人小微客户"
          count={legalEntityCustomers.length}
          activeText="尽调中"
          activeCount={
            legalEntityCustomers.filter((c) => c.status === 'in-progress').length
          }
          totalAmount={legalEntityCustomers.reduce((s, c) => s + c.appliedAmount, 0)}
          tone="primary"
        />
        <CustomerSummaryCard
          icon={<Store className="size-4" />}
          label="个体工商户"
          count={soleProprietorCustomers.length}
          activeText="尽调中"
          activeCount={
            soleProprietorCustomers.filter((c) => c.status === 'in-progress').length
          }
          totalAmount={soleProprietorCustomers.reduce((s, c) => s + c.appliedAmount, 0)}
          tone="grade-c"
        />
        <CustomerSummaryCard
          label="本周通过率"
          count={73}
          unit="%"
          activeText="本周新增授信"
          activeCount={2580}
          activeUnit="万元"
          tone="grade-a"
        />
      </div>

      {/* 筛选器 + Tab + 表格 */}
      <Card className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <TabsList className="h-9 bg-muted/60 p-0.5">
              <TabsTrigger value="all" className="h-8 px-3 text-[12.5px]">
                全部
                <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                  {counts.all}
                </span>
              </TabsTrigger>
              <TabsTrigger value="legal-entity" className="h-8 px-3 text-[12.5px]">
                法人小微
                <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                  {counts['legal-entity']}
                </span>
              </TabsTrigger>
              <TabsTrigger value="sole-proprietor" className="h-8 px-3 text-[12.5px]">
                个体工商户
                <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                  {counts['sole-proprietor']}
                </span>
              </TabsTrigger>
            </TabsList>
            <div className="flex-1" />
            <CustomerFilters
              values={filters}
              onChange={handleFilterChange}
              onClear={handleClear}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          <TabsContent value="all" className="m-0">
            <FilteredTable rows={allFiltered} hasActiveFilters={hasActiveFilters} onClear={handleClear} />
          </TabsContent>
          <TabsContent value="legal-entity" className="m-0">
            <FilteredTable rows={leFiltered} hasActiveFilters={hasActiveFilters} onClear={handleClear} />
          </TabsContent>
          <TabsContent value="sole-proprietor" className="m-0">
            <FilteredTable rows={spFiltered} hasActiveFilters={hasActiveFilters} onClear={handleClear} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function FilteredTable({
  rows,
  hasActiveFilters,
  onClear,
}: {
  rows: Customer[];
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
        <SearchX className="size-8 text-muted-foreground/40" />
        <p className="text-[13px] font-medium text-foreground">没有匹配的客户</p>
        <p className="text-[12px] text-muted-foreground">
          {hasActiveFilters
            ? '尝试调整筛选条件或清除当前筛选'
            : '当前列表为空'}
        </p>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>
            清除全部筛选
          </Button>
        )}
      </div>
    );
  }
  return <CustomerTable rows={rows} />;
}

interface SummaryCardProps {
  icon?: React.ReactNode;
  label: string;
  count: number;
  unit?: string;
  activeText: string;
  activeCount: number;
  activeUnit?: string;
  totalAmount?: number;
  tone: 'primary' | 'grade-a' | 'grade-c';
}

function CustomerSummaryCard({
  icon,
  label,
  count,
  unit,
  activeText,
  activeCount,
  activeUnit,
  totalAmount,
  tone,
}: SummaryCardProps) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    'grade-a': 'bg-grade-a-bg text-grade-a',
    'grade-c': 'bg-grade-c-bg text-grade-c',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-3xl tabular-nums leading-none">
              {count.toLocaleString('zh-CN')}
            </span>
            <span className="text-[12px] text-muted-foreground">{unit ?? '户'}</span>
          </div>
        </div>
        {icon && (
          <div
            className={`flex size-9 items-center justify-center rounded-md ${toneClass}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11.5px]">
        <span className="text-muted-foreground">{activeText}</span>
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {activeCount.toLocaleString('zh-CN')}
          {activeUnit ? ` ${activeUnit}` : totalAmount ? ` 户` : ''}
        </span>
      </div>
      {totalAmount !== undefined && (
        <div className="mt-1 flex items-center justify-between text-[11.5px]">
          <span className="text-muted-foreground">申请总额</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {totalAmount.toLocaleString('zh-CN')} 万元
          </span>
        </div>
      )}
    </Card>
  );
}
