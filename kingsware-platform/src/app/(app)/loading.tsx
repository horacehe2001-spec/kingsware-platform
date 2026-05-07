import { Skeleton } from '@/components/ui/skeleton';

/**
 * (app) 段统一 loading skeleton。
 * 数据加载或 Server Component 渲染期间显示，避免白屏。
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* 标题区骨架 */}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* 卡片网格骨架 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* 三栏内容骨架 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
