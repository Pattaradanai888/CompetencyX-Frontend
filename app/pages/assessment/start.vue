<script setup lang="ts">
import RoleCard from '~/components/catalog/RoleCard.vue'
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useCatalogApi } from '~/composables/useCatalogApi'
import type { ApiError, RoadmapTopic, Role } from '~/shared/types/assessment'

const route = useRoute('/assessment/start')
const { listRoleTopics, listRoles } = useCatalogApi()
const { createSession, getSession, isSubmitting, lastSessionId } =
  useAssessmentSession()

const PREFERRED_ROLE_KEY = 'competencyx:preferred-role'

const preferredRoleSlug = ref<string | null>(null)
const pageError = ref<ApiError | null>(null)
const toast = useToast()
const decisionMode = ref<'known' | 'unsure'>(
  typeof route.query.role === 'string' ? 'known' : 'unsure',
)

if (typeof route.query.role === 'string') {
  preferredRoleSlug.value = route.query.role
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, route.query.role)
  }
}

onMounted(() => {
  const stored = localStorage.getItem(PREFERRED_ROLE_KEY)
  if (stored) {
    preferredRoleSlug.value = stored
    decisionMode.value = 'known'
  }
})

const { data: roles } = await useAsyncData('start-roles', listRoles, {
  default: () => [] as Role[],
})

const { data: topics, pending: topicsPending } = await useAsyncData(
  'start-role-topics',
  async () => {
    if (!preferredRoleSlug.value) {
      return [] as RoadmapTopic[]
    }

    return await listRoleTopics(preferredRoleSlug.value)
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

const ROLE_CATEGORIES: Record<string, string> = {
  'frontend-engineer': 'Engineering',
  'backend-engineer': 'Engineering',
  'full-stack-engineer': 'Engineering',
  'devops-engineer': 'Engineering',
  'mobile-engineer': 'Engineering',
  'system-engineer': 'Engineering',
  'ai-engineer': 'Engineering',
  'cybersecurity-engineer': 'Engineering',
  'solutions-architect': 'Engineering',
  'system-architect': 'Engineering',
  'qa-test-engineer': 'Engineering',
  'data-engineer': 'Data',
  'data-scientist': 'Data',
  'data-analyst': 'Data',
  'product-manager': 'Product & Management',
  'product-owner': 'Product & Management',
  'project-manager': 'Product & Management',
  'business-analyst': 'Product & Management',
  'systems-analyst': 'Product & Management',
  'ux-ui-designer': 'Design',
  'sap-erp-consultant': 'Enterprise',
}

function getCategoryForRole(slug: string): string {
  return ROLE_CATEGORIES[slug] || 'Other'
}

const router = useRouter()
const searchQuery = ref(
  typeof route.query.search === 'string' ? route.query.search : '',
)
const activeCategory = ref(
  typeof route.query.category === 'string' ? route.query.category : 'All',
)

watch(
  [searchQuery, activeCategory, preferredRoleSlug],
  ([search, category, role]) => {
    const query: Record<string, string> = {}
    if (role) query.role = role
    if (search) query.search = search
    if (category !== 'All') query.category = category
    router.replace({ path: '/assessment/start', query })
  },
  { flush: 'post' },
)

const availableCategories = computed(() => {
  const categories = new Set(
    roles.value.map((role) => getCategoryForRole(role.slug)),
  )
  return ['All', ...Array.from(categories).sort()]
})

const filteredRoles = computed(() => {
  let result = roles.value

  if (activeCategory.value !== 'All') {
    result = result.filter(
      (role) => getCategoryForRole(role.slug) === activeCategory.value,
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        (role.description ?? '').toLowerCase().includes(query),
    )
  }

  return result
})

const isFiltered = computed(
  () => activeCategory.value !== 'All' || searchQuery.value.trim() !== '',
)

const selectedRoleName = computed(
  () => selectedRole.value?.name ?? 'No preferred role',
)

const startButtonLabel = computed(() => {
  if (isSubmitting.value) return 'Preparing your assessment...'
  if (decisionMode.value === 'known') {
    return selectedRole.value
      ? 'Start Phase 2 skill assessment'
      : 'Choose a role to continue'
  }
  return 'Start Phase 1 discovery'
})

const canStart = computed(
  () =>
    !isSubmitting.value &&
    (decisionMode.value === 'unsure' || Boolean(selectedRole.value)),
)

const resultSummary = computed(() => {
  if (!roles.value.length) {
    return 'Role catalog is empty.'
  }

  if (!filteredRoles.value.length) {
    return 'No roles match the current filters.'
  }

  return `Showing ${filteredRoles.value.length} of ${roles.value.length} roles.`
})

const decisionCards = [
  {
    mode: 'known' as const,
    title: 'I already know my role',
    copy: 'Pick a target role and move straight into role-aware skill calibration.',
    tag: 'Skip Phase 1',
  },
  {
    mode: 'unsure' as const,
    title: 'I am still exploring',
    copy: 'Start with personality and preference questions to discover suitable roles.',
    tag: 'Start Phase 1',
  },
]

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = 'All'
}

function selectPreferredRole(slug: string) {
  decisionMode.value = 'known'
  preferredRoleSlug.value = slug
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, slug)
  }
}

