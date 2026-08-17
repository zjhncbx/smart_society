import { Button, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useSession } from '@/auth/session';

interface LoginForm {
  displayName: string;
}

/**
 * W0 登录页：固化表单与认证边界。
 * 真实链路（Access Token → AGC 网关 → 内部 userId）为 Web 阶段 AGC 联调项，
 * 联调前提供「模拟登录」进入工作台骨架（仅开发模式）。
 */
export function LoginPage(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const setSession = useSession((s) => s.setSession);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // TODO(AGC联调)：调用 ensureIdentity(provider='huawei', providerSubject=...)
      // 并用返回的 userId 拉取 getMyPermissions() 写入会话。
      const mockUserId = 'u_mock_' + crypto.randomUUID().slice(0, 8);
      setSession({
        accessToken: 'mock-token',
        userId: mockUserId,
        displayName: values.displayName || '管理员',
        currentOrgId: 'org_mock',
        roleId: 'org_admin',
        roleName: '组织管理员',
        permissions: ['*'],
        dataScope: 'org',
        isAdmin: true,
      });
      message.success('模拟登录成功（AGC 认证联调后替换）');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<LoginForm> layout="vertical" onFinish={onFinish} initialValues={{ displayName: '管理员' }}>
      <Form.Item
        label="用户名"
        name="displayName"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        登录
      </Button>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
        当前为 W0 模拟登录；正式认证（华为账号 / Access Token）随 AGC 网关联调接入。
      </Typography.Paragraph>
    </Form>
  );
}
