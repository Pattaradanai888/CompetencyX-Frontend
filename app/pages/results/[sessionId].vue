<script setup lang="ts">
import { motion } from 'motion-v'
import {
  sortRankedRolesDescending,
} from '~/utils/assessment'
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
const { getSession } = useAssessmentSession()
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
const continueButton = ref<HTMLAnchorElement | null>(null)

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

const primaryScore = computed(
  () =>
    primaryRankedRole.value?.fit_share ??
    primaryRankedRole.value?.fit_score ??
    results.value?.best_fit_confidence ??
    0,
)

function normalizeDisplayScore(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

const primaryScorePercent = computed(() =>
  Math.round(normalizeDisplayScore(primaryScore.value) * 100),
)

function getDisplayPercentForRole(role: RankedRoleInsight): string {
  const raw = role.fit_share ?? role.fit_score ?? 0
  return `${Math.round(normalizeDisplayScore(raw) * 100)}%`
}

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

useSeoMeta({
  title: 'CompetencyX | Role recommendation',
  description:
    'Review your primary recommended software role and top alternatives before continuing to skill assessment.',
})

onMounted(async () => {
  await nextTick()
  const focusTarget =
    continueButton.value instanceof HTMLElement
      ? continueButton.value
      : (
          continueButton.value as unknown as {
            $el?: HTMLElement
          } | null
        )?.$el

  focusTarget?.focus()
})
</script>

<template>
  <main v-if="results" id="main-content" class="page-wrap">
    <div class="mb-4">
      <NuxtLink to="/" class="editorial-link text-sm">Back to landing page</NuxtLink>
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

        <div class="mt-8 flex justify-center">
          <div
            class="result-match-ring"
            :style="{ '--score': `${primaryScorePercent}%` }"
            aria-label="Primary match score"
          >
            <div
              class="grid h-28 w-28 place-items-center rounded-full bg-paper-strong"
            >
              <div class="text-center">
                <p class="data-value text-4xl font-black text-ink">
                  {{ primaryScorePercent }}%
                </p>
                <p
                  class="mt-1 text-xs font-extrabold uppercase tracking-[0.1em] text-ink-soft"
                >
                  match
                </p>
              </div>
            </div>
          </div>
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
        <article class="result-role-card p-5 md:p-6">
          <p class="eyebrow">Primary role</p>
          <h2 class="mt-3 text-2xl font-black text-ink">
            {{ primaryRole.name }}
          </h2>
          <p class="mt-3 text-sm leading-7 text-ink-soft">
            {{ getRoleDescription(primaryRankedRole || primaryRole) }}
          </p>
          <p class="mt-5 data-value text-3xl font-black text-accent">
            {{ primaryScorePercent }}%
          </p>
        </article>

        <article
          v-for="(role, index) in alternativeRoles"
          :key="role.slug"
          class="result-role-card p-5 md:p-6"
        >
          <p class="eyebrow">Alternative {{ index + 1 }}</p>
          <div class="mt-3 flex items-start justify-between gap-4">
            <h2 class="text-2xl font-black text-ink">{{ role.name }}</h2>
            <p class="data-value text-lg font-black text-accent">
              {{ getDisplayPercentForRole(role) }}
            </p>
          </div>
          <p class="mt-3 text-sm leading-7 text-ink-soft">
            {{ getRoleDescription(role) }}
          </p>
        </article>
      </section>

      <section class="mt-8 rounded-xl border border-border-subtle bg-surface-card p-5 text-left md:p-6">
        <h2 class="text-lg font-bold text-ink">How to read these numbers</h2>
        <p class="mt-2 text-sm leading-7 text-ink-soft">
          These percentages are normalized match shares, not raw model scores.
          Higher means stronger alignment with your Survey 1 answers.
        </p>
        <p class="mt-2 text-sm leading-7 text-ink-soft">
          Use the top role as your primary direction, and alternatives as nearby
          paths you can still explore.
        </p>
      </section>

      <NuxtLink
        ref="continueButton"
        :to="`/roadmaps/${route.params.sessionId}`"
        class="cx-button-primary mt-10"
      >
        Continue to Phase 2
      </NuxtLink>
    </motion.section>
  </main>
</template>
