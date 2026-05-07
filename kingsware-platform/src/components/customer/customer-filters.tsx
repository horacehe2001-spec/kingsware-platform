'use client';

import { Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'in-progress', label: '尽调中' },
  { value: 'pending-review', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'on-hold', label: '已挂起' },
];

const GRADE_OPTIONS = [
  { value: 'all', label: '全部评级' },
  { value: 'A', label: 'A 优' },
  { value: 'B', label: 'B 良' },
  { value: 'C', label: 'C 中' },
  { value: 'D', label: 'D 差' },
];

const REGION_OPTIONS = [
  { value: 'all', label: '全部区域' },
  { value: 'gd', label: '广东' },
  { value: 'gx', label: '广西' },
  { value: 'bj', label: '北京' },
];

export interface CustomerFilterValues {
  q: string;
  status: string;
  grade: string;
  region: string;
}

interface Props {
  values: CustomerFilterValues;
  onChange: (updates: Partial<CustomerFilterValues>) => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

export function CustomerFilters({ values, onChange, onClear, hasActiveFilters }: Props) {
  // 关键词输入用本地 state + 300ms 防抖再写入 URL，避免逐字触发路由替换
  const [keyword, setKeyword] = useState(values.q);

  // URL 外部变化时同步回输入框（如点击"清除"按钮）
  useEffect(() => {
    setKeyword(values.q);
  }, [values.q]);

  useEffect(() => {
    if (keyword === values.q) return;
    const t = setTimeout(() => onChange({ q: keyword }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索客户名 / 统一社会信用代码 / 法人 / 经营者"
          className="h-9 pl-9 text-[12.5px]"
        />
      </div>

      <Select value={values.status} onValueChange={(v) => onChange({ status: v ?? 'all' })}>
        <SelectTrigger size="sm" className="h-9 w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.grade} onValueChange={(v) => onChange({ grade: v ?? 'all' })}>
        <SelectTrigger size="sm" className="h-9 w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRADE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.region} onValueChange={(v) => onChange({ region: v ?? 'all' })}>
        <SelectTrigger size="sm" className="h-9 w-[140px]">
          <SelectValue placeholder="区域" />
        </SelectTrigger>
        <SelectContent>
          {REGION_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" className="h-9 gap-1.5">
        <Filter className="size-3.5" />
        高级筛选
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-muted-foreground"
          onClick={onClear}
        >
          <X className="size-3.5" />
          清除
        </Button>
      )}
    </div>
  );
}
