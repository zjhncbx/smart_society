import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { closePeriod, getAccountingReports, unclosePeriod } from '@/api/endpoints/financeExt';
import { ClosePeriodResult } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { usePermission } from '@/permissions/guard';

export function ClosingPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { isAdmin } = usePermission();
  const [year, setYear] = useState<Dayjs>(dayjs());
  const yearStr = year.format('YYYY');
  const [result, setResult] = useState<ClosePeriodResult | null>(null);

  const reports = useQuery({
    queryKey: ['accounting-reports', yearStr],
    queryFn: () => getAccountingReports(yearStr),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['accounting-reports', yearStr] });

  const close = useMutation({
    mutationFn: () => closePeriod(yearStr),
    onSuccess: (data) => {
      setResult(data);
      if (data.nothingToClose) {
        message.warning('本年度无已生效收支凭证，无需结账');
      } else if (data.alreadyClosed) {
        message.info('该年度已结账（幂等返回）');
      } else {
        message.success(`${yearStr} 年度期末结账完成`);
      }
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '结账失败，请重试');
    },
  });
  const unclose = useMutation({
    mutationFn: () => unclosePeriod(yearStr),
    onSuccess: (data) => {
      message.success(`反结账完成：移除 ${data.removed} 张结转凭证`);
      setResult(null);
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '反结账失败，请重试');
    },
  });

  const closed = reports.data?.closingExists === true;

  return (
    <PageContainer title="期末结账" description="年度期末结转凭证生成与反结账">
      {!isAdmin && (
        <Alert
          type="warning"
          showIcon
          message="仅组织管理员可以执行期末结账与反结账"
        />
      )}
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space size={16} wrap>
            <Typography.Text>会计年度：</Typography.Text>
            <DatePicker
              picker="year"
              value={year}
              onChange={(v) => {
                if (v) {
                  setYear(v);
                  setResult(null);
                }
              }}
              allowClear={false}
            />
            <Tag color={closed ? 'green' : 'default'}>{closed ? '已结账' : '未结账'}</Tag>
            <Button
              type="primary"
              disabled={!isAdmin || closed}
              loading={close.isPending}
              onClick={() => close.mutate()}
            >
              执行期末结账
            </Button>
            <Button
              danger
              disabled={!isAdmin || !closed}
              loading={unclose.isPending}
              onClick={() => {
                Modal.confirm({
                  title: `确认反结账 ${yearStr} 年度？`,
                  content: '将删除该年度的期末结转凭证，恢复收支科目余额。',
                  onOk: () => unclose.mutate(),
                });
              }}
            >
              反结账
            </Button>
          </Space>

          {reports.isError ? (
            <ErrorState description="结账状态加载失败" onRetry={() => void reports.refetch()} />
          ) : reports.data ? (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="年度">{reports.data.year}</Descriptions.Item>
              <Descriptions.Item label="结账状态">
                {reports.data.closingExists ? '已结账' : '未结账'}
              </Descriptions.Item>
              <Descriptions.Item label="期末借方合计">
                {reports.data.trialBalance.totals.endDebit.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="期末贷方合计">
                {reports.data.trialBalance.totals.endCredit.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          ) : null}

          {result && !result.nothingToClose && (
            <Alert
              type={result.alreadyClosed ? 'info' : 'success'}
              showIcon
              message={
                result.alreadyClosed
                  ? `${yearStr} 年度已结账（幂等返回，凭证 ${result.voucherId}）`
                  : `${yearStr} 年度结转完成`
              }
              description={
                result.alreadyClosed ? undefined : (
                  <Descriptions size="small" column={3}>
                    <Descriptions.Item label="结转凭证">{result.voucherId}</Descriptions.Item>
                    <Descriptions.Item label="收入合计">
                      ¥{(result.income ?? 0).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="费用合计">
                      ¥{(result.expense ?? 0).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                )
              }
            />
          )}
          {result?.nothingToClose && (
            <Alert
              type="warning"
              showIcon
              message={`${yearStr} 年度无已生效收支凭证，无需结账`}
            />
          )}
        </Space>
      </Card>
    </PageContainer>
  );
}
