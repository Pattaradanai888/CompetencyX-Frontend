<script setup lang="ts">
import { cleanPillarLabel } from '~/utils/roadmaps'
import { getPillarLabel } from '~/utils/assessment'
import type { PillarInsight } from '~~/shared/types/assessment'

const props = defineProps<{
  topPillars: PillarInsight[]
  summary: string
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

/** Pillar scores are shares of one profile, so each bar is read against the strongest. */
const strongestScore = computed(() =>
  Math.max(0, ...props.topPillars.map((pillar) => pillar.normalized_score)),
)

function relativeWidth(pillar: PillarInsight): string {
  if (!strongestScore.value) return '0%'
  return `${Math.round((pillar.normalized_score / strongestScore.value) * 100)}%`
}
</script>

<template>
  <section class="roadmap-section" aria-labelledby="work-style-title">
    <h2 id="work-style-title" class="roadmap-section__title">
      {{ t.workStyleTitle }}
    </h2>
    <p class="roadmap-section__intro">{{ summary }}</p>

    <ul class="mt-6 grid max-w-xl gap-4" data-testid="work-style-pillars">
      <li v-for="pillar in topPillars" :key="pillar.key">
        <p class="font-bold text-ink">
          {{ cleanPillarLabel(getPillarLabel(pillar, isThai)) }}
        </p>
        <div class="bar mt-2">
          <div
            class="bar__fill bar__fill--accent"
            :style="{ width: relativeWidth(pillar) }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
