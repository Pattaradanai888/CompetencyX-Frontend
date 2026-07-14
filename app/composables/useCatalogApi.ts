import type { RoadmapTopic, Role } from '~~/shared/types/assessment'
import { sortTopicsByDisplayOrder } from '~/utils/assessment'

export function useCatalogApi() {
  const { apiFetch } = useApiClient()

  async function listRoles() {
    return await apiFetch<Role[]>('/api/v1/catalog/roles/')
  }

  async function listRoleTopics(roleSlug: string) {
    const topics = await apiFetch<RoadmapTopic[]>(
      `/api/v1/catalog/roles/${roleSlug}/topics/`,
    )
    return sortTopicsByDisplayOrder(topics)
  }

  return {
    listRoles,
    listRoleTopics,
  }
}
