<script setup lang="ts">
import type { RadarDimension } from '~/utils/roadmaps'

const props = defineProps<{
  dimensions: RadarDimension[]
  targetDimensions?: RadarDimension[]
  isThai?: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai === true)

const viewMode = ref<'as-is' | 'both' | 'to-be'>('both')

const showAsIs = computed(() => viewMode.value !== 'to-be')
const showToBe = computed(
  () => viewMode.value !== 'as-is' && !!props.targetDimensions?.length,
)

const size = 520
const center = size / 2
const maxRadius = 132
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

// A crowded radar has to give its labels more room: fifteen axes leave about
// 24 degrees between neighbours, so the same wide three-line labels that read
// fine on eight axes collide. Narrower lines, smaller type and a wider label
// ring keep them apart.
const isCrowded = computed(() => props.dimensions.length > 10)
const labelRadiusRatio = computed(() => (isCrowded.value ? 1.42 : 1.18))
const labelFontSize = computed(() => (isCrowded.value ? 9 : 11))
const labelLineHeight = computed(() => (isCrowded.value ? 10 : 13))
const maxLabelLineChars = computed(() => (isCrowded.value ? 13 : 16))

// Thai runs carry no spaces and roadmap titles bundle long parenthesised
// phrases, so a token can be far wider than the line budget and shove its
// label into the neighbouring axis. Break such a token after punctuation
// where it has any, and only cut mid-token as the last resort a Thai run
// leaves open -- cutting an English word in half reads worse than a line
// that runs slightly wide.
const TOKEN_BREAK_AFTER = /[-–—/,)]/
const OVERLONG_FACTOR = 1.4

function splitLongToken(word: string, maxChars: number): string[] {
  const tolerated = Math.round(maxChars * OVERLONG_FACTOR)
  if (word.length <= tolerated) {
    return [word]
  }

  const minPiece = Math.ceil(maxChars * 0.6)
  const pieces: string[] = []
  let buffer = ''
  for (const character of word) {
    buffer += character
    if (TOKEN_BREAK_AFTER.test(character) && buffer.length >= minPiece) {
      pieces.push(buffer)
      buffer = ''
    }
  }
  if (buffer) {
    pieces.push(buffer)
  }

  const broken: string[] = []
  for (const piece of pieces) {
    if (piece.length <= tolerated) {
      broken.push(piece)
      continue
    }
    for (let start = 0; start < piece.length; start += maxChars) {
      broken.push(piece.slice(start, start + maxChars))
    }
  }
  return broken
}

function splitLabel(label: string, maxChars: number) {
  const words = label
    .split(' ')
    .flatMap((word) => splitLongToken(word, maxChars))
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length > maxChars && currentLine) {
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

const targetPolygonPoints = computed(() => {
  if (!props.targetDimensions?.length) return ''
  const total = props.targetDimensions.length || 1
  return props.targetDimensions
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
    const labelAnchor = toPoint(index, labelRadiusRatio.value, total)
    const currentValue = clampRatio(item.value)
    const node = toPoint(index, currentValue, total)
    const scoreAnchor = toPoint(
      index,
      Math.max(0.16, currentValue - 0.1),
      total,
    )
    return {
      ...item,
      edge,
      labelAnchor,
      labelLines: splitLabel(item.label, maxLabelLineChars.value),
      node,
      scoreAnchor,
      score: formatCapabilityScore(item.value),
      textAnchor: getTextAnchor(labelAnchor.angle),
    }
  })
})

const targetAxes = computed(() => {
  if (!props.targetDimensions?.length) return []
  const total = props.targetDimensions.length || 1
  return props.targetDimensions.map((item, index) => {
    const targetValue = clampRatio(item.value)
    const node = toPoint(index, targetValue, total)
    const scoreAnchor = toPoint(index, Math.max(0.16, targetValue - 0.1), total)
    return {
      ...item,
      node,
      scoreAnchor,
      score: formatCapabilityScore(item.value),
    }
  })
})

const targetScoreByKey = computed<Record<string, number>>(() => {
  const scores: Record<string, number> = {}
  for (const axis of targetAxes.value) {
    scores[axis.key] = axis.score
  }
  return scores
})

const scoreColor = computed(() =>
  viewMode.value === 'to-be' ? 'var(--color-accent)' : 'var(--color-blueprint)',
)

const hasDimensions = computed(() => props.dimensions.length > 0)

const viewBox = computed(() => {
  // Labels sit outside the outer ring and are anchored outward, so the box
  // carries horizontal padding for the longest one; without it the left and
  // right axis names are cropped at the edge.
  const inset = 20
  const vbSize = size - inset * 2
  const horizontalPad = isCrowded.value ? 104 : 40
  return `${inset - horizontalPad} ${inset} ${vbSize + horizontalPad * 2} ${vbSize}`
})
</script>

