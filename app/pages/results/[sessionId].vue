<script setup lang="ts">
import { motion } from 'motion-v'
import { sortRankedRolesDescending } from '~/utils/assessment'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  RankedRoleInsight,
  Role,
} from '~/shared/types/assessment'

const route = useRoute('/results/[sessionId]')
const { getResults } = useAssessmentResults()
const { createSession, getSession } = useAssessmentSession()
const toast = useToast()

const { data: _fetchData, error: fetchError } = await useAsyncData(
  `results-${route.params.sessionId}`,
  async () => {
    const [sessionSnapshot, resultsAttempt] = await Promise.all([
      getSession(route.params.sessionId),
      getResults(route.params.sessionId).catch((error) => {
        const apiError = error as ApiError
        if (apiError.statusCode === 404) return null
        throw error
      }),
    ])
    return { sessionSnapshot, resultsAttempt }
  },
)

const sessionSnapshot = _fetchData.value?.sessionSnapshot

if (fetchError.value) {
  toast.add({
    title: 'Could not load results',
    description: getErrorMessage(fetchError.value as ApiError) ?? undefined,
    color: 'error',
  })
}

if (
  sessionSnapshot?.current_question ||
  sessionSnapshot?.status !== 'completed'
) {
  await navigateTo(
    `/assessment/${sessionSnapshot?.id ?? route.params.sessionId}`,
  )
}

const results = ref(_fetchData.value?.resultsAttempt ?? null)
const continueButton = ref<HTMLButtonElement | null>(null)
const isContinuing = ref(false)

const rankedRoles = computed(() =>
  sortRankedRolesDescending(results.value?.ranked_roles ?? []),
)

const primaryRankedRole = computed(() => rankedRoles.value[0] ?? null)
const alternativeRoles = computed(() => rankedRoles.value.slice(1, 3))
const primaryRole = computed(
  () =>
    results.value?.best_fit_role ??
    results.value?.preferred_role ??
    ({
      id: 0,
      slug: primaryRankedRole.value?.slug ?? 'recommended-role',
      name: primaryRankedRole.value?.name ?? 'Recommended software role',
    } satisfies Role),
)

const selectedRole = ref<RankedRoleInsight | Role | null>(null)

watch(
  primaryRole,
  (newVal) => {
    if (newVal && !selectedRole.value) {
      selectedRole.value = newVal
    }
  },
  { immediate: true },
)

const selectedRoleName = computed(
  () => selectedRole.value?.name ?? primaryRole.value?.name ?? 'Selected role',
)

function getRoleDescription(role: RankedRoleInsight | Role | null): string {
  if (!role) {
    return 'Your answers point toward this path as the clearest next direction.'
  }

  if ('description' in role && role.description) {
    return role.description
  }

  if ('top_supporting_pillars' in role && role.top_supporting_pillars.length) {
    return `Strongest signals: ${role.top_supporting_pillars.join(', ')}.`
  }

  return 'A close fit based on your work-style and preference pattern.'
}

