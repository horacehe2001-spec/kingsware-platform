import { Skeleton } from '@/components/ui/skeleton';

/**
 * 报告详情页专属 loading：还原"左 Agent 流水线 + 右内容"双栏布局。
 */
export default function ReportLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* 报告头部骨架 */}
      <Skeleton className="h-44 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* 左侧 Agent 流水线 */}
        <aside className="xl:col-span-4 2xl:col-span-3">
          <Skeleton className="h-[560px] rounded-xl" />
        </aside>

        {/* 右侧主区 */}
        <main className="space-y-4 xl:col-span-8 2xl:col-span-9">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-72 rounded-md" />
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    </div>
  );
}
