import { z } from 'zod';

import {
  accountingReportsSchema,
  approvalFlowSchema,
  ledgerEntrySchema,
  openingBalanceSchema,
} from '@/api/schemas';
import { ApprovalFlowNode, ClosePeriodResult, OpeningBalance } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

// ---- 审批流配置（get-approval-flows / save-approval-flow） ----

export async function getApprovalFlows(params: {
  bizType?: 'finance' | 'project';
} = {}): Promise<{ flows: Array<{ id: string; name: string; bizType: string; nodes: string; enabled: boolean; isDefault: boolean }> }> {
  const data = await apiRequest<unknown>('/finance/flows', {
    method: 'POST',
    functionName: 'get-approval-flows',
    body: params,
  });
  const parsed = z
    .object({ flows: z.array(approvalFlowSchema) })
    .parse(data);
  return parsed;
}

/** 云侧 nodes 为 JSON 字符串，统一解析为节点数组 */
export function parseFlowNodes(nodes: string): ApprovalFlowNode[] {
  try {
    const parsed: unknown = JSON.parse(nodes);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (n): n is ApprovalFlowNode =>
          n != null && typeof n === 'object' && typeof (n as ApprovalFlowNode).id === 'string',
      );
    }
  } catch {
    // 保持兜底
  }
  return [];
}

export interface SaveApprovalFlowPayload {
  id?: string;
  name: string;
  bizType: 'finance' | 'project';
  nodes: ApprovalFlowNode[];
  enabled: boolean;
  isDefault: boolean;
}

/** 保存审批流（save-approval-flow 契约：flow 整体传入，幂等键强制，返回 {flowId}） */
export async function saveApprovalFlow(payload: SaveApprovalFlowPayload): Promise<{ flowId: string }> {
  return apiRequest('/finance/flows/save', {
    method: 'POST',
    functionName: 'save-approval-flow',
    idempotencyKey: newIdempotencyKey('save_flow'),
    correlationId: newCorrelationId(),
    body: {
      flow: {
        id: payload.id ?? '',
        name: payload.name,
        bizType: payload.bizType,
        nodes: JSON.stringify(payload.nodes),
        enabled: payload.enabled,
        isDefault: payload.isDefault,
      },
    },
  });
}

// ---- 期初余额（get-opening-balances / save-opening-balances） ----

export async function getOpeningBalances(year: string): Promise<{ balances: OpeningBalance[] }> {
  const data = await apiRequest<unknown>('/finance/opening', {
    method: 'POST',
    functionName: 'get-opening-balances',
    body: { year },
  });
  const parsed = z
    .object({ balances: z.array(openingBalanceSchema) })
    .parse(data);
  return { balances: parsed.balances as OpeningBalance[] };
}

export interface SaveOpeningBalancesPayload {
  year: string;
  /** 手工录入的期初余额 */
  balances?: Array<{ accountCode: string; accountName: string; debit: number; credit: number }>;
  /** true 时从上年度期末自动结转（仅资产负债类科目） */
  carryFromPrevious?: boolean;
}

/** 保存期初余额（save-opening-balances 契约：幂等键强制，返回 {balances, carried}） */
export async function saveOpeningBalances(
  payload: SaveOpeningBalancesPayload,
): Promise<{ balances: OpeningBalance[]; carried: number }> {
  const data = await apiRequest<unknown>('/finance/opening/save', {
    method: 'POST',
    functionName: 'save-opening-balances',
    idempotencyKey: newIdempotencyKey('save_opening'),
    correlationId: newCorrelationId(),
    body: payload,
  });
  const parsed = z
    .object({
      balances: z.array(openingBalanceSchema),
      carried: z.number(),
    })
    .parse(data);
  return { balances: parsed.balances as OpeningBalance[], carried: parsed.carried };
}

// ---- 总账/明细账（get-ledger） ----

export async function getLedger(year: string, accountCode: string): Promise<{
  account: { code: string; name: string; category: string };
  year: string;
  openDebit: number;
  openCredit: number;
  entries: Array<{
    date: string;
    voucherNo: string;
    summary: string;
    debit: number;
    credit: number;
    runningDebit: number;
    runningCredit: number;
  }>;
}> {
  const data = await apiRequest<unknown>('/finance/ledger', {
    method: 'POST',
    functionName: 'get-ledger',
    body: { year, accountCode },
  });
  return z
    .object({
      account: z.object({ code: z.string(), name: z.string(), category: z.string() }),
      year: z.string(),
      openDebit: z.number(),
      openCredit: z.number(),
      entries: z.array(ledgerEntrySchema),
    })
    .parse(data);
}

// ---- 会计报表（get-accounting-reports：科目余额表 + 结账状态） ----

export async function getAccountingReports(year: string): Promise<{
  year: string;
  closingExists: boolean;
  trialBalance: {
    rows: Array<{
      code: string;
      name: string;
      category: string;
      openDebit: number;
      openCredit: number;
      curDebit: number;
      curCredit: number;
      endDebit: number;
      endCredit: number;
    }>;
    totals: {
      openDebit: number;
      openCredit: number;
      curDebit: number;
      curCredit: number;
      endDebit: number;
      endCredit: number;
    };
  };
}> {
  const data = await apiRequest<unknown>('/finance/reports', {
    method: 'POST',
    functionName: 'get-accounting-reports',
    body: { year },
  });
  // 云侧还返回 balanceSheet/activityStatement/cashFlow，本页只用科目余额表，宽松校验
  return accountingReportsSchema.parse(data);
}

// ---- 期末结账 / 反结账（close-period / unclose-period，幂等键强制 + admin 门禁） ----

export async function closePeriod(year: string): Promise<ClosePeriodResult> {
  const data = await apiRequest<unknown>('/finance/close', {
    method: 'POST',
    functionName: 'close-period',
    idempotencyKey: newIdempotencyKey('close_period'),
    correlationId: newCorrelationId(),
    body: { year },
  });
  return z
    .object({
      alreadyClosed: z.boolean().optional(),
      nothingToClose: z.boolean().optional(),
      voucherId: z.string().optional(),
      income: z.number().optional(),
      expense: z.number().optional(),
      entries: z.number().optional(),
    })
    .parse(data) as ClosePeriodResult;
}

export async function unclosePeriod(year: string): Promise<{ removed: number }> {
  return apiRequest('/finance/unclose', {
    method: 'POST',
    functionName: 'unclose-period',
    idempotencyKey: newIdempotencyKey('unclose_period'),
    correlationId: newCorrelationId(),
    body: { year },
  });
}
