<script setup lang="ts">
import type { RadarDimension } from '~/utils/roadmaps'

const props = defineProps<{
  dimensions: RadarDimension[]
  targetDimensions?: RadarDimension[]
  isThai?: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai === true)

const RADAR_VIEW_PARAM = 'radar-view'
type RadarViewMode = 'as-is' | 'both' | 'to-be'

function isRadarViewMode(value: unknown): value is RadarViewMode {
  return value === 'as-is' || value === 'both' || value === 'to-be'
}

const route = useRoute()
const router = useRouter()

// The chosen view is shareable: it starts from the query string and writes
// itself back, so a link reopens the radar exactly as it was read.
const viewMode = ref<RadarViewMode>(
  isRadarViewMode(route.query[RADAR_VIEW_PARAM])
    ? (route.query[RADAR_VIEW_PARAM] as RadarViewMode)
    : 'both',
)

watch(viewMode, (mode) => {
  router.replace({ query: { ...route.query, [RADAR_VIEW_PARAM]: mode } })
})

const showAsIs = computed(() => viewMode.value !== 'to-be')
const showToBe = computed(
  () => viewMode.value !== 'as-is' && !!props.targetDimensions?.length,
)

const size = 520
const center = size / 2
const maxRadius = 132
const ringSteps = [0.2, 0.4, 0.6, 0.8, 1]

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value))
}

function formatCapabilityScore(value: number) {
  return Math.round(clampRatio(value) * 100)
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
const labelFontSize = computed(() => (isCrowded.value ? 10 : 12))
const labelLineHeight = computed(() => (isCrowded.value ? 11.5 : 14))
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
  <div class="skill-spider">
    <div v-if="hasDimensions">
      <!--
        The view toggle lives outside the SVG on purpose: inside it, it sat at
        the top of the plot where the topmost axis label lands once the label
        ring widens for a crowded radar.
      -->
      <div
        v-if="props.targetDimensions?.length"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <div class="segmented" role="group" :aria-label="t.capabilityMap">
          <button
            type="button"
            :aria-pressed="viewMode === 'as-is'"
            @click="viewMode = 'as-is'"
          >
            {{ t.asIs }}
          </button>
          <button
            type="button"
            :aria-pressed="viewMode === 'both'"
            @click="viewMode = 'both'"
          >
            {{ t.viewBoth }}
          </button>
          <button
            type="button"
            :aria-pressed="viewMode === 'to-be'"
            @click="viewMode = 'to-be'"
          >
            {{ t.toBe }}
          </button>
        </div>
        <ul class="flex flex-wrap gap-4 text-sm font-bold text-ink-soft">
          <li class="flex items-center gap-2">
            <span
              class="inline-block h-1 w-5 rounded-full bg-blueprint"
              aria-hidden="true"
            />
            {{ t.asIs }}
          </li>
          <li class="flex items-center gap-2">
            <span
              class="inline-block w-5 border-t-[3px] border-dashed border-accent"
              aria-hidden="true"
            />
            {{ t.toBe }}
          </li>
        </ul>
      </div>
      <svg
        :viewBox="viewBox"
        class="mx-auto mt-2 h-auto w-full max-w-[46rem]"
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
            v-for="(target, index) in props.targetDimensions ?? []"
            :key="`target-node-${index}`"
            :cx="
              toPoint(
                index,
                clampRatio(target.value),
                (props.targetDimensions ?? []).length,
              ).x
            "
            :cy="
              toPoint(
                index,
                clampRatio(target.value),
                (props.targetDimensions ?? []).length,
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
            {{ axis.score }}%
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
              }}%
            </tspan>
          </text>
        </g>
      </svg>
    </div>
    <p v-else class="p-2 text-sm leading-6 text-ink-soft">
      {{ t.chartUnavailable }}
    </p>
  </div>
</template>

<style scoped>
.skill-spider {
  --chart-grid: var(--color-border-strong);
  --chart-axis: var(--color-border-subtle);
  --chart-fill: color-mix(in srgb, var(--color-blueprint) 22%, transparent);
  --chart-label: var(--color-ink);
}
</style>
