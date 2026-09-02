<script setup lang="ts">
import { formatPillarScore, cleanPillarLabel } from '~/utils/roadmaps'
import type { TrackHighlight } from '~/utils/roadmaps'
import type { PillarInsight } from '~~/shared/types/assessment'

const props = defineProps<{
  overallCapabilityScore: number
  trackHighlights: TrackHighlight[]
  topPersonalityPillars: PillarInsight[]
  personalityFitRaw: number
  personalityFitNarrative: string
  hasRoleAnswers: boolean
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

const leadingTrack = computed(() => {
  if (props.trackHighlights.length < 2) return null
  const [a, b] = props.trackHighlights
  return a.average >= b.average ? a : b
})
</script>

<template>
  <section class="section-band mt-10 py-12 md:py-16">
    <div class="mx-auto max-w-6xl">
      <div class="max-w-3xl">
        <p class="eyebrow">{{ t.section }} 2</p>
        <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
          {{ hasRoleAnswers ? t.knowledgePersonalityFit : t.section2AltTitle }}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ hasRoleAnswers ? t.section2Copy : t.section2AltCopy }}
        </p>
      </div>

      <div
        class="mt-10 grid gap-6"
        :class="{ 'xl:grid-cols-2': hasRoleAnswers }"
      >
        <article class="paper-panel p-6 md:p-8 min-h-[320px]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.knowledgeFit }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.capabilityAlignment }}
              </h3>
            </div>
            <div class="text-right">
              <p class="data-value text-4xl font-bold text-ink">
                {{ overallCapabilityScore }}%
              </p>
              <p
                class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
              >
                {{ t.currentReadiness }}
              </p>
            </div>
          </div>

          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.knowledgeFitCopy }}
          </p>

          <div
            v-if="leadingTrack"
            class="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            {{ isThai ? `${leadingTrack.label} นำในโปรไฟล์ของคุณ` : `${leadingTrack.label} leads your profile` }}
            <span class="opacity-60">{{ leadingTrack.average }}%</span>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div
              v-for="track in trackHighlights"
              :key="track.key"
              class="metric-card p-5"
            >
              <div class="flex items-end justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-ink">
                    {{ track.label }}
                  </p>
                  <p class="mt-1 text-xs leading-6 text-ink-soft">
                    {{ track.description }}
                  </p>
                </div>
                <p class="data-value text-2xl font-bold text-accent">
                  {{ track.average }}%
                </p>
              </div>
              <div class="mt-4 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))]"
                  :style="{ width: `${track.average}%` }"
                />
              </div>
              <p
                class="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
              >
                {{ t.strongest }}: {{ track.strongest }}
              </p>
            </div>
          </div>

        </article>

        <article v-if="hasRoleAnswers" class="paper-panel p-6 md:p-8 min-h-[320px]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.personalityFit }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.behavioralAlignment }}
              </h3>
            </div>
            <div class="shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-ink-soft whitespace-nowrap">{{ t.profileCoherence }}</span>
                <span class="data-value text-lg font-bold text-ink">{{ personalityFitRaw.toFixed(2) }}<span class="text-xs font-normal text-ink-soft">/1</span></span>
              </div>
              <div class="mt-1 h-1.5 w-36 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                  :style="{ width: `${(personalityFitRaw / 1) * 100}%` }"
                />
              </div>
            </div>
          </div>

          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.behaviorCopy }}
          </p>

          <p
            class="mt-8 max-w-xl rounded-2xl border border-border-subtle bg-surface-card px-5 py-4 text-sm leading-8 text-ink-soft"
          >
            {{ personalityFitNarrative }}
          </p>

          <div class="mt-8 space-y-4">
            <div v-for="pillar in topPersonalityPillars" :key="pillar.key">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ cleanPillarLabel(pillar.label) }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ formatPillarScore(pillar) }}
                </p>
              </div>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                  :style="{
                    width: `${Math.round(pillar.normalized_score * 100)}%`,
                  }"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
