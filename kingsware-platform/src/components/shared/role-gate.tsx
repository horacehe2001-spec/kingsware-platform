'use client';

import { useRoleStore } from '@/lib/role-store';
import { can, type Permission } from '@/lib/roles';

/**
 * 客户端权限网关：仅当当前角色拥有指定权限时渲染 children。
 * 切换角色后无需刷新即时生效。
 */
export function RoleGate({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const role = useRoleStore((s) => s.role);
  return can(role, permission) ? <>{children}</> : <>{fallback}</>;
}
