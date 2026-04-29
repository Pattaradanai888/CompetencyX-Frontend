<script setup lang="ts">
import RoleCard from '~/components/catalog/RoleCard.vue'
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useCatalogApi } from '~/composables/useCatalogApi'
import type { ApiError, RoadmapTopic, Role } from '~/shared/types/assessment'

const route = useRoute('/assessment/start')
const { listRoleTopics, listRoles } = useCatalogApi()
const { createSession, isSubmitting, lastSessionId } = useAssessmentSession()

const preferredRoleSlug = useLocalStorage<string | null>(
  'competencyx:preferred-role',
  null,
)
const pageError = ref<ApiError | null>(null)

if (typeof route.query.role === 'string') {
  preferredRoleSlug.value = route.query.role
}

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

const searchQuery = ref('')
const activeCategory = ref('All')

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

const resultSummary = computed(() => {
  if (!roles.value.length) {
    return 'Role catalog is empty.'
  }

  if (!filteredRoles.value.length) {
    return 'No roles match the current filters.'
  }

  return `Showing ${filteredRoles.value.length} of ${roles.value.length} roles.`
})

const onboardingSteps = [
  'Pick a role target or leave it open',
  'Answer focused scenario questions',
  'Review fit, gaps, and the next roadmap topic',
]

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = 'All'
}

function clearPreferredRole() {
  preferredRoleSlug.value = null
}

