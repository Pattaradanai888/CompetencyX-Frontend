<script setup lang="ts">
import {
  formatConfidencePercent,
  getAlignmentLabel,
  getRoleResolutionLabel,
  sortMasteryDescending,
  sortRankedRolesDescending,
} from '~/utils/assessment'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useAssessmentSession } from '~/composables/useAssessmentSession'

const RecommendationCard = defineAsyncComponent(
  () => import('~/components/results/RecommendationCard.vue'),
)

const route = useRoute('/results/[sessionId]')
const { getResults } = useAssessmentResults()
const { getSession } = useAssessmentSession()

const [sessionSnapshot, resultsAttempt] = await Promise.all([
  getSession(route.params.sessionId),
  getResults(route.params.sessionId).catch(() => null),
])

let initialResults = null

if (
  sessionSnapshot.current_question ||
  sessionSnapshot.status !== 'completed'
) {
  await navigateTo(
    `/assessment/${sessionSnapshot.id ?? route.params.sessionId}`,
  )
} else {
  initialResults = resultsAttempt
}

const results = ref(initialResults)
const roadmapsButton = ref<HTMLAnchorElement | null>(null)

const masteryScores = computed(() =>
  sortMasteryDescending(results.value?.mastery_scores ?? []),
)
const gapTopics = computed(() => results.value?.preferred_role_gap_topics ?? [])
const pillarProfile = computed(() => results.value?.pillar_profile ?? [])
const rankedRoles = computed(() =>
  sortRankedRolesDescending(results.value?.ranked_roles ?? []),
)

useSeoMeta({
  title: 'CompetencyX | Assessment results',
  description:
    'Review your role fit, gap topics, and recommended next learning steps for the completed assessment.',
})

onMounted(async () => {
  await nextTick()
  roadmapsButton.value?.focus()
})
</script>

