import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import {
  getAccountingReports,
  getLedger,
  getOpeningBalances,
  saveOpeningBalances,
} from '@/api/endpoints/financeExt';
import { LedgerEntry, TrialBalanceRow } from '@/models/contract';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';

/** 内置科目表（与云函数 get-ledger 一致），用于期初录入与明细账切换 */
const ACCOUNTS: Array<{ code: string; name: string; category: string }> = [
  { code: '1001', name: '现金', category: '资产' },
  { code: '1002', name: '银行存款', category: '资产' },
  { code: '1101', name: '短期投资', category: '资产' },
  { code: '1201', name: '应收款项', category: '资产' },
  { code: '1301', name: '存货', category: '资产' },
  { code: '1401', name: '待摊费用', category: '资产' },
  { code: '1501', name: '长期股权投资', category: '资产' },
  { code: '1502', name: '长期债权投资', category: '资产' },
  { code: '1601', name: '固定资产', category: '资产' },
  { code: '1602', name: '累计折旧', category: '资产' },
  { code: '1701', name: '无形资产', category: '资产' },
  { code: '1801', name: '受托代理资产', category: '资产' },
  { code: '2101', name: '借入款项', category: '负债' },
  { code: '2201', name: '应付款项', category: '负债' },
  { code: '2301', name: '应付工资', category: '负债' },
  { code: '2302', name: '应交税金', category: '负债' },
  { code: '2401', name: '预收账款', category: '负债' },
  { code: '2501', name: '预提费用', category: '负债' },
  { code: '2601', name: '预计负债', category: '负债' },
  { code: '2701', name: '长期应付款', category: '负债' },
  { code: '2801', name: '受托代理负债', category: '负债' },
  { code: '3101', name: '非限定性净资产', category: '净资产' },
  { code: '3201', name: '限定性净资产', category: '净资产' },
  { code: '4101', name: '捐赠收入', category: '收入' },
  { code: '4102', name: '会费收入', category: '收入' },
  { code: '4103', name: '提供服务收入', category: '收入' },
  { code: '4104', name: '政府补助收入', category: '收入' },
  { code: '4105', name: '投资收益', category: '收入' },
  { code: '4106', name: '商品销售收入', category: '收入' },
  { code: '4109', name: '其他收入', category: '收入' },
  { code: '5101', name: '业务活动成本', category: '费用' },
  { code: '5201', name: '管理费用', category: '费用' },
  { code: '5301', name: '筹资费用', category: '费用' },
  { code: '5401', name: '其他费用', category: '费用' },
];

const accountOptions = ACCOUNTS.map((a) => ({ value: a.code, label: `${a.code} ${a.name}` }));

