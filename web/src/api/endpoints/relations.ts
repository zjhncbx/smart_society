import { entityGraphSchema } from '@/api/schemas';
import { EntityGraph } from '@/models/contract';
import { apiRequest } from '../client';

/** 业务血缘关系图：以项目为根聚合决议/负责人/财务/审批/风险/任务 */
export async function getEntityRelations(entityId: string): Promise<EntityGraph> {
  const data = await apiRequest<unknown>('/relations', {
    method: 'POST',
    body: { entityType: 'project', entityId },
  });
  return entityGraphSchema.parse(data);
}
