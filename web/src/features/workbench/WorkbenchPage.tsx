import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Typography } from 'antd';

import { getWorkItems } from '@/api/endpoints/workItems';
import { usePermission } from '@/permissions/guard';

/** W1 工作台骨架：先接统一工作项与态势计数 */
export function WorkbenchPage(): React.JSX.Element {
  const { roleName, dataScope, has } = usePermission();
  const workItems = useQuery({
    queryKey: ['work-items', 'open'],
    queryFn: () => getWorkItems({ status: 'open', pageSize: 20 }),
  });

  return (
    <div>
      <Typography.Title level={4}>工作台</Typography.Title>
      <Typography.Paragraph type="secondary">
        当前角色：{roleName ?? '未登录'} · 数据范围：{dataScope}
        {has('audit:view') ? ' · 可见审计' : ''}
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理工作项"
              value={workItems.data?.openCount ?? '—'}
              loading={workItems.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="组织态势" value="正常" />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="我的 WorkItem（W1 完整化）">
        <Typography.Paragraph type="secondary">
          审批 / 自动任务 / 项目任务 / 风险整改 / 数据治理将在这里统一呈现（服务端 DataScope 过滤）。
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