interface OpeningRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export function LedgerPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [year, setYear] = useState<Dayjs>(dayjs());
  const yearStr = year.format('YYYY');
  const [view, setView] = useState<'trial' | 'detail'>('trial');
  const [detailAccount, setDetailAccount] = useState<string>('1002');
  const [openingOpen, setOpeningOpen] = useState(false);
  const [openingRows, setOpeningRows] = useState<OpeningRow[]>([]);

  const reports = useQuery({
    queryKey: ['accounting-reports', yearStr],
    queryFn: () => getAccountingReports(yearStr),
  });
  const ledger = useQuery({
    queryKey: ['ledger', yearStr, detailAccount],
    queryFn: () => getLedger(yearStr, detailAccount),
    enabled: view === 'detail',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['accounting-reports', yearStr] });
    queryClient.invalidateQueries({ queryKey: ['ledger', yearStr] });
  };

  const saveOpening = useMutation({
    mutationFn: saveOpeningBalances,
    onSuccess: (result) => {
      if (result.carried > 0) {
        message.success(`上期结转完成：已结转 ${result.carried} 个科目`);
      } else {
        message.success('期初余额已保存');
        setOpeningOpen(false);
      }
      invalidate();
    },
    onError: (error: Error) => {
      message.error(error instanceof Error ? error.message : '保存失败，请重试');
    },
  });

  const openOpeningModal = async (): Promise<void> => {
    try {
      const { balances } = await getOpeningBalances(yearStr);
      setOpeningRows(
        balances.map((b) => ({
          accountCode: b.accountCode,
          accountName: b.accountName,
          debit: b.debit,
          credit: b.credit,
        })),
      );
    } catch {
      setOpeningRows([]);
    }
    setOpeningOpen(true);
  };

  const submitOpening = (): void => {
    saveOpening.mutate({
      year: yearStr,
      balances: openingRows.map((r) => ({
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: r.debit,
        credit: r.credit,
      })),
    });
  };

  const trialColumns: ColumnsType<TrialBalanceRow> = [
    { title: '科目', dataIndex: 'code', width: 90, render: (v, r) => `${v} ${r.name}` },
    { title: '类别', dataIndex: 'category', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '期初借方', dataIndex: 'openDebit', width: 110, align: 'right', render: (v: number) => v || '—' },
    { title: '期初贷方', dataIndex: 'openCredit', width: 110, align: 'right', render: (v: number) => v || '—' },
    { title: '发生借方', dataIndex: 'curDebit', width: 110, align: 'right', render: (v: number) => v || '—' },
    { title: '发生贷方', dataIndex: 'curCredit', width: 110, align: 'right', render: (v: number) => v || '—' },
    { title: '期末借方', dataIndex: 'endDebit', width: 110, align: 'right', render: (v: number) => v || '—' },
    { title: '期末贷方', dataIndex: 'endCredit', width: 110, align: 'right', render: (v: number) => v || '—' },
  ];

  const detailColumns: ColumnsType<LedgerEntry> = [
    { title: '日期', dataIndex: 'date', width: 110 },
    { title: '凭证号', dataIndex: 'voucherNo', width: 130 },
    { title: '摘要', dataIndex: 'summary' },
    { title: '借方', dataIndex: 'debit', width: 100, align: 'right', render: (v: number) => v || '—' },
    { title: '贷方', dataIndex: 'credit', width: 100, align: 'right', render: (v: number) => v || '—' },
    { title: '余额借方', dataIndex: 'runningDebit', width: 100, align: 'right', render: (v: number) => v || '—' },
    { title: '余额贷方', dataIndex: 'runningCredit', width: 100, align: 'right', render: (v: number) => v || '—' },
  ];

  const totals = reports.data?.trialBalance.totals;

  return (
    <PageContainer
      title="总账与期初"
      description="科目余额表、明细账与期初余额管理"
      extra={
        <>
          <DatePicker
            picker="year"
            value={year}
            onChange={(v) => v && setYear(v)}
            allowClear={false}
          />
          <Radio.Group value={view} onChange={(e) => setView(e.target.value as 'trial' | 'detail')}>
            <Radio.Button value="trial">总账（科目余额表）</Radio.Button>
            <Radio.Button value="detail">明细账</Radio.Button>
          </Radio.Group>
          <Button onClick={() => void openOpeningModal()}>期初录入</Button>
          <Button
            type="dashed"
            loading={saveOpening.isPending}
            onClick={() => saveOpening.mutate({ year: yearStr, carryFromPrevious: true })}
          >
            上期结转
          </Button>
        </>
      }
    >
      {view === 'trial' ? (
        <Card
          title={`科目余额表（${yearStr} 年度）`}
          extra={
            reports.data && (
              <Tag color={reports.data.closingExists ? 'green' : 'default'}>
                {reports.data.closingExists ? '已结账' : '未结账'}
              </Tag>
            )
          }
        >
          {reports.isError ? (
            <ErrorState description="科目余额表加载失败" onRetry={() => void reports.refetch()} />
          ) : (
            <Table<TrialBalanceRow>
              rowKey="code"
              size="small"
              loading={reports.isLoading}
              dataSource={(reports.data?.trialBalance.rows ?? []).filter(
                (r) =>
                  r.openDebit || r.openCredit || r.curDebit || r.curCredit || r.endDebit || r.endCredit,
              )}
              columns={trialColumns}
              pagination={false}
              summary={() =>
                totals ? (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Typography.Text strong>合计</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={1}>—</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Typography.Text strong>{totals.openDebit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Typography.Text strong>{totals.openCredit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <Typography.Text strong>{totals.curDebit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <Typography.Text strong>{totals.curCredit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Typography.Text strong>{totals.endDebit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <Typography.Text strong>{totals.endCredit.toLocaleString()}</Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          )}
        </Card>
      ) : (
        <Card
          title={`明细账（${yearStr} 年度）`}
          extra={
            <Select
              value={detailAccount}
              onChange={setDetailAccount}
              options={accountOptions}
              showSearch
              optionFilterProp="label"
              style={{ width: 220 }}
            />
          }
        >
          {ledger.data && (
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag>{ledger.data.account.name}</Tag>
              <Tag>{ledger.data.account.category}</Tag>
              <Typography.Text type="secondary">
                期初：借 {ledger.data.openDebit} / 贷 {ledger.data.openCredit}
              </Typography.Text>
            </Space>
          )}
          {ledger.isError ? (
            <ErrorState description="明细账加载失败" onRetry={() => void ledger.refetch()} />
          ) : (
            <Table<LedgerEntry>
              rowKey={(r) => `${r.voucherNo}-${r.date}-${r.debit}-${r.credit}`}
              size="small"
              loading={ledger.isLoading}
              dataSource={ledger.data?.entries ?? []}
              columns={detailColumns}
              pagination={false}
            />
          )}
        </Card>
      )}

      <Modal
        title={`期初余额录入（${yearStr} 年度）`}
        open={openingOpen}
        onCancel={() => setOpeningOpen(false)}
        onOk={submitOpening}
        confirmLoading={saveOpening.isPending}
        width={640}
        destroyOnHidden
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {openingRows.map((row, index) => (
            <Space key={index}>
              <Select
                value={row.accountCode}
                options={accountOptions}
                showSearch
                optionFilterProp="label"
                style={{ width: 220 }}
                onChange={(v) => {
                  const account = ACCOUNTS.find((a) => a.code === v);
                  setOpeningRows(
                    openingRows.map((r, i) =>
                      i === index ? { ...r, accountCode: v, accountName: account?.name ?? v } : r,
                    ),
                  );
                }}
              />
              <InputNumber
                min={0}
                value={row.debit}
                placeholder="借方"
                onChange={(v) =>
                  setOpeningRows(
                    openingRows.map((r, i) => (i === index ? { ...r, debit: v ?? 0 } : r)),
                  )
                }
              />
              <InputNumber
                min={0}
                value={row.credit}
                placeholder="贷方"
                onChange={(v) =>
                  setOpeningRows(
                    openingRows.map((r, i) => (i === index ? { ...r, credit: v ?? 0 } : r)),
                  )
                }
              />
              <Button
                size="small"
                danger
                onClick={() => setOpeningRows(openingRows.filter((_, i) => i !== index))}
              >
                删除
              </Button>
            </Space>
          ))}
          <Button
            type="dashed"
            block
            onClick={() =>
              setOpeningRows([
                ...openingRows,
                { accountCode: '', accountName: '', debit: 0, credit: 0 },
              ])
            }
          >
            添加科目
          </Button>
        </Space>
      </Modal>
    </PageContainer>
  );
}
