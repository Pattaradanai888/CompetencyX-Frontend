<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useLocale } from '~/composables/useLocale'
import { useSessionCreate } from '~/composables/useSessionCreate'
import { getRoleMeta } from '~/data/roleMeta'
import { PREFERRED_ROLE_KEY } from '~/utils/constants'
import type { ApiError, RoadmapTopic, Role } from '~~/shared/types/assessment'

const route = useRoute('/assessment/start')
const { getRoleRoadmap, listRoleTopics, listRoles } = useCatalogApi()
const { isSubmitting } = useAssessmentSession()
const { createAndNavigate } = useSessionCreate()
const { currentLanguage, isThai } = useLocale()

const preferredRoleSlug = ref<string | null>(null)
const pageError = ref<ApiError | null>(null)
const toast = useToast()
const router = useRouter()

if (typeof route.query.role === 'string') {
  preferredRoleSlug.value = route.query.role
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, route.query.role)
  }
}

onMounted(() => {
  const stored = localStorage.getItem(PREFERRED_ROLE_KEY)
  if (stored && !preferredRoleSlug.value) {
    preferredRoleSlug.value = stored
  }
})

const t = usePageI18n('start', isThai)

// Use shared 'catalog-roles' key so SSR cache is reused from index.vue (P1-D)
const { data: roles, pending: rolesPending } = await useAsyncData(
  'catalog-roles',
  listRoles,
  {
    default: () => [] as Role[],
  },
)

/**
 * Topics shown in the role preview.
 *
 * Prefers the imported roadmap.sh sequence -- the same one the roadmap page
 * renders, served from our own database -- so the preview shows the real
 * learning path instead of the handful of curated catalog topics. Falls back
 * to the curated topics for a role with no imported snapshot.
 */
async function loadRolePreviewTopics(roleSlug: string): Promise<RoadmapTopic[]> {
  try {
    const roadmap = await getRoleRoadmap(roleSlug)
    // Top-level topics read as a curriculum outline; subtopics are often
    // interchangeable alternatives (PHP / Go / Java ...) that make a poor
    // preview. Roadmaps too flat to have several top-level topics fall back
    // to the full sequence.
    const MIN_PREVIEW_TOPICS = 3
    const topLevel = roadmap.external_topics.filter((t) => t.node_type === 'topic')
    const preview =
      topLevel.length >= MIN_PREVIEW_TOPICS ? topLevel : roadmap.external_topics

    if (preview.length) {
      return preview.map((topic, index) => ({
        id: -(index + 1),
        slug: topic.slug,
        title: topic.title,
        parent_id: null,
        prerequisites: [],
        display_order: topic.display_order,
        topic_group: topic.topic_group,
      }))
    }
    return roadmap.topics
  } catch {
    return await listRoleTopics(roleSlug)
  }
}

const { data: topics, pending: topicsPending } = await useAsyncData(
  'start-role-topics',
  async () => {
    if (!preferredRoleSlug.value) {
      return [] as RoadmapTopic[]
    }

    return await loadRolePreviewTopics(preferredRoleSlug.value)
  },
  {
    watch: [preferredRoleSlug],
    default: () => [] as RoadmapTopic[],
  },
)

const selectedRole = computed(
  () =>
    roles.value.find((role) => role.slug === preferredRoleSlug.value) ?? null,
)

const searchQuery = ref(
  typeof route.query.search === 'string' ? route.query.search : '',
)

watch(
  [searchQuery, preferredRoleSlug],
  ([search, role]) => {
    const query: Record<string, string> = {}
    if (role) query.role = role
    if (search) query.search = search
    router.replace({ path: '/assessment/start', query })
  },
  { flush: 'post' },
)

const filteredRoles = computed(() => {
  let result = roles.value

  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    result = result.filter((role) => {
      const meta = getRoleMeta(role.slug)
      const searchable = [
        role.name,
        role.description ?? '',
        meta.domain,
        ...meta.careerAreas,
        ...meta.workStyle,
        ...meta.environment,
        ...meta.experience,
        ...meta.skills,
        ...meta.interests,
        ...meta.responsibilities,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }

  return result
})

const resultSummary = computed(() => {
  if (!roles.value.length) {
    return t.value.emptyCatalog
  }

  if (!filteredRoles.value.length) {
    return t.value.noRolesMatch
  }

  if (isThai.value) {
    return `กำลังแสดง ${filteredRoles.value.length} จากทั้งหมด ${roles.value.length} ตำแหน่งงาน`
  }
  return `Showing ${filteredRoles.value.length} of ${roles.value.length} roles.`
})

const selectedMeta = computed(() => getRoleMeta(selectedRole.value?.slug))
const selectedRoleTopics = computed(() => topics.value.slice(0, 6))
const selectedRoleName = computed(
  () => selectedRole.value?.name ?? t.value.choosePrompt,
)

const startButtonLabel = computed(() => {
  if (isSubmitting.value) return t.value.preparingSession
  return selectedRole.value ? t.value.startSkillAssessment : t.value.chooseRoleToContinue
})

const canStart = computed(
  () => !isSubmitting.value && Boolean(selectedRole.value),
)

function clearFilters() {
  searchQuery.value = ''
}

function selectPreferredRole(slug: string) {
  preferredRoleSlug.value = slug
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, slug)
  }
}

async function handleStart() {
  if (!canStart.value) {
    return
  }

  pageError.value = null

  try {
    await createAndNavigate({
      preferred_role_slug: preferredRoleSlug.value ?? undefined,
      language: currentLanguage.value,
    })
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: isThai.value
        ? 'ไม่สามารถเริ่มต้นแบบประเมินได้'
        : 'Could not start assessment',
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  }
}

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | เลือกตำแหน่งงาน'
      : 'CompetencyX | Choose role',
  ),
  description: computed(() =>
    isThai.value
      ? 'สำรวจและเลือกตำแหน่งเป้าหมายก่อนเริ่มการประเมินทักษะ'
      : 'Choose your preferred role before starting the skill assessment.',
  ),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <!-- Onboarding Header -->
    <header class="mt-6 border-b border-border-subtle pb-6">
      <p class="eyebrow">Onboarding</p>
      <h1 class="mt-2 font-display text-4xl leading-tight text-ink md:text-5xl">
        {{ t.title }}
      </h1>
      <p class="mt-2 text-sm text-ink-soft">
        {{ t.subtitle }}
      </p>
    </header>

    <div class="role-selection-layout">
      <!-- Left Panel: Search & Cards grid -->
      <AssessmentRoleExplorerPanel
        v-model:search-query="searchQuery"
        :roles-pending="rolesPending"
        :filtered-roles="filteredRoles"
        :preferred-role-slug="preferredRoleSlug"
        :result-summary="resultSummary"
        :t="t"
        :is-thai="isThai"
        :topics-pending="topicsPending"
        :selected-role-topics="selectedRoleTopics"
        :can-start="canStart"
        :is-submitting="isSubmitting"
        :start-button-label="startButtonLabel"
        @clear-filters="clearFilters"
        @select-role="selectPreferredRole"
        @start="handleStart"
      />

      <AssessmentRoleDetailPanel
        :selected-role="selectedRole"
        :selected-role-name="selectedRoleName"
        :selected-meta="selectedMeta"
        :topics-pending="topicsPending"
        :selected-role-topics="selectedRoleTopics"
        :is-submitting="isSubmitting"
        :can-start="canStart"
        :start-button-label="startButtonLabel"
        :page-error="pageError"
        :t="t"
        :is-thai="isThai"
        @start="handleStart"
      />
    </div>
  </main>
</template>
