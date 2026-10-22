<script setup lang="ts">
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import type { RadarDimension } from '~/utils/roadmaps'

const props = defineProps<{
  /** One axis per rated set; unassessed sets are not plotted. */
  dimensions: RadarDimension[]
  targetByDimension?: Record<string, number>
  /** The backend-derived target, or null when this role has no readiness data. */
  targetScore: number | null
  strengths: RadarDimension[]
  gaps: RadarDimension[]
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

/**
 * The target the As-Is profile is compared against. Each axis takes the target
 * derived from the role's own roadmap; with no backend target the polygon
 * closes on the current shape instead of a made-up constant.
 */
const targetPerDimension = computed<RadarDimension[]>(() =>
  props.dimensions.map((d) => ({
    ...d,
    value:
      props.targetByDimension?.[d.key] ??
      (props.targetScore !== null ? props.targetScore / 100 : d.value),
  })),
)

function percent(dimension: RadarDimension): number {
  return Math.round(dimension.value * 100)
}

const dimensionsDesc = computed(() =>
  [...props.dimensions].sort((left, right) => right.value - left.value),
)

function targetFor(dimension: RadarDimension): number | null {
  const target =
    props.targetByDimension?.[dimension.key] ??
    (props.targetScore !== null ? props.targetScore / 100 : null)
  return target === null ? null : Math.round(Math.min(1, target) * 100)
}
</script>

<template>
  <section class="roadmap-section" aria-labelledby="capability-title">
    <h2 id="capability-title" class="roadmap-section__title">
      {{ t.capabilityTitle }}
    </h2>
    <p class="roadmap-section__intro">{{ t.capabilityIntro }}</p>

    <div class="mt-6 grid grid-cols-1 gap-8">
      <div
        class="surface hidden min-w-0 p-4 sm:block md:p-6"
        data-testid="readiness-radar"
      >
        <SkillSpiderChart
          :dimensions="dimensions"
          :target-dimensions="targetPerDimension"
          :is-thai="isThai"
        />
      </div>

      <ul
        v-if="dimensions.length"
        class="surface grid gap-5 p-4 sm:hidden"
        data-testid="readiness-list"
      >
        <li v-for="dimension in dimensionsDesc" :key="dimension.key">
          <div class="flex items-baseline justify-between gap-3">
            <span class="min-w-0 text-sm font-bold text-ink">
              {{ dimension.label }}
            </span>
            <span class="data-value shrink-0 text-sm font-bold text-blueprint">
              {{ percent(dimension) }}%
            </span>
          </div>
          <div class="readiness-meter__track readiness-meter__track--sm">
            <div
              class="readiness-meter__fill"
              :style="{ width: `${percent(dimension)}%` }"
            />
            <span
              v-if="targetFor(dimension) !== null"
              class="readiness-meter__target"
              :style="{ left: `${targetFor(dimension)}%` }"
            />
          </div>
        </li>
      </ul>

      <div class="hidden min-w-0 gap-8 sm:grid sm:grid-cols-2">
        <div v-if="strengths.length" data-testid="strength-cards">
          <h3 class="text-lg font-bold text-ink">{{ t.strengthsTitle }}</h3>
          <ul class="mt-3 grid gap-4">
            <li v-for="dimension in strengths" :key="dimension.key">
              <div class="flex items-baseline justify-between gap-3">
                <span class="min-w-0 font-bold text-ink">
                  {{ dimension.label }}
                </span>
                <span class="data-value shrink-0 font-bold text-blueprint">
                  {{ percent(dimension) }}%
                </span>
              </div>
              <div class="bar mt-2">
                <div
                  class="bar__fill"
                  :style="{ width: `${percent(dimension)}%` }"
                />
              </div>
            </li>
          </ul>
        </div>

        <div v-if="gaps.length" data-testid="gap-areas">
          <h3 class="text-lg font-bold text-ink">{{ t.gapsTitle }}</h3>
          <ul class="mt-3 grid gap-4">
            <li v-for="dimension in gaps" :key="dimension.key">
              <div class="flex items-baseline justify-between gap-3">
                <span class="min-w-0 font-bold text-ink">
                  {{ dimension.label }}
                </span>
                <span class="data-value shrink-0 font-bold text-ink-soft">
                  {{ percent(dimension) }}%
                </span>
              </div>
              <div class="bar mt-2">
                <div
                  class="bar__fill"
                  :style="{ width: `${percent(dimension)}%` }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
