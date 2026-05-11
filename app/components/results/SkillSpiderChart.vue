<script setup lang="ts">
import type { RadarDimension } from '~/utils/roadmaps'

const props = defineProps<{
  dimensions: RadarDimension[]
}>()

const size = 620
const center = size / 2
const maxRadius = 170
const scaleMax = 10
const ringSteps = [0.2, 0.4, 0.6, 0.8, 1]

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value))
}

function formatCapabilityScore(value: number) {
  return Math.round(clampRatio(value) * scaleMax)
}

function toPoint(index: number, ratio: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const radius = maxRadius * ratio

  return {
    angle,
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

function splitLabel(label: string) {
  const words = label.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length > 16 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = nextLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function getTextAnchor(angle: number) {
  const horizontalPosition = Math.cos(angle)

  if (horizontalPosition > 0.35) {
    return 'start'
  }

  if (horizontalPosition < -0.35) {
    return 'end'
  }

  return 'middle'
}

const polygonPoints = computed(() => {
  const total = props.dimensions.length || 1
  return props.dimensions
    .map((item, index) => {
      const point = toPoint(index, clampRatio(item.value), total)
      return `${point.x},${point.y}`
    })
    .join(' ')
})

const axes = computed(() => {
  const total = props.dimensions.length || 1
  return props.dimensions.map((item, index) => {
    const edge = toPoint(index, 1, total)
    const labelAnchor = toPoint(index, 1.18, total)
    const node = toPoint(index, clampRatio(item.value), total)
    const scoreAnchor = toPoint(
      index,
      Math.max(0.16, clampRatio(item.value) - 0.1),
      total,
    )
    return {
      ...item,
      edge,
      labelAnchor,
      labelLines: splitLabel(item.label),
      node,
      scoreAnchor,
      score: formatCapabilityScore(item.value),
      textAnchor: getTextAnchor(labelAnchor.angle),
    }
  })
})
</script>

<template>
  <div class="rounded-[2rem] border border-black/8 bg-white/80 p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
      <p
        class="text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-ink-soft)"
      >
        Capability scale
      </p>
      <p class="text-xs font-semibold text-(--cx-ink)">1 low / 10 high</p>
    </div>
    <div
      class="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border border-black/6 bg-white/70 px-3 py-2"
      aria-hidden="true"
    >
      <span
        v-for="step in ringSteps"
        :key="`scale-chip-${step}`"
        class="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold text-(--cx-accent)"
      >
        {{ Math.round(step * scaleMax) }}
      </span>
    </div>
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      class="h-auto w-full"
      role="img"
      aria-label="Roadmaps PSP and SDLC skill spider chart"
    >
      <g>
        <polygon
          v-for="step in ringSteps"
          :key="step"
          :points="
            axes
              .map(
                (axis, index) =>
                  `${toPoint(index, step, axes.length).x},${toPoint(index, step, axes.length).y}`,
              )
              .join(' ')
          "
          fill="none"
          stroke="rgba(29, 42, 39, 0.14)"
          stroke-width="1"
        />
      </g>

      <g>
        <line
          v-for="axis in axes"
          :key="`axis-${axis.key}`"
          :x1="center"
          :y1="center"
          :x2="axis.edge.x"
          :y2="axis.edge.y"
          stroke="rgba(29, 42, 39, 0.18)"
          stroke-width="1"
        />
      </g>

      <polygon
        :points="polygonPoints"
        fill="rgba(29, 107, 87, 0.26)"
        stroke="rgba(29, 107, 87, 0.92)"
        stroke-width="2"
      />

      <circle
        v-for="axis in axes"
        :key="`node-${axis.key}`"
        :cx="axis.node.x"
        :cy="axis.node.y"
        r="4"
        fill="rgba(29, 107, 87, 1)"
      />

      <g>
        <text
          v-for="axis in axes"
          :key="`score-${axis.key}`"
          :x="axis.scoreAnchor.x"
          :y="axis.scoreAnchor.y"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="11"
          fill="#1d6b57"
          font-weight="800"
        >
          {{ axis.score }}/10
        </text>
      </g>

      <g>
        <text
          v-for="axis in axes"
          :key="`label-${axis.key}`"
          :x="axis.labelAnchor.x"
          :y="axis.labelAnchor.y"
          :text-anchor="axis.textAnchor"
          dominant-baseline="middle"
          font-size="11"
          fill="#1d2a27"
          font-weight="700"
        >
          <tspan
            v-for="(line, lineIndex) in axis.labelLines"
            :key="`${axis.key}-line-${lineIndex}`"
            :x="axis.labelAnchor.x"
            :dy="lineIndex === 0 ? 0 : 13"
          >
            {{ line }}
          </tspan>
        </text>
      </g>
    </svg>
  </div>
</template>
