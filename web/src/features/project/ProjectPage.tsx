import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

import { getProjects, saveProject, transitionProject } from '@/api/endpoints/project';
import { getMembers } from '@/api/endpoints/membership';
import { getEntityRelations } from '@/api/endpoints/relations';
import { Project } from '@/models/contract';
import { EChart } from '@/components/EChart';
import { ErrorState } from '@/components/ErrorState';
import { MemberSelect } from '@/components/MemberSelect';
import { PageContainer } from '@/components/PageContainer';
import type { EChartsOption } from 'echarts';

const statusColor: Record<number, string> = { 0: 'default', 1: 'blue', 2: 'orange', 3: 'green' };

interface ProjectFormValues {
  id?: string;
  name: string;
  description?: string;
  managerId?: string;
  budget?: number;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

export function ProjectPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [relationId, setRelationId] = useState<string | null>(null);
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => getProjects({ pageSize: 100 }) });
  /** 与 MemberSelect 共享 queryKey，用于负责人 id → 姓名回填 */
  const memberOptions = useQuery({
    queryKey: ['members', 'select-options'],
    queryFn: () => getMembers({ pageSize: 200 }),
  });
  const relations = useQuery({
    queryKey: ['relations', relationId],
    queryFn: () => getEntityRelations(relationId!),
    enabled: relationId != null,
  });
  const save = useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      message.success('项目已保存');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });
  const transition = useMutation({
    mutationFn: (input: { id: string; action: 'start' | 'pause' | 'resume' | 'complete' }) =>
      transitionProject(input.id, input.action),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '状态更新失败，请重试');
    },
  });

  const openCreate = (): void => {
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Project): void => {
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      description: row.description,
      managerId: row.managerId || undefined,
      budget: row.budget,
      startDate: row.startDate ? dayjs(row.startDate) : undefined,
      endDate: row.endDate ? dayjs(row.endDate) : undefined,
    });
    setOpen(true);
  };

  const onFinish = (values: ProjectFormValues): void => {
    const manager = memberOptions.data?.members.find((m) => m.id === values.managerId);
    save.mutate({
      id: values.id,
      name: values.name,
      description: values.description ?? '',
      managerId: values.managerId ?? '',
      managerName: manager?.name ?? '',
      budget: values.budget ?? 0,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
    });
  };

  const columns: ColumnsType<Project> = [
    { title: '项目', dataIndex: 'name', render: (v, r) => `${v}（${r.id}）` },
    { title: '负责人', dataIndex: 'managerName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number, r) => <Tag color={statusColor[v]}>{r.statusLabel}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 160,
      render: (v: number) => <Progress percent={v} size="small" />,
    },
    { title: '预算', dataIndex: 'budget', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '任务', width: 90, render: (_, r) => `${r.doneTaskCount}/${r.taskCount}` },
    {
      title: '操作',
      width: 280,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="small" type="dashed" onClick={() => setRelationId(row.id)}>
            关系图
          </Button>
          {row.status === 0 && (
            <Button size="small" type="primary" onClick={() => transition.mutate({ id: row.id, action: 'start' })}>
              启动
            </Button>
          )}
          {row.status === 1 && (
            <>
              <Button size="small" onClick={() => transition.mutate({ id: row.id, action: 'pause' })}>
                暂停
              </Button>
              <Button size="small" onClick={() => transition.mutate({ id: row.id, action: 'complete' })}>
                完成
              </Button>
            </>
          )}
          {row.status === 2 && (
            <Button size="small" type="primary" onClick={() => transition.mutate({ id: row.id, action: 'resume' })}>
              恢复
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const graphOption: EChartsOption = useMemo(() => {
    const graph = relations.data;
    if (!graph) return {};
    const categories = Array.from(new Set(graph.nodes.map((n) => n.type))).map((type) => ({ name: type }));
    return {
      tooltip: {},
      legend: [{ data: categories.map((c) => c.name), bottom: 0 }],
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          force: { repulsion: 140, edgeLength: 90 },
          label: { show: true, position: 'right', fontSize: 11 },
          categories,
          data: graph.nodes.map((n) => ({ id: n.id, name: n.name, category: n.type })),
          links: graph.edges.map((e) => ({
            source: e.from,
            target: e.to,
            label: { show: true, formatter: e.label, fontSize: 10 },
          })),
        },
      ],
    };
  }, [relations.data]);

  return (
    <PageContainer
      title="项目与任务"
      description="项目立项、任务分解与业务关系血缘"
      extra={
        <Button type="primary" onClick={openCreate}>
          创建项目
        </Button>
      }
    >
      <Card>
        {projects.isError ? (
          <ErrorState onRetry={() => void projects.refetch()} />
        ) : (
          <Table<Project>
            rowKey="id"
            size="small"
            loading={projects.isLoading}
            dataSource={projects.data?.projects ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Modal
        title="项目"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          initialValues={{ budget: 0 }}
          onFinish={onFinish}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="负责人" name="managerId">
            <MemberSelect allowClear />
          </Form.Item>
          <Space size={12}>
            <Form.Item label="预算" name="budget">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="开始日期" name="startDate">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="结束日期" name="endDate">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
      <Modal
        title="业务关系图（血缘）"
        open={relationId != null}
        onCancel={() => setRelationId(null)}
        footer={null}
        width={760}
      >
        {relations.isError ? (
          <ErrorState onRetry={() => void relations.refetch()} />
        ) : relations.data ? (
          <>
            <div style={{ marginBottom: 12 }}>
              {Object.entries(relations.data.summary).map(([k, v]) => (
                <Tag key={k} style={{ marginRight: 8 }}>
                  {k}: {v}
                </Tag>
              ))}
            </div>
            <EChart option={graphOption} height={380} />
            <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
              节点：{relations.data.nodes.map((n) => n.name).join('；')}
            </Typography.Paragraph>
          </>
        ) : null}
      </Modal>
    </PageContainer>
  );
}
