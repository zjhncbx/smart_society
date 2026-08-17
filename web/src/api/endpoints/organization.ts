import { z } from 'zod';

import {
  organizationProfileSchema,
  organizationRelationshipSchema,
} from '@/api/schemas';
import { OrganizationProfile, OrganizationRelationship } from '@/models/contract';
import { newCorrelationId, newIdempotencyKey } from '@/utils/id';
import { apiRequest } from '../client';

export async function getOrganization(): Promise<{
  profile: OrganizationProfile;
  relationships: OrganizationRelationship[];
}> {
  const data = await apiRequest<unknown>('/organization', { method: 'POST' });
  return z
    .object({
      profile: organizationProfileSchema,
      relationships: z.array(organizationRelationshipSchema),
    })
    .parse(data);
}

export async function saveOrganization(
  profile: Pick<OrganizationProfile, 'name' | 'description'>,
): Promise<OrganizationProfile> {
  const data = await apiRequest<unknown>('/organization/save', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('save_org'),
    correlationId: newCorrelationId(),
    body: profile,
  });
  return organizationProfileSchema.parse(data);
}

export async function setRelationship(input: {
  relatedOrgId: string;
  relType: 'child' | 'partner';
  shareMembers?: boolean;
  shareActivities?: boolean;
  shareNotices?: boolean;
}): Promise<{ ok: boolean }> {
  return apiRequest('/organization/relationship/set', {
    method: 'POST',
    idempotencyKey: newIdempotencyKey('set_rel'),
    correlationId: newCorrelationId(),
    body: input,
  });
}
