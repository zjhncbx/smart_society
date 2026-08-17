import { z } from 'zod';

import {
  dataQualityIssueSchema,
  dataQualitySnapshotSchema,
} from '@/api/schemas';
import { DataQualityIssue, DataQualitySnapshot } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getDataQuality(): Promise<{
  snapshot: DataQualitySnapshot;
  issues: DataQualityIssue[];
  openTotal: number;
}> {
  const data = await apiRequest<unknown>('/data-quality', { method: 'POST' });
  const parsed = z
    .object({
      snapshot: dataQualitySnapshotSchema,
      issues: z.array(dataQualityIssueSchema),
      openTotal: z.number(),
    })
    .parse(data);
  return parsed;
}

export async function runDataQuality(): Promise<{ score: number; open: number }> {
  return apiRequest('/data-quality/run', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('run_data_quality'),
    correlationId: newCorrelationId(),
  });
}

export async function actIssue(
  id: string,
  action: 'resolve' | 'ignore' | 'reopen',
): Promise<{ id: string; status: string }> {
  return apiRequest('/data-quality/act', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('resolve_dq'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}
