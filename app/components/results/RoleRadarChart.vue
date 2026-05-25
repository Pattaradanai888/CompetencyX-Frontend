<script setup lang="ts">
import type { PillarInsight } from '~/shared/types/assessment'

const props = defineProps<{
  pillars: PillarInsight[]
}>()

const size = 360
const center = size / 2
const radius = 104
const rings = [0.25, 0.5, 0.75, 1]

function clamp(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function point(index: number, ratio: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: center + Math.cos(angle) * radius * ratio,
    y: center + Math.sin(angle) * radius * ratio,
  }
}

function labelLines(label: string) {
  const words = label.split(' ')
  if (words.length <= 2) return [label]
  return [words.slice(0, 2).join(' '), words.slice(2).join(' ')]
}

const chartPillars = computed(() => props.pillars.slice(0, 6))

const polygon = computed(() => {
  const total = chartPillars.value.length || 1
  return chartPillars.value
    .map((pillar, index) => {
      const next = point(index, clamp(pillar.normalized_score), total)
      return `${next.x},${next.y}`
    })
    .join(' ')
})
</script>

<template>
  <div class="metric-card p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="eyebrow">Personality radar</p>
      <p class="text-xs font-bold text-ink-soft">
        {{ chartPillars.length }} signals
      </p>
    </div>

    <svg
      v-if="chartPillars.length"
      :viewBox="`0 0 ${size} ${size}`"
      class="mx-auto mt-4 h-auto w-full max-w-[23rem]"
      role="img"
      aria-label="Role fit radar chart"
    >
      <polygon
        v-for="ring in rings"
        :key="ring"
        :points="
          chartPillars
            .map((_, index) => {
              const next = point(index, ring, chartPillars.length)
              return `${next.x},${next.y}`
            })
            .join(' ')
        "
        fill="none"
        stroke="rgba(82,97,113,0.22)"
        stroke-width="1"
      />
      <line
        v-for="(_, index) in chartPillars"
        :key="`axis-${index}`"
        :x1="center"
        :y1="center"
        :x2="point(index, 1, chartPillars.length).x"
        :y2="point(index, 1, chartPillars.length).y"
        stroke="rgba(82,97,113,0.18)"
        stroke-width="1"
      />
      <polygon
        :points="polygon"
        fill="rgba(49,87,213,0.2)"
        stroke="var(--color-blueprint)"
        stroke-width="2"
      />
      <circle
        v-for="(pillar, index) in chartPillars"
        :key="pillar.key"
        :cx="
          point(index, clamp(pillar.normalized_score), chartPillars.length).x
        "
        :cy="
          point(index, clamp(pillar.normalized_score), chartPillars.length).y
        "
        r="4"
        fill="var(--color-blueprint)"
      />
      <text
        v-for="(pillar, index) in chartPillars"
        :key="`${pillar.key}-label`"
        :x="point(index, 1.27, chartPillars.length).x"
        :y="point(index, 1.27, chartPillars.length).y"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="10"
        font-weight="800"
        fill="var(--color-ink)"
      >
        <tspan
          v-for="(line, lineIndex) in labelLines(pillar.label)"
          :key="line"
          :x="point(index, 1.27, chartPillars.length).x"
          :dy="lineIndex === 0 ? 0 : 12"
        >
          {{ line }}
        </tspan>
      </text>
    </svg>

    <p v-else class="mt-4 text-sm leading-6 text-ink-soft">
      Radar data will appear after the role discovery phase is complete.
    </p>
  </div>
</template>
