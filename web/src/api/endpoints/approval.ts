import { z } from 'zod';

import { approvalInstanceSchema, resolutionSchema } from '@/api/schemas';
import { ApprovalInstance, Resolution } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getApprovals(): Promise<{ approvals: ApprovalInstance[] }> {
  const data = await apiRequest<unknown>('/approvals', {
    method: 'POST',
    functionName: 'get-approval-tasks',
  });
  return z.object({ approvals: z.array(approvalInstanceSchema) }).parse(data);
}

export async function actApproval(
  id: string,
  action: 'approve' | 'reject' | 'done',
  comment = '',
): Promise<{ status: string }> {
  return apiRequest('/approvals/act', {
    method: 'POST',
    functionName: 'act-finance-node',
    idempotencyKey: newIdempotencyKey('act_approval'),
    correlationId: newCorrelationId(),
    body: { id, action, comment },
  });
}

export async function getResolutions(): Promise<{ resolutions: Resolution[] }> {
  const data = await apiRequest<unknown>('/resolutions', {
    method: 'POST',
    functionName: 'get-resolutions',
  });
  return z.object({ resolutions: z.array(resolutionSchema) }).parse(data);
}

export async function saveResolution(
  resolution: Pick<Resolution, 'title' | 'content' | 'deadline' | 'responsibleName'>,
): Promise<Resolution> {
  const data = await apiRequest<unknown>('/resolutions/save', {
    method: 'POST',
    functionName: 'save-resolution',
    idempotencyKey: newIdempotencyKey('save_resolution'),
    correlationId: newCorrelationId(),
    body: resolution,
  });
  return resolutionSchema.parse(data);
}

export async function actResolution(
  id: string,
  action: 'start' | 'done' | 'reopen',
): Promise<{ id: string; status: string }> {
  return apiRequest('/resolutions/act', {
    method: 'POST',
    functionName: 'act-resolution',
    idempotencyKey: newIdempotencyKey('act_resolution'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}