<template>
  <main v-if="results" id="main-content" class="page-wrap">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/assessment/start" class="editorial-link text-sm">
        Start a new assessment
      </NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink
          ref="roadmapsButton"
          :to="`/roadmaps/${route.params.sessionId}`"
          class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
        >
          Continue to Roadmaps
        </NuxtLink>
        <p class="text-sm text-ink-soft">
          Updated <NuxtTime :datetime="results.updated_at" relative />
        </p>
      </div>
    </div>

    <div
      class="assessment-stagebar mt-6 flex flex-wrap items-center justify-between gap-3 border border-border-subtle bg-surface-muted px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <span class="eyebrow mb-0">Results dossier</span>
        <span
          class="rounded-full border border-border-subtle bg-paper-strong px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-soft"
        >
          Assessment complete
        </span>
        <span
          class="rounded-full border border-accent-soft bg-emerald-50/80 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-accent"
        >
          {{ getRoleResolutionLabel(results.role_resolution_status) }}
        </span>
      </div>
      <p class="text-sm text-ink-soft">
        Your recommendation is based on the latest completed session.
      </p>
    </div>

    <Motion.section
      class="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4 }"
    >
      <section class="glass-panel p-6 md:p-8">
        <p class="eyebrow">Results dossier</p>
        <h1
          class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl"
        >
          {{
            results.best_fit_role?.name ||
            results.preferred_role?.name ||
            'Assessment complete'
          }}
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-ink-soft">
          {{ results.guidance_summary }}
        </p>

        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <div
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">Preferred role</p>
            <p class="mt-3 text-lg font-semibold text-ink">
              {{ results.preferred_role?.name || 'Not specified' }}
            </p>
          </div>
          <div
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">Best fit</p>
            <p class="mt-3 text-lg font-semibold text-ink">
              {{ results.best_fit_role?.name || 'Still calibrating' }}
            </p>
          </div>
          <div
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">Confidence</p>
            <p class="mt-3 text-lg font-semibold text-ink">
              {{ formatConfidencePercent(results.best_fit_confidence) }}
            </p>
          </div>
        </div>

        <div
          class="mt-6 rounded-lg border border-border-subtle bg-surface-card p-5"
        >
          <p class="eyebrow">Alignment read</p>
          <p class="mt-3 text-lg font-semibold text-ink">
            {{ getAlignmentLabel(results.role_alignment_status) }}
          </p>
          <p class="mt-2 text-sm font-semibold text-ink">
            Resolution:
            {{ getRoleResolutionLabel(results.role_resolution_status) }}
          </p>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            Role answers: {{ results.milestones.answered_role_questions }}.
            Skill answers: {{ results.milestones.answered_skill_questions }}.
          </p>
        </div>
      </section>

      <div class="space-y-6">
        <RecommendationCard
          eyebrow="Preferred path recommendation"
          :recommendation="results.preferred_path_recommendation"
        />
        <RecommendationCard
          eyebrow="Best-fit path recommendation"
          :recommendation="results.best_fit_path_recommendation"
        />
      </div>
    </Motion.section>

    <section class="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section class="paper-panel p-6 md:p-8">
        <p class="eyebrow">Role fit analysis</p>
        <h2 class="mt-4 text-3xl font-bold text-ink">
          Why this role rose to the top
        </h2>
        <div class="mt-6 space-y-3">
          <div
            v-for="role in rankedRoles"
            :key="role.slug"
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-ink">
                  {{ role.name }}
                </p>
                <p class="mt-2 text-sm leading-6 text-ink-soft">
                  {{
                    role.top_supporting_pillars.join(', ') ||
                    'No supporting pillar details available.'
                  }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-ink">
                  {{ formatConfidencePercent(role.fit_score) }}
                </p>
                <p
                  class="mt-1 text-xs uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ formatConfidencePercent(role.fit_share) }} share
                </p>
              </div>
            </div>
          </div>
          <p
            v-if="!rankedRoles.length"
            class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
          >
            Ranked role insights are not available for this assessment.
          </p>
        </div>
      </section>

      <section class="paper-panel p-6 md:p-8">
        <p class="eyebrow">Gap topics</p>
        <h2 class="mt-4 text-3xl font-bold text-ink">What to close next</h2>
        <div class="mt-6 space-y-3">
          <div
            v-for="topic in gapTopics"
            :key="topic.id"
            class="rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="text-sm font-semibold text-ink">
              {{ topic.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-ink-soft">
              {{
                topic.description ||
                'This topic is highlighted as a likely gap for the preferred role path.'
              }}
            </p>
          </div>
          <p
            v-if="!gapTopics.length"
            class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
          >
            No focused gap topics are highlighted for this path.
          </p>
        </div>
      </section>

      <section class="paper-panel p-6 md:p-8">
        <p class="eyebrow">Mastery scores</p>
        <h2 class="mt-4 text-3xl font-bold text-ink">
          Confidence-weighted topic readout
        </h2>
        <div class="mt-6 space-y-3">
          <LazyMasteryMeter
            v-for="item in masteryScores"
            :key="item.topic_id"
            :mastery="item"
          />
          <p
            v-if="!masteryScores.length"
            class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
          >
            Topic confidence scores are not available for this assessment.
          </p>
        </div>
      </section>
    </section>

    <section class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">Pillar profile</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">
        Evidence behind the recommendation
      </h2>
      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="pillar in pillarProfile"
          :key="pillar.key"
          class="rounded-md border border-border-subtle bg-surface-card p-4"
        >
          <p class="text-sm font-semibold text-ink">
            {{ pillar.label }}
          </p>
          <p class="mt-3 text-2xl font-semibold text-ink">
            {{ formatConfidencePercent(pillar.normalized_score) }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            Raw score {{ pillar.raw_score }} from
            {{ pillar.evidence_count }} evidence point{{
              pillar.evidence_count === 1 ? '' : 's'
            }}.
          </p>
        </div>
        <p
          v-if="!pillarProfile.length"
          class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
        >
          Pillar-level explainability data is not available for this assessment.
        </p>
      </div>
    </section>
  </main>
</template>
