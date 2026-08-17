import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PermissionGate } from '@/permissions/guard';
import { useSession } from '@/auth/session';

describe('PermissionGate', () => {
  it('有权限时渲染子内容，无权限时隐藏', () => {
    act(() => {
      useSession.getState().setSession({
        userId: 'u1',
        permissions: ['finance:view'],
        isAdmin: false,
      });
    });
    const { rerender } = render(
      <PermissionGate code="finance:view" fallback={<span>无权限</span>}>
        <span>财务入口</span>
      </PermissionGate>,
    );
    expect(screen.getByText('财务入口')).toBeInTheDocument();

    act(() => {
      useSession.getState().setPermission({
        roleId: 'member',
        roleName: '普通成员',
        permissions: [],
        dataScope: 'self',
        isAdmin: false,
      });
    });
    rerender(
      <PermissionGate code="finance:view" fallback={<span>无权限</span>}>
        <span>财务入口</span>
      </PermissionGate>,
    );
    expect(screen.getByText('无权限')).toBeInTheDocument();
  });
});