async function handleContinue() {
  const role = selectedRole.value
  if (!role?.slug || isContinuing.value) {
    return
  }

  if (role.slug === primaryRole.value?.slug) {
    await navigateTo(`/roadmaps/${route.params.sessionId}`)
    return
  }

  isContinuing.value = true

  try {
    const session = await createSession({
      preferred_role_slug: role.slug,
    })

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

    await navigateTo(`/roadmaps/${session.id}`)
  } catch (error) {
    toast.add({
      title: 'Could not start Phase 2',
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  } finally {
    isContinuing.value = false
  }
}

useSeoMeta({
  title: 'CompetencyX | Role recommendation',
  description:
    'Review your primary recommended software role and top alternatives before continuing to skill assessment.',
})

onMounted(async () => {
  await nextTick()
  continueButton.value?.focus()
})
</script>

<template>
  <main v-if="results" id="main-content" class="page-wrap">
    <div class="mb-4">
      <NuxtLink to="/" class="editorial-link text-sm"
        >Back to landing page</NuxtLink
      >
    </div>

    <motion.section
      class="result-spotlight mx-auto max-w-5xl p-6 text-center md:p-8 lg:p-10"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4 }"
      aria-labelledby="results-title"
    >
      <div class="mx-auto max-w-3xl">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          <span aria-hidden="true">✓</span>
          Phase 1 complete
        </div>

        <h1
          id="results-title"
          class="mx-auto mt-8 max-w-4xl font-display text-4xl font-semibold leading-tight text-ink md:text-6xl"
        >
          {{ primaryRole.name }} looks like your strongest role direction.
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">
          {{ getRoleDescription(primaryRankedRole || primaryRole) }}
        </p>
      </div>

      <section class="mt-10 grid gap-4 text-left md:grid-cols-3">
        <!-- Primary role card -->
        <article
          :class="[
            'result-role-card p-5 md:p-6 transition-all duration-200 relative border cursor-pointer flex flex-col justify-between',
            selectedRole?.slug === primaryRole.slug
              ? 'border-accent ring-2 ring-accent/30 bg-accent/[0.02]'
              : 'border-border-subtle hover:border-ink-soft/40',
            isContinuing ? 'pointer-events-none opacity-80' : '',
          ]"
          @click="selectedRole = primaryRole"
        >
          <div>
            <div
              v-if="selectedRole?.slug === primaryRole.slug"
              class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold shadow-sm"
              aria-hidden="true"
            >
              ✓
            </div>
            <p class="eyebrow">Primary role</p>
            <h2 class="mt-3 text-2xl font-black text-ink">
              {{ primaryRole.name }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-ink-soft">
              {{ getRoleDescription(primaryRankedRole || primaryRole) }}
            </p>
          </div>
          <div class="mt-6">
            <div
              v-if="selectedRole?.slug === primaryRole.slug"
              class="rounded-xl border border-accent/20 bg-accent/8 px-4 py-3"
            >
              <p
                class="text-xs font-extrabold uppercase tracking-[0.08em] text-accent"
              >
                Default selection
              </p>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                Phase 2 will start with
                <span class="font-semibold text-ink">{{
                  primaryRole.name
                }}</span
                >.
              </p>
            </div>
            <button
              v-else
              type="button"
              class="cx-button-secondary w-full"
              :disabled="isContinuing"
            >
              Select primary role
            </button>
          </div>
        </article>

        <!-- Alternative role cards -->
        <article
          v-for="(role, index) in alternativeRoles"
          :key="role.slug"
          :class="[
            'result-role-card p-5 md:p-6 transition-all duration-200 relative border cursor-pointer flex flex-col justify-between',
            selectedRole?.slug === role.slug
              ? 'border-accent ring-2 ring-accent/30 bg-accent/[0.02]'
              : 'border-border-subtle hover:border-ink-soft/40',
            isContinuing ? 'pointer-events-none opacity-80' : '',
          ]"
          @click="selectedRole = role"
        >
          <div>
            <div
              v-if="selectedRole?.slug === role.slug"
              class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold shadow-sm"
              aria-hidden="true"
            >
              ✓
            </div>
            <p class="eyebrow">Close fit {{ index + 1 }}</p>
            <h2 class="mt-3 text-2xl font-black text-ink">{{ role.name }}</h2>
            <p class="mt-3 text-sm leading-7 text-ink-soft">
              {{ getRoleDescription(role) }}
            </p>
          </div>
          <div class="mt-6">
            <div
              v-if="selectedRole?.slug === role.slug"
              class="rounded-xl border border-accent/20 bg-accent/8 px-4 py-3"
            >
              <p
                class="text-xs font-extrabold uppercase tracking-[0.08em] text-accent"
              >
                Selected
              </p>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                Phase 2 will start with
                <span class="font-semibold text-ink">{{ role.name }}</span
                >.
              </p>
            </div>
            <button
              v-else
              type="button"
              class="cx-button-secondary w-full"
              :disabled="isContinuing"
            >
              Use this role instead
            </button>
          </div>
        </article>
      </section>

      <section
        class="mt-8 rounded-xl border border-border-subtle bg-surface-elevated/90 p-5 text-left shadow-[0_18px_44px_rgba(74,54,35,0.08)] md:p-6"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="max-w-2xl">
            <p class="eyebrow">Assignment 2</p>
            <h2 class="mt-3 text-2xl font-bold text-ink">
              Continue with {{ selectedRoleName }}
            </h2>
            <p class="mt-2 text-sm leading-7 text-ink-soft">
              {{
                selectedRole?.slug === primaryRole?.slug
                  ? 'Your recommended role is already prepared as the default path for the next assignment.'
                  : 'You have selected an alternative software role for your skill assessment.'
              }}
            </p>
          </div>
          <div
            class="rounded-full border border-border-subtle bg-paper-strong px-4 py-2"
          >
            <p
              class="text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft"
            >
              Selected role
            </p>
            <p class="mt-1 text-sm font-bold text-ink">
              {{ selectedRoleName }}
            </p>
          </div>
        </div>
      </section>

      <button
        ref="continueButton"
        type="button"
        class="cx-button-primary mt-10 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isContinuing"
        @click="handleContinue"
      >
        {{
          isContinuing
            ? 'Preparing Assignment 2...'
            : 'Continue to Assignment 2'
        }}
      </button>
    </motion.section>
  </main>
</template>