function clearPreferredRole() {
  decisionMode.value = 'unsure'
  preferredRoleSlug.value = null
  if (import.meta.client) {
    localStorage.removeItem(PREFERRED_ROLE_KEY)
  }
}

function selectDecisionMode(mode: 'known' | 'unsure') {
  decisionMode.value = mode
  if (mode === 'known' && !preferredRoleSlug.value) {
    const firstRole = filteredRoles.value[0]
    if (firstRole) {
      selectPreferredRole(firstRole.slug)
    }
  } else if (mode === 'unsure') {
    clearPreferredRole()
  }
}

async function handleStart() {
  if (!canStart.value) {
    return
  }

  pageError.value = null

  try {
    const session = await createSession(
      preferredRoleSlug.value
        ? { preferred_role_slug: preferredRoleSlug.value }
        : {},
    )

    if (decisionMode.value === 'known' && preferredRoleSlug.value) {
      const maxAttempts = 4
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const hydratedSession = await getSession(session.id)
        if (hydratedSession.current_question?.stage === 'skill') {
          break
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250))
        }
      }
    }

    if (decisionMode.value === 'known' && preferredRoleSlug.value) {
      await navigateTo(`/roadmaps/${session.id}`)
      return
    }

    await navigateTo(`/assessment/${session.id}`)
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: 'Could not start assessment',
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  }
}

