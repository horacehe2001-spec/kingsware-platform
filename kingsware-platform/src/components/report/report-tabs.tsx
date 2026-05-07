'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VALID_TABS = ['risks', 'cross', 'veto', 'sections'] as const;
type ReportTabValue = (typeof VALID_TABS)[number];
const DEFAULT_TAB: ReportTabValue = 'risks';

function isValidTab(v: string | null | undefined): v is ReportTabValue {
  return !!v && (VALID_TABS as readonly string[]).includes(v);
}

export function ReportTabs({
  initialTab,
  showCrossValidation,
  children,
}: {
  initialTab?: string | null;
  showCrossValidation: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState<ReportTabValue>(
    isValidTab(initialTab) ? initialTab : DEFAULT_TAB,
  );

  const handleChange = useCallback(
    (next: string) => {
      if (!isValidTab(next)) return;
      setValue(next);
      const sp = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_TAB) {
        sp.delete('tab');
      } else {
        sp.set('tab', next);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs value={value} onValueChange={handleChange} className="w-full">
      <TabsList className="h-9 bg-muted/60">
        <TabsTrigger value="risks">核心风险点</TabsTrigger>
        {showCrossValidation && <TabsTrigger value="cross">五对交叉验证</TabsTrigger>}
        <TabsTrigger value="veto">一票否决</TabsTrigger>
        <TabsTrigger value="sections">报告章节</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
