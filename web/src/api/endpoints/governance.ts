import { z } from 'zod';

import {
  complianceItemSchema,
  licenseSchema,
  termSchema,
} from '@/api/schemas';
import { ComplianceItem, License, Term } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

// ---- 证照（get-licenses / save-license / act-license） ----

export async function getLicenses(params: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ licenses: License[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/governance/licenses', {
    method: 'POST',
    functionName: 'get-licenses',
    body: params,
  });
  const parsed = z
    .object({
      licenses: z.array(licenseSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export interface SaveLicensePayload {
  id?: string;
  name: string;
  licenseNo: string;
  issuer: string;
  issuedAt?: string | null;
  expireAt?: string | null;
}

/** 保存证照（save-license 契约：幂等键强制，返回 {id, code, status}） */
export async function saveLicense(payload: SaveLicensePayload): Promise<{
  id: string;
  code: string;
  status: string;
}> {
  return apiRequest('/governance/licenses/save', {
    method: 'POST',
    functionName: 'save-license',
    idempotencyKey: newIdempotencyKey('save_license'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}

/** 证照状态动作（act-license 契约：renew 可携带新到期日） */
export async function actLicense(
  id: string,
  action: 'renew' | 'expire' | 'reopen',
  expireAt?: string,
): Promise<{ id: string; status: string }> {
  return apiRequest('/governance/licenses/act', {
    method: 'POST',
    functionName: 'act-license',
    idempotencyKey: newIdempotencyKey('act_license'),
    correlationId: newCorrelationId(),
    body: { id, action, expireAt },
  });
}

// ---- 合规事项（get-compliance-items / save-compliance-item / act-compliance-item） ----

export async function getComplianceItems(params: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  items: ComplianceItem[];
  total: number;
  hasMore: boolean;
}> {
  const data = await apiRequest<unknown>('/governance/compliance', {
    method: 'POST',
    functionName: 'get-compliance-items',
    body: params,
  });
  const parsed = z
    .object({
      items: z.array(complianceItemSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export interface SaveComplianceItemPayload {
  id?: string;
  name: string;
  itemType: string;
  deadline?: string | null;
  responsibleMemberId?: string;
  responsibleName?: string;
}

/** 保存合规事项（save-compliance-item 契约） */
export async function saveComplianceItem(
  payload: SaveComplianceItemPayload,
): Promise<{ id: string; code: string; status: string }> {
  return apiRequest('/governance/compliance/save', {
    method: 'POST',
    functionName: 'save-compliance-item',
    idempotencyKey: newIdempotencyKey('save_compliance'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}

/** 合规事项动作（act-compliance-item 契约：start→executing / done→done / reopen→pending） */
export async function actComplianceItem(
  id: string,
  action: 'start' | 'done' | 'reopen',
): Promise<{ id: string; status: string }> {
  return apiRequest('/governance/compliance/act', {
    method: 'POST',
    functionName: 'act-compliance-item',
    idempotencyKey: newIdempotencyKey('act_compliance'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}

// ---- 任期（get-terms / save-term / act-term） ----

export async function getTerms(params: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ terms: Term[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/governance/terms', {
    method: 'POST',
    functionName: 'get-terms',
    body: params,
  });
  const parsed = z
    .object({
      terms: z.array(termSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export interface SaveTermPayload {
  id?: string;
  title: string;
  governanceBody: string;
  startDate?: string | null;
  endDate?: string | null;
}

/** 保存任期（save-term 契约） */
export async function saveTerm(payload: SaveTermPayload): Promise<{
  id: string;
  code: string;
  status: string;
}> {
  return apiRequest('/governance/terms/save', {
    method: 'POST',
    functionName: 'save-term',
    idempotencyKey: newIdempotencyKey('save_term'),
    correlationId: newCorrelationId(),
    body: payload,
  });
}

/** 任期动作（act-term 契约：prepare→preparing / activate→active / archive→archived） */
export async function actTerm(
  id: string,
  action: 'prepare' | 'activate' | 'archive',
): Promise<{ id: string; status: string }> {
  return apiRequest('/governance/terms/act', {
    method: 'POST',
    functionName: 'act-term',
    idempotencyKey: newIdempotencyKey('act_term'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}