<template>
  <div
    class="skill-spider rounded-[1.75rem] border border-border-subtle bg-surface-elevated/95 p-4 shadow-[0_24px_60px_rgba(29,42,39,0.08)] md:p-5"
  >
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
      <p
        class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
      >
        {{ t.capabilityScale }}
      </p>
      <p class="text-xs font-semibold text-ink">{{ t.capabilityScaleRange }}</p>
    </div>
    <div
      class="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border-subtle bg-surface-card px-3 py-2"
      aria-hidden="true"
    >
      <span
        v-for="step in ringSteps"
        :key="`scale-chip-${step}`"
        class="rounded-full bg-accent/12 px-2.5 py-1 text-[0.68rem] font-bold text-accent"
      >
        {{ Math.round(step * scaleMax) }}
      </span>
    </div>

    <div
      v-if="hasDimensions"
      class="overflow-hidden rounded-[1.5rem] border border-border-subtle bg-surface-muted px-3 py-4 md:px-5"
    >
      <div
        class="mx-auto mb-4 flex w-full max-w-[30rem] items-center justify-between gap-3 rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-soft"
      >
        <span>{{ t.liveBlend }}</span>
        <span class="rounded-full bg-accent/14 px-2 py-1 text-accent">
          {{ axes.length }} {{ t.dimensionsCount }}
        </span>
      </div>
      <!--
        The view toggle lives outside the SVG on purpose: inside it, it sat at
        the top of the plot where the topmost axis label lands once the label
        ring widens for a crowded radar.
      -->
      <div
        v-if="props.targetDimensions?.length"
        class="mx-auto mb-3 flex w-fit flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-border-subtle bg-surface-card p-1 text-[0.68rem] font-semibold"
      >
        <button
          class="rounded-xl px-3 py-1.5 transition-colors"
          :class="
            viewMode === 'as-is'
              ? 'bg-accent/12 text-accent'
              : 'text-ink-soft hover:text-ink'
          "
          @click="viewMode = 'as-is'"
        >
          {{ t.asIs }}
        </button>
        <button
          class="rounded-xl px-3 py-1.5 transition-colors"
          :class="
            viewMode === 'both'
              ? 'bg-accent/12 text-accent'
              : 'text-ink-soft hover:text-ink'
          "
          @click="viewMode = 'both'"
        >
          {{ t.viewBoth }}
        </button>
        <button
          class="rounded-xl px-3 py-1.5 transition-colors"
          :class="
            viewMode === 'to-be'
              ? 'bg-accent/12 text-accent'
              : 'text-ink-soft hover:text-ink'
          "
          @click="viewMode = 'to-be'"
        >
          {{ t.toBe }}
        </button>
      </div>
      <svg
        :viewBox="viewBox"
        class="mx-auto h-auto w-full max-w-[36rem] md:max-w-[38rem]"
        role="img"
        :aria-label="t.capabilityMap"
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
            stroke="var(--chart-grid)"
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
            stroke="var(--chart-axis)"
            stroke-width="1"
          />
        </g>

        <polygon
          v-if="showAsIs"
          :points="polygonPoints"
          fill="var(--chart-fill)"
          stroke="var(--color-blueprint)"
          stroke-width="2"
        />

        <polygon
          v-if="showToBe"
          :points="targetPolygonPoints"
          fill="none"
          stroke="var(--color-accent)"
          stroke-width="2"
          stroke-dasharray="5,4"
          opacity="0.7"
        />

        <template v-if="showAsIs">
          <circle
            v-for="axis in axes"
            :key="`node-${axis.key}`"
            :cx="axis.node.x"
            :cy="axis.node.y"
            r="4"
            fill="var(--color-blueprint)"
          />
        </template>

        <template v-if="showToBe">
          <circle
            v-for="(_, index) in props.targetDimensions"
            :key="`target-node-${index}`"
            :cx="
              toPoint(
                index,
                clampRatio(props.targetDimensions[index].value),
                props.targetDimensions.length,
              ).x
            "
            :cy="
              toPoint(
                index,
                clampRatio(props.targetDimensions[index].value),
                props.targetDimensions.length,
              ).y
            "
            r="3"
            fill="none"
            stroke="var(--color-accent)"
            stroke-width="2"
            opacity="0.7"
          />
        </template>

        <!--
          On a crowded radar the per-vertex scores land on top of each other and
          on the plot itself, so they move into the label ring instead, where
          the axis names are already spaced apart. Nothing is dropped: each axis
          still shows its own number, just in one place per axis.
        -->
        <g v-if="!isCrowded">
          <text
            v-for="axis in viewMode === 'to-be' ? targetAxes : axes"
            :key="`score-${axis.key}`"
            :x="axis.scoreAnchor.x"
            :y="axis.scoreAnchor.y"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="11"
            :fill="scoreColor"
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
            :font-size="labelFontSize"
            fill="var(--chart-label)"
            font-weight="700"
          >
            <tspan
              v-for="(line, lineIndex) in axis.labelLines"
              :key="`${axis.key}-line-${lineIndex}`"
              :x="axis.labelAnchor.x"
              :dy="
                lineIndex === 0
                  ? (-(axis.labelLines.length - (isCrowded ? 0 : 1)) *
                      labelLineHeight) /
                    2
                  : labelLineHeight
              "
            >
              {{ line }}
            </tspan>
            <tspan
              v-if="isCrowded"
              :x="axis.labelAnchor.x"
              :dy="labelLineHeight"
              :fill="scoreColor"
              font-weight="800"
            >
              {{
                (viewMode === 'to-be'
                  ? targetScoreByKey[axis.key]
                  : axis.score) ?? axis.score
              }}/10
            </tspan>
          </text>
        </g>
      </svg>
    </div>
    <p
      v-else
      class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
    >
      {{ t.chartUnavailable }}
    </p>
  </div>
</template>

<style scoped>
.skill-spider {
  --chart-grid: rgba(47, 38, 31, 0.2);
  --chart-axis: rgba(47, 38, 31, 0.18);
  --chart-fill: rgba(29, 107, 87, 0.26);
  --chart-label: var(--color-ink);
}
</style>
