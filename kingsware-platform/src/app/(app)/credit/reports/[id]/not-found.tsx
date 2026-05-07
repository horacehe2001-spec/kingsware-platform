import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ReportNotFound() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-6" />
      </div>
      <h2 className="font-display text-xl tracking-tight">报告不存在</h2>
      <p className="max-w-md text-[13px] text-muted-foreground">
        可能这条报告已被撤销，或客户号有误。请回到客户列表选择正确的客户进入报告。
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Button
          render={<Link href="/customers" />}
          variant="outline"
          size="sm"
        >
          返回客户列表
        </Button>
        <Button render={<Link href="/dashboard" />} size="sm" className="gap-1.5">
          <Home className="size-3.5" />
          回到工作台
        </Button>
      </div>
    </Card>
  );
}
