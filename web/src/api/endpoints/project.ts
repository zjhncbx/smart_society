import { z } from 'zod';

import { projectSchema } from '@/api/schemas';
import { Project } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getProjects(params: {
  status?: number;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ projects: Project[]; total: number; hasMore: boolean }> {
  const data = await apiRequest<unknown>('/projects', { method: 'POST', body: params });
  const parsed = z
    .object({
      projects: z.array(projectSchema),
      total: z.number(),
      hasMore: z.boolean().optional(),
    })
    .parse(data);
  return { ...parsed, hasMore: parsed.hasMore ?? false };
}

export async function saveProject(
  project: Partial<Project> & { id?: string },
): Promise<Project> {
  const data = await apiRequest<unknown>('/projects/save', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('save_project'),
    correlationId: newCorrelationId(),
    body: project,
  });
  return projectSchema.parse(data);
}

/** 项目状态迁移：必须走业务动作（禁止 CRUD 改 status） */
export async function transitionProject(
  id: string,
  action: 'start' | 'pause' | 'resume' | 'complete',
): Promise<{ id: string; status: number; statusLabel: string }> {
  return apiRequest('/projects/transition', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('transition_project'),
    correlationId: newCorrelationId(),
    body: { id, action },
  });
}
