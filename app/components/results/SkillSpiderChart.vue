<script setup lang="ts">
import type { RadarDimension } from '~/utils/survey2'

const props = defineProps<{
  dimensions: RadarDimension[]
}>()

const size = 440
const center = size / 2
const maxRadius = 160
const ringSteps = [0.2, 0.4, 0.6, 0.8, 1]

function toPoint(index: number, ratio: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const radius = maxRadius * ratio

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

const polygonPoints = computed(() => {
  const total = props.dimensions.length || 1
  return props.dimensions
    .map((item, index) => {
      const point = toPoint(index, item.value, total)
      return `${point.x},${point.y}`
    })
    .join(' ')
})

const axes = computed(() => {
  const total = props.dimensions.length || 1
  return props.dimensions.map((item, index) => {
    const edge = toPoint(index, 1, total)
    const labelAnchor = toPoint(index, 1.12, total)
    return { ...item, edge, labelAnchor }
  })
})
</script>

<template>
  <div class="rounded-[2rem] border border-black/8 bg-white/80 p-4">
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      class="h-auto w-full"
      role="img"
      aria-label="Survey 2 PSP and SDLC skill spider chart"
    >
      <g>
        <polygon
          v-for="step in ringSteps"
          :key="step"
          :points="axes.map((axis, index) => `${toPoint(index, step, axes.length).x},${toPoint(index, step, axes.length).y}`).join(' ')"
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
        v-for="(axis, index) in axes"
        :key="`node-${axis.key}`"
        :cx="toPoint(index, axis.value, axes.length).x"
        :cy="toPoint(index, axis.value, axes.length).y"
        r="4"
        fill="rgba(29, 107, 87, 1)"
      />

      <g>
        <text
          v-for="axis in axes"
          :key="`label-${axis.key}`"
          :x="axis.labelAnchor.x"
          :y="axis.labelAnchor.y"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="12"
          fill="#1d2a27"
          font-weight="600"
        >
          {{ axis.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
