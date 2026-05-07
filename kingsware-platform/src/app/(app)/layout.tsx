import { Suspense } from 'react';

import { AppBreadcrumb } from '@/components/layout/app-breadcrumb';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppTopbar } from '@/components/layout/app-topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Sidebar 内部用 useSearchParams 高亮当前子菜单，需 Suspense 边界 */}
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="bg-app">
        <AppTopbar />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
          <AppBreadcrumb />
          {children}
        </div>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
