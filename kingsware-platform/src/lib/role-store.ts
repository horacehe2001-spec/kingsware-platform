'use client';

import { create } from 'zustand';

import { type Role } from './roles';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

/**
 * 当前用户角色（客户端内存态）。
 * 不持久化到 localStorage，避免 SSR 与客户端 rehydrate 时机差异引发的
 * hydration mismatch。每次刷新回到默认 'approver'（演示场景足够）。
 */
export const useRoleStore = create<RoleState>((set) => ({
  role: 'approver',
  setRole: (role) => set({ role }),
}));
