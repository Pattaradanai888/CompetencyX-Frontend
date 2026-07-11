<script setup lang="ts">
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { formatPillarScore } from '~/utils/roadmaps'
import type { RadarDimension } from '~/utils/roadmaps'
import type { PillarInsight, RoadmapTopic } from '~~/shared/types/assessment'

const props = defineProps<{
  roleTitle: string
  personalitySignal: string | undefined
  topPersonalityPillars: PillarInsight[]
  personalityFitScoreDisplay: string
  overallCapabilityScore: number
  readinessStatus: string
  recalculatedStrengths: string[]
  recalculatedGrowthAreas: string[]
  targetScore: number
  isAtTarget: boolean
  capabilityGap: number
  displayTopics: RoadmapTopic[]
  blendedDimensions: RadarDimension[]
  hasRoleAnswers: boolean
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)
</script>

<template>
  <section class="result-spotlight mt-10 overflow-hidden p-5 md:p-10">
    <div
      class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
    >
      <span aria-hidden="true">✓</span>
      {{ t.assessmentComplete }}
    </div>

    <h2
      class="mt-6 max-w-4xl font-display text-4xl leading-tight text-ink md:text-6xl"
    >
      {{ roleTitle }} {{ t.readinessOrganized }}
    </h2>
    <p class="mt-5 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
      {{ t.viewIntro }}
    </p>

    <div class="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
      <!-- Left column: cards -->
      <div class="grid gap-5">
        <div v-if="hasRoleAnswers" class="grid gap-5 sm:grid-cols-2">
          <article class="paper-panel p-5">
            <p class="eyebrow">{{ t.personalityResult }}</p>
            <h3 class="mt-2 text-xl font-bold text-ink">
              {{ roleTitle }}
            </h3>
            <p class="mt-1 text-xs leading-6 text-ink-soft">
              {{ personalitySignal }}
            </p>

            <div class="mt-4 grid gap-2">
              <div
                class="rounded-xl border border-border-subtle bg-surface-card px-4 py-3"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.personalityFit }}
                </p>
                <div class="mt-1 flex items-end justify-between gap-3">
                  <p class="data-value text-2xl font-bold text-ink">
                    {{ personalityFitScoreDisplay }}
                  </p>
                  <p class="text-[11px] font-semibold text-ink-soft">
                    {{ t.basedOnProfile }}
                  </p>
                </div>
              </div>

              <div
                v-for="pillar in topPersonalityPillars.slice(0, 3)"
                :key="pillar.key"
                class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2.5"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-ink">
                    {{ pillar.label }}
                  </p>
                  <p class="data-value text-sm font-bold text-accent">
                    {{ formatPillarScore(pillar) }}
                  </p>
                </div>
                <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                  <div
                    class="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                    :style="{
                      width: `${Math.round(pillar.normalized_score * 100)}%`,
                    }"
                  />
                </div>
              </div>
            </div>
          </article>

          <article class="paper-panel flex flex-col p-5">
            <p class="eyebrow">{{ t.heroMetrics }}</p>
            <div class="mt-4 grid flex-1 grid-rows-3 gap-2">
              <div class="metric-card p-4">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.overallReadiness }}
                </p>
                <p class="data-value mt-1 text-3xl font-bold text-ink">
                  {{ overallCapabilityScore }}%
                </p>
                <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                  <div
                    class="h-1.5 rounded-full bg-accent"
                    :style="{ width: `${overallCapabilityScore}%` }"
                  />
                </div>
              </div>
              <div class="metric-card p-4">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.readinessStatus }}
                </p>
                <p class="mt-1 text-xl font-bold text-ink">
                  {{ readinessStatus }}
                </p>
              </div>
              <div class="metric-card p-4">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.strongestNow }}
                </p>
                <p class="mt-1 text-sm leading-6 text-ink-soft">
                  {{ recalculatedStrengths.join(' • ') }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <article class="paper-panel p-5">
          <p class="eyebrow">{{ t.roleGapInsight }}</p>
          <h3 class="mt-2 text-xl font-bold text-ink">
            {{ roleTitle }}
          </h3>
          <p class="mt-1 text-xs leading-6 text-ink-soft">
            {{ t.gapInsightCopy }}
          </p>

          <div
            class="mt-4 grid gap-3"
            :class="hasRoleAnswers ? '' : 'sm:grid-cols-2'"
          >
            <div
              class="rounded-xl border-l-4 border-l-blueprint bg-surface-card px-4 py-3"
            >
              <p
                class="text-[11px] font-bold uppercase tracking-[0.1em] text-blueprint"
              >
                {{ t.asIs }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ t.currentCapability }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-bold text-ink">
                  {{ overallCapabilityScore }}%
                </p>
                <p class="text-[11px] font-semibold text-ink-soft">
                  {{ t.overallReadiness }}
                </p>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-blueprint"
                  :style="{ width: `${overallCapabilityScore}%` }"
                />
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ t.topGaps }}: {{ recalculatedGrowthAreas.join(' • ') }}
              </p>
            </div>

            <div
              class="rounded-xl border-l-4 border-l-accent bg-surface-card px-4 py-3"
            >
              <p
                class="text-[11px] font-bold uppercase tracking-[0.1em] text-accent"
              >
                {{ t.toBe }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ roleTitle }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-bold text-accent">
                  {{ targetScore }}%
                </p>
                <p class="text-[11px] font-semibold text-ink-soft">
                  {{ t.targetReadiness }}
                </p>
              </div>
              <div class="mt-1 h-1.5 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-accent"
                  :style="{ width: `${targetScore}%` }"
                />
              </div>
              <div
                class="mt-2 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-2"
              >
                <p class="text-[11px] font-bold text-ink-soft">
                  {{ t.gapToTarget }}
                </p>
                <p
                  class="text-sm font-bold"
                  :class="isAtTarget ? 'text-green-600' : 'text-ink'"
                >
                  {{
                    isAtTarget ? t.gapClosed : `${capabilityGap} ${t.pointsNeeded}`
                  }}
                </p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ displayTopics.length }} {{ t.gapTopicsCount }}
              </p>
              <div
                v-if="displayTopics.length"
                class="mt-1 flex flex-wrap gap-1.5"
              >
                <span
                  v-for="topic in displayTopics.slice(0, 3)"
                  :key="topic.id"
                  class="rounded-full border border-border-subtle bg-surface-elevated/60 px-2 py-0.5 text-[11px] font-semibold text-ink-soft"
                >
                  {{ topic.title }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Right column: spider chart -->
      <div class="paper-panel p-5 xl:sticky xl:top-8 xl:self-start">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="eyebrow">{{ t.capabilityMap }}</p>
            <h3 class="mt-2 text-xl font-bold text-ink">
              {{ t.profileCenterpiece }}
            </h3>
          </div>
          <div
            class="shrink-0 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-center"
          >
            <p class="data-value text-lg font-bold text-accent">
              {{ overallCapabilityScore }}%
            </p>
            <p
              class="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
            >
              {{ t.overallReadiness }}
            </p>
          </div>
        </div>
        <p class="mt-2 text-xs leading-6 text-ink-soft">
          {{ t.mapCopy }}
        </p>
        <div class="mt-4">
          <SkillSpiderChart :dimensions="blendedDimensions" />
        </div>
      </div>
    </div>
  </section>
</template>
