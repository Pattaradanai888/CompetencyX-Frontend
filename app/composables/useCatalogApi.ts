import type { RoadmapTopic, Role, RoleRoadmap } from '~~/shared/types/assessment'
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

  /**
   * A role's full roadmap, including the external (roadmap.sh) graph that the
   * backend imports as master data. Previously the browser fetched that graph
   * straight from raw.githubusercontent.com on every page view; it now comes
   * from our own database, so the page works offline and shows the same
   * sequence to everyone.
   */
  async function getRoleRoadmap(roleSlug: string) {
    return await apiFetch<RoleRoadmap>(
      `/api/v1/catalog/roles/${roleSlug}/roadmap/`,
    )
  }

  return {
    listRoles,
    listRoleTopics,
    getRoleRoadmap,
  }
}