async function handleStart() {
  pageError.value = null

  try {
    const session = await createSession(
      preferredRoleSlug.value
        ? { preferred_role_slug: preferredRoleSlug.value }
        : {},
    )

    await navigateTo(`/assessment/${session.id}`)
  } catch (error) {
    pageError.value = error as ApiError
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
        class="inline-flex items-center justify-center rounded-full border border-[var(--cx-border)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--cx-ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--cx-accent)]/35 hover:text-[var(--cx-accent)]"
      >
        Resume previous session
      </NuxtLink>
    </div>

    <section
      class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.92fr)] lg:items-start"
    >
      <section
        class="glass-panel rounded-[2.2rem] p-6 md:p-8"
        aria-labelledby="onboarding-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="eyebrow">Onboarding</p>
          <p
            class="rounded-full border border-[var(--cx-accent-soft)] bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cx-accent)]"
            aria-live="polite"
          >
            {{ selectedRole ? 'Role selected' : 'Open discovery' }}
          </p>
        </div>

        <h1
          id="onboarding-title"
          class="mt-4 max-w-4xl font-display text-4xl leading-tight text-[var(--cx-ink)] md:text-5xl"
        >
          Choose a role target, or let the assessment find the strongest signal.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-[var(--cx-ink-soft)]">
          A preferred role frames the roadmap preview. The final recommendation
          still comes from your answers, so leaving this open is a valid
          starting point.
        </p>

        <ol
          class="assessment-stagebar mt-6 grid gap-3 rounded-[1.6rem] border border-black/6 bg-white/60 p-3 sm:grid-cols-3"
          aria-label="Assessment onboarding steps"
        >
          <li
            v-for="(step, index) in onboardingSteps"
            :key="step"
            class="rounded-[1.2rem] border border-black/6 bg-[var(--cx-paper-strong)]/80 p-3"
          >
            <p
              class="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[var(--cx-warm)]"
            >
              Step {{ index + 1 }}
            </p>
            <p
              class="mt-2 text-sm font-semibold leading-6 text-[var(--cx-ink)]"
            >
              {{ step }}
            </p>
          </li>
        </ol>

        <div
          class="mt-6 rounded-[1.6rem] border border-black/6 bg-white/65 p-4"
          aria-live="polite"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p
                class="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--cx-ink-soft)]"
              >
                Current target
              </p>
              <p
                class="mt-1 break-words font-display text-2xl leading-tight text-[var(--cx-ink)]"
              >
                {{ selectedRoleName }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-[var(--cx-border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--cx-ink)] transition hover:-translate-y-0.5 hover:border-[var(--cx-accent)]/35 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!selectedRole"
              @click="clearPreferredRole"
            >
              Continue without a preferred role
            </button>
          </div>
          <p class="mt-3 text-sm leading-6 text-[var(--cx-ink-soft)]">
            {{
              selectedRole
                ? 'You can change the target before starting. The assessment will still compare it with the best-fit role.'
                : 'Start open-ended if you want the recommendation to emerge from the assessment.'
            }}
          </p>
        </div>

        <div class="mt-6 space-y-4" aria-labelledby="role-filter-title">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="role-filter-title"
                class="font-display text-2xl text-[var(--cx-ink)]"
              >
                Role chooser
              </h2>
              <p class="mt-1 text-sm text-[var(--cx-ink-soft)]">
                Search by title, discipline, or description.
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
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cx-ink-soft)]/60"
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
                class="w-full rounded-full border border-black/8 bg-white/75 py-2.5 pl-11 pr-4 text-sm text-[var(--cx-ink)] placeholder:text-[var(--cx-ink-soft)]/50 transition focus:border-[var(--cx-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--cx-accent-soft)]"
              >
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
              class="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition"
              :class="
                activeCategory === category
                  ? 'border-[var(--cx-accent)]/50 bg-[var(--cx-accent)]/10 text-[var(--cx-accent)]'
                  : 'border-black/8 bg-white/70 text-[var(--cx-ink-soft)] hover:border-black/15 hover:text-[var(--cx-ink)]'
              "
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
          </div>

          <p class="text-xs text-[var(--cx-ink-soft)]" aria-live="polite">
            {{ resultSummary }}
          </p>
        </div>

        <div
          class="mt-6 grid max-h-[34rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3"
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
            @select="preferredRoleSlug = role.slug"
          />
        </div>

        <p
          v-if="!filteredRoles.length && roles.length"
          class="mt-6 rounded-[1.35rem] border border-black/6 bg-white/70 p-4 text-sm text-[var(--cx-ink-soft)]"
          aria-live="polite"
        >
          No roles match your search. Try a different keyword or clear the
          filters.
        </p>

        <div
          v-if="pageError"
          aria-live="polite"
          role="alert"
          class="mt-6 rounded-[1.5rem] border border-rose-300/50 bg-rose-50/90 p-4 text-sm text-rose-900"
        >
          {{ getErrorMessage(pageError) }} Check the API connection and try
          starting again.
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-[var(--cx-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSubmitting"
            @click="handleStart"
          >
            {{
              isSubmitting ? 'Preparing your assessment…' : 'Start assessment'
            }}
          </button>
          <p
            v-if="isSubmitting"
            aria-live="polite"
            role="status"
            class="text-sm text-[var(--cx-ink-soft)]"
          >
            Setting up your first question…
          </p>
        </div>
      </section>

      <aside
        class="paper-panel rounded-[2rem] p-6 md:sticky md:top-6 md:p-8"
        aria-labelledby="roadmap-preview-title"
      >
        <p class="eyebrow">Roadmap preview</p>
        <h2
          id="roadmap-preview-title"
          class="mt-4 font-display text-3xl leading-tight text-[var(--cx-ink)]"
        >
          {{
            selectedRole?.name || 'Choose a path to preview its learning arc'
          }}
        </h2>
        <p class="mt-4 text-sm leading-7 text-[var(--cx-ink-soft)]">
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
            class="h-14 rounded-[1.25rem] bg-white/65"
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
            class="rounded-[1.35rem] border border-black/6 bg-white/74 p-4"
          >
            <p class="text-sm font-semibold text-[var(--cx-ink)]">
              {{ topic.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-[var(--cx-ink-soft)]">
              {{
                topic.description ||
                'This topic appears in the roadmap preview for the selected role.'
              }}
            </p>
          </li>
        </ol>

        <p
          v-else-if="selectedRole"
          class="mt-6 rounded-[1.35rem] border border-black/6 bg-white/70 p-4 text-sm text-[var(--cx-ink-soft)]"
        >
          No roadmap preview is available for this role yet. You can still
          continue and review the full recommendation at the end.
        </p>

        <p
          v-else
          class="mt-6 rounded-[1.35rem] border border-black/6 bg-white/70 p-4 text-sm text-[var(--cx-ink-soft)]"
        >
          Select a role to preview roadmap topics, or start the assessment
          without a preferred role.
        </p>
      </aside>
    </section>
  </main>
</template>
