import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { loginWithChain } from '@/auth/login';
import { useSession } from '@/auth/session';

interface LoginForm {
  account: string;
  password: string;
}

/** 开发态 Mock 模式才渲染快捷登录；agc 模式（编译期常量）下整段死代码消除 */
const isMockMode: boolean = import.meta.env.VITE_API_MODE !== 'agc';

/** Mock 演示账号（与 dev-api /auth/login 校验一致） */
const MOCK_ACCOUNT = '13800000000';
const MOCK_PASSWORD = 'admin123';

/**
 * 登录页：账号 + 密码走真实认证链
 * login-user → get-my-orgs → get-my-permissions → 写入会话 → 进入工作台。
 */
export function LoginPage(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const setSession = useSession((s) => s.setSession);
  const setPermission = useSession((s) => s.setPermission);
  const navigate = useNavigate();

  const doLogin = async (account: string, password: string): Promise<void> => {
    const { user, orgs, permission } = await loginWithChain(account, password);
    setSession({
      accessToken: `web_${user.userId}`,
      userId: user.userId,
      displayName: user.displayName || user.phone || '成员',
      orgs,
      currentOrgId: orgs[0]?.orgId ?? null,
      currentOrgName: orgs[0]?.name ?? null,
    });
    if (permission) {
      setPermission({
        roleId: permission.roleId,
        roleName: permission.roleName,
        permissions: permission.permissions,
        dataScope: permission.dataScope,
        isAdmin: permission.isAdmin,
      });
    }
    navigate('/', { replace: true });
  };

  const onFinish = async (values: LoginForm): Promise<void> => {
    setLoading(true);
    try {
      await doLogin(values.account, values.password);
      message.success('登录成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onQuickLogin = async (): Promise<void> => {
    setQuickLoading(true);
    try {
      await doLogin(MOCK_ACCOUNT, MOCK_PASSWORD);
      message.success('Mock 快捷登录成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <Form<LoginForm>
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ account: isMockMode ? MOCK_ACCOUNT : '' }}
    >
      <Form.Item
        label="账号"
        name="account"
        rules={[{ required: true, message: '请输入账号（手机号）' }]}
      >
        <Input placeholder="请输入手机号" autoComplete="username" data-testid="login-account" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password placeholder="请输入密码" autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        登录
      </Button>
      {isMockMode && (
        <>
          <Divider plain style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            或
          </Divider>
          <Button block loading={quickLoading} onClick={onQuickLogin} data-testid="mock-quick-login">
            Mock 快捷登录（演示账号 {MOCK_ACCOUNT}）
          </Button>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
            开发态演示账号：{MOCK_ACCOUNT} / {MOCK_PASSWORD}；正式环境通过 AGC 网关认证。
          </Typography.Paragraph>
        </>
      )}
    </Form>
  );
}