useSeoMeta({
  title: 'CompetencyX | Start assessment',
  description:
    'Choose an optional preferred role, preview its roadmap themes, and begin the assessment.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/" class="editorial-link text-sm"
        >Back to overview</NuxtLink
      >
      <NuxtLink
        v-if="lastSessionId"
        :to="`/assessment/${lastSessionId}`"
        class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
      >
        Resume previous session
      </NuxtLink>
    </div>

    <section
      class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)] lg:items-start"
    >
      <section
        class="glass-panel p-6 md:p-8"
        aria-labelledby="onboarding-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="eyebrow">Onboarding</p>
          <p
            class="rounded-full border border-accent-soft bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent"
            aria-live="polite"
          >
            {{ selectedRole ? 'Role selected' : 'Open discovery' }}
          </p>
        </div>

        <h1
          id="onboarding-title"
          class="mt-4 max-w-4xl font-display text-4xl leading-tight text-ink md:text-5xl"
        >
          Do you already know which software role you want?
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-ink-soft">
          Choose a target role to move directly into Phase 2, or start with
          Phase 1 if you want the platform to recommend roles from your
          preferences.
        </p>

        <div
          class="mt-6 grid gap-3 md:grid-cols-2"
          role="radiogroup"
          aria-label="Choose assessment entry point"
        >
          <button
            v-for="card in decisionCards"
            :key="card.mode"
            type="button"
            role="radio"
            :aria-checked="decisionMode === card.mode"
            class="option-card min-h-44 rounded-md p-5 text-left"
            :class="
              decisionMode === card.mode
                ? 'border-accent/60 shadow-[0_16px_34px_rgba(15,118,110,0.16)]'
                : ''
            "
            @click="selectDecisionMode(card.mode)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="eyebrow">{{ card.tag }}</span>
                <span
                  class="mt-4 block text-2xl font-black leading-tight text-ink"
                >
                  {{ card.title }}
                </span>
                <span class="mt-3 block text-sm leading-7 text-ink-soft">
                  {{ card.copy }}
                </span>
              </div>
              <span
                class="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black"
                :class="
                  decisionMode === card.mode
                    ? 'border-accent bg-accent text-white'
                    : 'border-border-subtle text-ink-soft'
                "
                aria-hidden="true"
              >
                {{ decisionMode === card.mode ? '✓' : '' }}
              </span>
            </div>
          </button>
        </div>

        <div class="assessment-stagebar mt-6 border border-border-subtle bg-surface-muted p-4">
          <p class="text-sm font-semibold text-ink">
            {{
              decisionMode === 'known'
                ? 'Next: choose your target role below, then start Phase 2.'
                : 'Next: start Phase 1 to discover your best-fit role first.'
            }}
          </p>
          <p class="mt-1 text-xs leading-6 text-ink-soft">
            You can switch modes any time before starting.
          </p>
        </div>

        <div
          class="mt-6 rounded-md border border-border-subtle bg-surface-muted p-4"
          aria-live="polite"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p
                class="text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft"
              >
                Current target
              </p>
              <p
                class="mt-1 wrap-break-word text-2xl font-bold leading-tight text-ink"
              >
                {{
                  decisionMode === 'known'
                    ? selectedRoleName
                    : 'Open role discovery'
                }}
              </p>
            </div>
            <button
              type="button"
              class="cx-button-secondary"
              :disabled="decisionMode === 'unsure' && !selectedRole"
              @click="clearPreferredRole"
            >
              Use discovery mode
            </button>
          </div>
          <p class="mt-3 text-sm leading-6 text-ink-soft">
            {{
              decisionMode === 'known'
                ? 'Select a role below, then continue directly into the role-specific skill assessment path.'
                : 'The first phase will ask preference and personality-style questions before skill calibration.'
            }}
          </p>
        </div>

        <div
          v-if="decisionMode === 'known'"
          class="mt-6 space-y-4"
          aria-labelledby="role-filter-title"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="role-filter-title" class="text-2xl font-bold text-ink">
                Role chooser
              </h2>
              <p class="mt-1 text-sm text-ink-soft">
                Choose a role if you want to skip Phase 1 and go straight to
                technical calibration.
              </p>
            </div>
            <button
              v-if="isFiltered"
              type="button"
              class="editorial-link text-sm"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <label class="block" for="role-search">
            <span class="sr-only">Search roles</span>
            <span class="relative block">
              <svg
                aria-hidden="true"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="4.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M10.5 10.5L14 14"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <input
                id="role-search"
                v-model="searchQuery"
                name="role-search"
                type="text"
                autocomplete="off"
                placeholder="Search roles…"
                class="w-full rounded-full border border-border-subtle bg-surface-card py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-soft/50 transition focus-visible:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
              />
            </span>
          </label>

          <div
            class="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Filter roles by category"
          >
            <button
              v-for="category in availableCategories"
              :key="category"
              type="button"
              role="radio"
              :aria-checked="activeCategory === category"
              class="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] transition"
              :class="
                activeCategory === category
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border-subtle bg-surface-card text-ink-soft hover:border-ink/12 hover:text-ink'
              "
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
          </div>

          <p class="text-xs text-ink-soft" aria-live="polite">
            {{ resultSummary }}
          </p>
        </div>

        <div v-if="decisionMode === 'known'">
          <div
            class="mt-6 grid max-h-136 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3"
            role="group"
            aria-label="Available roles"
          >
            <RoleCard
              v-for="role in filteredRoles"
              :key="role.id"
              :role="role"
              :selected="role.slug === preferredRoleSlug"
              :topics-count="
                role.slug === preferredRoleSlug ? topics.length : undefined
              "
              compact
              @select="selectPreferredRole"
            />
          </div>

          <p
            v-if="!filteredRoles.length && roles.length"
            class="mt-6 rounded-md border border-border-subtle bg-surface-card p-4 text-sm text-ink-soft"
            aria-live="polite"
          >
            No roles match your search. Try a different keyword or clear the
            filters.
          </p>
        </div>

        <p
          v-else
          class="mt-6 rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
        >
          Discovery mode is active. You can start immediately and CompetencyX
          will recommend role paths after your Phase 1 responses.
        </p>

        <div
          v-if="pageError"
          aria-live="polite"
          role="alert"
          class="cx-error-panel mt-6 p-4 text-sm"
        >
          {{ getErrorMessage(pageError) }} Please try starting again.
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="cx-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canStart"
            @click="handleStart"
          >
            <span
              v-if="isSubmitting"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
            {{ startButtonLabel }}
          </button>
          <p
            v-if="isSubmitting"
            aria-live="polite"
            role="status"
            class="text-sm text-ink-soft"
          >
            Setting up your first question…
          </p>
        </div>
      </section>

      <aside
        class="paper-panel sticky top-4 self-start rounded-4xl p-6 md:top-6 md:max-h-[calc(100vh-2.5rem)] md:overflow-auto md:p-8"
        aria-labelledby="roadmap-preview-title"
      >
        <p class="eyebrow">Roadmap preview</p>
        <h2
          id="roadmap-preview-title"
          class="mt-4 text-3xl font-bold leading-tight text-ink"
        >
          {{
            selectedRole?.name || 'Choose a path to preview its learning arc'
          }}
        </h2>
        <p class="mt-4 text-sm leading-7 text-ink-soft">
          {{
            selectedRole
              ? selectedRole.description ||
                'Review the first topics this path emphasizes before you begin.'
              : 'Select a preferred role to preview the first topics and the overall direction of the assessment.'
          }}
        </p>

        <div
          v-if="topicsPending"
          aria-live="polite"
          role="status"
          class="mt-6 space-y-3"
        >
          <p class="sr-only">Loading roadmap preview…</p>
          <div
            v-for="index in 4"
            :key="index"
            class="skeleton h-14 rounded-[1.25rem]"
          />
        </div>

        <ol
          v-else-if="topics.length"
          class="mt-6 space-y-3"
          aria-label="Preview roadmap topics"
        >
          <li
            v-for="topic in topics.slice(0, 6)"
            :key="topic.id"
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="text-sm font-semibold text-ink">
              {{ topic.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-ink-soft">
              {{
                topic.description ||
                'This topic appears in the roadmap preview for the selected role.'
              }}
            </p>
          </li>
        </ol>

        <p
          v-else-if="selectedRole"
          class="mt-6 rounded-md border border-border-subtle bg-surface-card p-4 text-sm text-ink-soft"
        >
          No roadmap preview is available for this role. You can still continue
          and review the full recommendation at the end.
        </p>

        <p
          v-else
          class="mt-6 rounded-md border border-border-subtle bg-surface-card p-4 text-sm text-ink-soft"
        >
          Select a role to preview roadmap topics, or start the assessment
          without a preferred role.
        </p>
      </aside>
    </section>
  </main>
</template>
