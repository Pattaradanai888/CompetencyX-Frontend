<script setup lang="ts">
import type {
  AssessmentResult,
  RoadmapTopic,
  ResourceLink,
  PillarInsight,
} from '~~/shared/types/assessment'
import type { RadarDimension } from '~/utils/roadmaps'
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { toRef } from 'vue'

const props = defineProps<{
  survey2RoleTitle: string
  blendedDimensions: RadarDimension[]
  topRoadmapTopics: RoadmapTopic[]
  roadmapShTopics: RoadmapTopic[]
  result: AssessmentResult | null
  hasRoleAnswers: boolean
  isThai: boolean
  strongestDimensionCards: any[]
  growthDimensionCards: any[]
  personalityFitScoreDisplay: string
  personalityFitNarrative: string
  topPersonalityPillars: PillarInsight[]
  displayTopics: RoadmapTopic[]
  topicResources: Map<number, ResourceLink[]>
  displayPersonalitySignals: string[]
  trackHighlights: any[]
  overallCapabilityScore: number
  readinessStatus: string
  recalculatedStrengths: RadarDimension[]
  recalculatedGrowthAreas: RadarDimension[]
  isAtTarget: boolean
  capabilityGap: number
}>()

const t = usePageI18n('dashboard', toRef(props, 'isThai'))
const isThai = toRef(props, 'isThai')

function getTopicDifficultyLabel(topic: RoadmapTopic): string {
  const raw = topic.difficulty

  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }

  const num = Number(raw)
  if (!Number.isNaN(num)) {
    if (num <= 3) return isThai.value ? 'พื้นฐาน' : 'Beginner'
    if (num <= 7) return isThai.value ? 'ระดับกลาง' : 'Intermediate'
    return isThai.value ? 'ขั้นสูง' : 'Advanced'
  }

  return isThai.value ? 'ทั่วไป' : 'General'
}

function getTopicTags(topic: RoadmapTopic): string[] {
  const tags: string[] = []
  if (topic.is_gap) tags.push(isThai.value ? 'ช่องว่างทักษะ' : 'Skill Gap')
  if (topic.prerequisites?.length)
    tags.push(isThai.value ? 'มีพื้นฐานที่ต้องรู้' : 'Has Prerequisites')
  return tags
}

function getResourceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    book: isThai.value ? 'หนังสือ' : 'Book',
    video: isThai.value ? 'วิดีโอ' : 'Video',
    article: isThai.value ? 'บทความ' : 'Article',
    course: isThai.value ? 'คอร์สเรียน' : 'Course',
    official: isThai.value ? 'เอกสารทางการ' : 'Official',
    website: isThai.value ? 'เว็บไซต์' : 'Website',
    roadmap: isThai.value ? 'เส้นทางเรียนรู้' : 'Roadmap',
    feed: isThai.value ? 'ฟีดข่าว' : 'Feed',
  }
  return map[type.toLowerCase()] || type
}

