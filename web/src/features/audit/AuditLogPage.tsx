import { useQuery } from '@tanstack/react-query';
import { Card, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import { getAuditLogs, getEvents } from '@/api/endpoints/audit';
import { AuditLog, BusinessEvent } from '@/models/contract';

export function AuditLogPage(): React.JSX.Element {
  const [correlationFilter, setCorrelationFilter] = useState('');
  const audit = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogs({ pageSize: 50 }),
  });
  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents({ pageSize: 50 }),
  });

  const auditColumns: ColumnsType<AuditLog> = [
    { title: '动作', dataIndex: 'action', width: 100 },
    { title: '对象', dataIndex: 'entityType', width: 110, render: (v: string, r) => `${v}：${r.entityName}` },
    { title: '操作人', dataIndex: 'actorName', width: 100 },
    {
      title: '关联ID',
      dataIndex: 'correlationId',
      width: 200,
      render: (v?: string) =>
        v ? (
          <Typography.Link
            code
            onClick={() => setCorrelationFilter(v)}
            title={`筛选关联ID ${v}`}
          >
            {v.slice(0, 20)}…
          </Typography.Link>
        ) : (
          '—'
        ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  const eventColumns: ColumnsType<BusinessEvent> = [
    { title: '事件', dataIndex: 'eventType', width: 110, render: (v: string) => <Tag>{v}</Tag> },
    { title: '对象', dataIndex: 'entityType', width: 110, render: (v: string, r) => `${v}：${r.entityName}` },
    { title: '操作人', dataIndex: 'actorName', width: 100 },
    {
      title: '级别',
      dataIndex: 'level',
      width: 80,
      render: (v: string) => <Tag color={v === 'risk' ? 'red' : v === 'warning' ? 'orange' : 'blue'}>{v}</Tag>,
    },
    {
      title: '关联ID',
      dataIndex: 'correlationId',
      width: 200,
      render: (v: string) => <Typography.Text code>{v.slice(0, 20)}…</Typography.Text>,
    },
    {
      title: '时间',
      dataIndex: 'occurredAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  const filteredEvents = correlationFilter
    ? (events.data?.events ?? []).filter((e) => e.correlationId === correlationFilter)
    : (events.data?.events ?? []);
  const filteredAudit = correlationFilter
    ? (audit.data?.logs ?? []).filter((l) => l.correlationId === correlationFilter)
    : (audit.data?.logs ?? []);

  return (
    <div>
      <Typography.Title level={4}>审计与事件链</Typography.Title>
      {correlationFilter && (
        <Space style={{ marginBottom: 12 }}>
          <Tag color="blue">按关联ID筛选：{correlationFilter}</Tag>
          <Typography.Link onClick={() => setCorrelationFilter('')}>清除</Typography.Link>
        </Space>
      )}
      <Card>
        <Tabs
          items={[
            {
              key: 'audit',
              label: `审计日志（${filteredAudit.length}）`,
              children: (
                <Table<AuditLog>
                  rowKey="id"
                  size="small"
                  loading={audit.isLoading}
                  dataSource={filteredAudit}
                  columns={auditColumns}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'events',
              label: `事件流（${filteredEvents.length}）`,
              children: (
                <Table<BusinessEvent>
                  rowKey="id"
                  size="small"
                  loading={events.isLoading}
                  dataSource={filteredEvents}
                  columns={eventColumns}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