function formatPillarScore(pillar: { normalized_score: number }) {
  return `${(pillar.normalized_score * 10).toFixed(1)}/10`
}
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
      {{ survey2RoleTitle }} {{ t.readinessOrganized }}
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
              {{ survey2RoleTitle }}
            </h3>
            <p class="mt-1 text-xs leading-6 text-ink-soft">
              {{ displayPersonalitySignals[0] }}
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
                  <p class="data-value text-2xl font-black text-ink">
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

          <article class="paper-panel p-5 flex flex-col">
            <p class="eyebrow">{{ t.heroMetrics }}</p>
            <div class="mt-4 grid flex-1 gap-2 grid-rows-3">
              <div class="metric-card p-4">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.overallReadiness }}
                </p>
                <p class="mt-1 data-value text-3xl font-black text-ink">
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
                <p class="mt-1 text-xl font-black text-ink">
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
            {{ survey2RoleTitle }}
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
                class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-blueprint"
              >
                {{ t.asIs }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ t.currentCapability }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-black text-ink">
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
                class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent"
              >
                {{ t.toBe }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ survey2RoleTitle }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-black text-accent">
                  {{ TARGET_READINESS_SCORE }}%
                </p>
                <p class="text-[11px] font-semibold text-ink-soft">
                  {{ t.targetReadiness }}
                </p>
              </div>
              <div class="mt-1 h-1.5 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-accent"
                  :style="{ width: `${TARGET_READINESS_SCORE}%` }"
                />
              </div>
              <div
                class="mt-2 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-2"
              >
                <p class="text-[11px] font-bold text-ink-soft">
                  {{ t.gapToTarget }}
                </p>
                <p
                  class="text-sm font-black"
                  :class="isAtTarget ? 'text-green-600' : 'text-ink'"
                >
                  {{
                    isAtTarget
                      ? t.gapClosed
                      : `${capabilityGap} ${t.pointsNeeded}`
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
            <p class="data-value text-lg font-black text-accent">
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
        <article class="paper-panel p-6 md:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.knowledgeFit }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.capabilityAlignment }}
              </h3>
            </div>
            <div class="text-right">
              <p class="data-value text-4xl font-black text-ink">
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

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
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
                <p class="data-value text-2xl font-black text-accent">
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

          <div class="mt-8 space-y-4">
            <div
              v-for="dimension in strongestDimensionCards.slice(0, 3)"
              :key="dimension.key"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ dimension.label }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ dimension.percent }}%
                </p>
              </div>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                  :style="{ width: `${dimension.percent}%` }"
                />
              </div>
            </div>
          </div>
        </article>

        <article v-if="hasRoleAnswers" class="paper-panel p-6 md:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.personalityFit }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.behavioralAlignment }}
              </h3>
            </div>
            <div class="text-right">
              <p class="data-value text-4xl font-black text-ink">
                {{ personalityFitScoreDisplay }}
              </p>
              <p
                class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
              >
                {{ t.profileCoherence }}
              </p>
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
                  {{ pillar.label }}
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

  <section class="mt-10">
    <div
      class="rounded-[2rem] border border-border-subtle bg-surface-elevated/70 p-6 shadow-[0_24px_70px_rgba(74,54,35,0.08)] md:p-8"
    >
      <div class="max-w-3xl">
        <p class="eyebrow">{{ t.section }} 3</p>
        <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
          {{ t.recommendedSequence }}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ t.sequenceCopy }}
        </p>
      </div>
    </div>

    <div class="mt-10 grid gap-5">
      <div
        v-for="(topic, index) in displayTopics"
        :key="topic.id"
        class="relative"
      >
        <div
          v-if="index !== displayTopics.length - 1"
          class="absolute left-5 top-14 hidden h-[calc(100%+1.25rem)] w-px bg-[linear-gradient(180deg,rgba(234,112,31,0.28),rgba(33,122,111,0.14))] md:block"
        />
        <div
          class="absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-accent/20 bg-white text-sm font-black text-accent shadow-[0_10px_24px_rgba(234,112,31,0.16)]"
        >
          {{ index + 1 }}
        </div>

        <article class="paper-panel ml-5 md:ml-14">
          <div class="grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
            <div class="max-w-3xl">
              <div class="flex flex-wrap items-center gap-2">
                <p class="eyebrow">{{ t.step }} {{ index + 1 }}</p>
                <span
                  class="rounded-full border border-accent/16 bg-accent/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-accent"
                >
                  {{ getTopicDifficultyLabel(topic) }}
                </span>
              </div>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ topic.title }}
              </h3>
              <p
                v-if="topic.description"
                class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft"
              >
                {{ topic.description }}
              </p>
            </div>

            <div
              class="flex flex-wrap content-start gap-2 md:max-w-56 md:justify-end"
            >
              <span
                v-for="tag in getTopicTags(topic)"
                :key="tag"
                class="rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div
            v-if="topicResources.get(topic.id)?.length"
            class="border-t border-border-subtle px-6 py-4 md:px-8"
          >
            <p
              class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
            >
              {{ t.resources }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a
                v-for="link in topicResources.get(topic.id)"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/30 hover:text-accent"
              >
                <span
                  class="shrink-0 rounded bg-surface-muted px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                  >{{ getResourceTypeLabel(link.type) }}</span
                >
                <span>{{ link.title }}</span>
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="section-band mt-10 py-12 md:py-16">
    <div class="mx-auto max-w-6xl">
      <div class="max-w-3xl">
        <p class="eyebrow">{{ t.section }} 4</p>
        <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
          {{ t.additionalInsights }}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ t.insightsCopy }}
        </p>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-2">
        <article class="paper-panel p-6">
          <p class="eyebrow">{{ t.strengthDistribution }}</p>
          <h3 class="mt-3 text-2xl font-bold text-ink">
            {{ t.strongestDimensions }}
          </h3>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.strongestDimensionsCopy }}
          </p>
          <div class="mt-6 grid gap-4">
            <div
              v-for="dimension in strongestDimensionCards"
              :key="dimension.key"
              class="metric-card p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ dimension.label }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ dimension.percent }}%
                </p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ dimension.description }}
              </p>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                  :style="{ width: `${dimension.percent}%` }"
                />
              </div>
            </div>
          </div>
        </article>

        <article class="paper-panel p-6">
          <p class="eyebrow">{{ t.developmentPriorities }}</p>
          <h3 class="mt-3 text-2xl font-bold text-ink">
            {{ t.improveNext }}
          </h3>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.improveNextCopy }}
          </p>
          <div class="mt-6 grid gap-4">
            <div
              v-for="dimension in growthDimensionCards"
              :key="dimension.key"
              class="metric-card p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ dimension.label }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ dimension.percent }}%
                </p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ dimension.description }}
              </p>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))]"
                  :style="{ width: `${dimension.percent}%` }"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
