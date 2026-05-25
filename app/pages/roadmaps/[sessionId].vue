<script setup lang="ts">
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { buildRoadmapsEvaluation } from '~/utils/roadmaps'
import type { RadarDimension } from '~/utils/roadmaps'
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  RoadmapsCatalogQuestion,
} from '~/shared/types/assessment'

const route = useRoute('/roadmaps/[sessionId]')
const {
  getResults,
  getHistory,
  getRoadmapsCatalog,
  getRoadmapsState,
  saveRoadmapsState,
} = useAssessmentResults()
const toast = useToast()

const { data: _roadmapsData } = await useAsyncData(
  `roadmaps-${route.params.sessionId}`,
  async () => {
    const [result, history, roadmapsCatalog, roadmapsState] = await Promise.all(
      [
        getResults(route.params.sessionId),
        getHistory(route.params.sessionId).catch(() => null),
        getRoadmapsCatalog(route.params.sessionId),
        getRoadmapsState(route.params.sessionId).catch(() => ({
          completed: false,
          answers: {},
          completed_at: null,
        })),
      ],
    )
    return { result, history, roadmapsCatalog, roadmapsState }
  },
)

const result = _roadmapsData.value!.result
const history = _roadmapsData.value!.history
const roadmapsCatalog = _roadmapsData.value!.roadmapsCatalog
const roadmapsState = _roadmapsData.value!.roadmapsState

const evaluation = computed(() => buildRoadmapsEvaluation(result, history))

const topRoadmapTopics = computed(() =>
  result.preferred_role_gap_topics.slice(0, 6),
)

const isRoadmapsComplete = ref(roadmapsState.completed)

type RoadmapQuestion = {
  id: string
  prompt: string
  dimensionKey: string
}

const roadmapQuestions: RoadmapQuestion[] = roadmapsCatalog.questions.map(
  (question: RoadmapsCatalogQuestion) => ({
    id: question.id,
    prompt: question.prompt,
    dimensionKey: question.dimension_key,
  }),
)

const answerScale = roadmapsCatalog.scale
const answerScaleValues = answerScale.map((option) => option.value)
const answerScaleMin = answerScaleValues.length
  ? Math.min(...answerScaleValues)
  : 1
const answerScaleMax = answerScaleValues.length
  ? Math.max(...answerScaleValues)
  : 5

const roadmapAnswers = ref<Record<string, number>>({ ...roadmapsState.answers })
const currentQuestionIndex = ref(0)
const isSavingRoadmaps = ref(false)

const hasAnsweredAll = computed(() => {
  return roadmapQuestions.every((question) =>
    Number.isFinite(roadmapAnswers.value[question.id]),
  )
})

const activeQuestion = computed(
  () => roadmapQuestions[currentQuestionIndex.value] ?? null,
)
const activeQuestionAnswer = computed(() => {
  if (!activeQuestion.value) {
    return null
  }

  return roadmapAnswers.value[activeQuestion.value.id] ?? null
})

function normalizeRoadmapsAnswer(raw: number): number {
  if (answerScaleMax === answerScaleMin) {
    return 1
  }

  const ratio = (raw - answerScaleMin) / (answerScaleMax - answerScaleMin)
  const scoreOutOfTen = 1 + clamp(ratio) * 9
  return scoreOutOfTen / 10
}

function getQuestionInfluence(question: RoadmapQuestion): number | null {
  const raw = roadmapAnswers.value[question.id]
  if (!Number.isFinite(raw)) {
    return null
  }

  return normalizeRoadmapsAnswer(raw)
}

const catalogByKey = computed(
  () =>
    new Map(
      roadmapsCatalog.dimensions.map((item: { key: string }) => [
        item.key,
        item,
      ]),
    ),
)

const blendedDimensions = computed<RadarDimension[]>(() => {
  const baseByKey = new Map(
    evaluation.value.dimensions.map((item) => [item.key, item]),
  )

  return evaluation.value.dimensions.map((dimension) => {
    const matchingQuestions = roadmapQuestions.filter(
      (question) => question.dimensionKey === dimension.key,
    )
    const influences = matchingQuestions
      .map((question) => getQuestionInfluence(question))
      .filter((score): score is number => score !== null)
    const questionScore = influences.length
      ? influences.reduce((sum, value) => sum + value, 0) / influences.length
      : dimension.value

    const capabilityValue = clamp(questionScore)
    const base = baseByKey.get(dimension.key) ?? dimension
    const catalogDimension = catalogByKey.value.get(dimension.key)

    return {
      ...base,
      label: catalogDimension?.label ?? base.label,
      track: catalogDimension?.track ?? base.track,
      value: capabilityValue,
    }
  })
})

const hasRoadmapChartData = computed(() => blendedDimensions.value.length > 0)

const sortedDimensionsDesc = computed(() =>
  [...blendedDimensions.value].sort((left, right) => right.value - left.value),
)

const recalculatedStrengths = computed(() =>
  sortedDimensionsDesc.value.slice(0, 3).map((item) => item.label),
)

const recalculatedGrowthAreas = computed(() =>
  [...sortedDimensionsDesc.value]
    .reverse()
    .slice(0, 3)
    .map((item) => item.label),
)

const recommendedActions = computed(() =>
  sortedDimensionsDesc.value.slice(-4).map((dimension) => ({
    dimension: dimension.label,
    action:
      catalogByKey.value.get(dimension.key)?.low_score_action ??
      'Practice this area while completing your next roadmap topic.',
  })),
)

const overallCapabilityScore = computed(() => {
  if (!blendedDimensions.value.length) return 0
  const total = blendedDimensions.value.reduce(
    (sum, dimension) => sum + dimension.value,
    0,
  )
  return Math.round((total / blendedDimensions.value.length) * 100)
})

const roadmapsProgressPercent = computed(() => {
  if (!roadmapQuestions.length) return 0
  if (isRoadmapsComplete.value) return 100
  return Math.round(
    (Object.keys(roadmapAnswers.value).length / roadmapQuestions.length) * 100,
  )
})

const readinessStatus = computed(() => {
  if (overallCapabilityScore.value >= 78) return 'Role ready'
  if (overallCapabilityScore.value >= 58) return 'Project ready'
  return 'Foundation building'
})

const suggestedTechnologies = computed(() => {
  const roleName = result.best_fit_role?.name?.toLowerCase() ?? ''
  if (roleName.includes('frontend')) {
    return ['HTML/CSS systems', 'JavaScript', 'Vue or React', 'Accessibility']
  }
  if (roleName.includes('backend')) {
    return ['REST APIs', 'SQL', 'Authentication', 'System design basics']
  }
  if (roleName.includes('data')) {
    return ['Python', 'SQL', 'Pipelines', 'Visualization']
  }
  if (roleName.includes('devops')) {
    return ['Linux', 'Docker', 'CI/CD', 'Cloud fundamentals']
  }
  return [
    'Git workflow',
    'Testing basics',
    'Architecture fundamentals',
    'Portfolio delivery',
  ]
})

const suggestedProjects = computed(() =>
  topRoadmapTopics.value.slice(0, 3).map((topic, index) => ({
    title: `${result.best_fit_role?.name ?? 'Software'} project ${index + 1}`,
    copy:
      topic.description ||
      `Build a focused project that demonstrates ${topic.title.toLowerCase()}.`,
  })),
)

const recommendedResources = [
  'Official documentation for each suggested technology',
  'Small portfolio project with README, screenshots, and tests',
  'Peer review from a mentor, teacher, or student developer community',
]

async function submitRoadmaps() {
  if (!hasAnsweredAll.value) {
    return
  }

  isSavingRoadmaps.value = true

  try {
    const saved = await saveRoadmapsState(route.params.sessionId, {
      completed: true,
      answers: { ...roadmapAnswers.value },
      completed_at: new Date().toISOString(),
    })

    roadmapAnswers.value = { ...saved.answers }
    isRoadmapsComplete.value = saved.completed
  } catch (error) {
    toast.add({
      title: 'Could not save Roadmaps',
      description: getErrorMessage(error as ApiError),
      color: 'error',
    })
  } finally {
    isSavingRoadmaps.value = false
  }
}

function selectAnswer(value: number) {
  if (!activeQuestion.value) {
    return
  }

  roadmapAnswers.value[activeQuestion.value.id] = value
}

function goToPreviousQuestion() {
  if (currentQuestionIndex.value <= 0) {
    return
  }

  currentQuestionIndex.value -= 1
}

function goToNextQuestion() {
  if (
    !activeQuestion.value ||
    !Number.isFinite(activeQuestionAnswer.value ?? NaN)
  ) {
    return
  }

  if (currentQuestionIndex.value < roadmapQuestions.length - 1) {
    currentQuestionIndex.value += 1
    return
  }

  void submitRoadmaps()
}

onMounted(() => {
  if (!roadmapsState.completed) {
    const firstUnanswered = roadmapQuestions.findIndex(
      (question) => !Number.isFinite(roadmapsState.answers[question.id]),
    )
    currentQuestionIndex.value =
      firstUnanswered === -1 ? roadmapQuestions.length - 1 : firstUnanswered
  }
})

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportRoadmapReport() {
  const exportDimensions = isRoadmapsComplete.value
    ? blendedDimensions.value
    : evaluation.value.dimensions
  const exportStrengths = isRoadmapsComplete.value
    ? recalculatedStrengths.value
    : evaluation.value.strengths
  const exportGrowthAreas = isRoadmapsComplete.value
    ? recalculatedGrowthAreas.value
    : evaluation.value.growthAreas

  const lines = [
    'CompetencyX Roadmaps - PSP + SDLC Roadmap',
    `Session: ${route.params.sessionId}`,
    `Best fit role: ${result.best_fit_role?.name ?? 'N/A'}`,
    '',
    'Strengths:',
    ...exportStrengths.map((item) => `- ${item}`),
    '',
    'Growth Areas:',
    ...exportGrowthAreas.map((item) => `- ${item}`),
    '',
    'Personality Signals:',
    ...evaluation.value.personalitySignals.map((item) => `- ${item}`),
    '',
    'Role Guidance:',
    ...roadmapsCatalog.role_guidance.map((item) => `- ${item}`),
    '',
    'Recommended Actions:',
    ...recommendedActions.value.map(
      (item) => `- ${item.dimension}: ${item.action}`,
    ),
    '',
    'Dimension Scores:',
    ...exportDimensions.map(
      (item) => `- ${item.label}: ${Math.round(item.value * 10)}/10`,
    ),
  ]

  downloadFile(
    `roadmaps-report-${route.params.sessionId}.txt`,
    lines.join('\n'),
    'text/plain;charset=utf-8',
  )
}

function exportSpiderChartSvg() {
  const svgElement = document.querySelector('#roadmaps-spider-chart svg')

  if (!svgElement) {
    return
  }

  const svgMarkup = new XMLSerializer().serializeToString(svgElement)
  downloadFile(
    `roadmaps-spider-${route.params.sessionId}.svg`,
    svgMarkup,
    'image/svg+xml;charset=utf-8',
  )
}

useSeoMeta({
  title: 'CompetencyX | Roadmaps',
  description:
    'PSP and SDLC capability analysis with a personalized roadmap based on Survey 1 answers.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        :to="`/results/${route.params.sessionId}`"
        class="editorial-link text-sm"
      >
        Back to Survey 1 results
      </NuxtLink>
      <p class="text-sm text-ink-soft">Session {{ route.params.sessionId }}</p>
    </div>

    <section class="glass-panel mt-6 p-6 md:p-8">
      <p class="eyebrow">
        {{
          isRoadmapsComplete ? 'Final result dashboard' : 'Phase 2 assessment'
        }}
      </p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{
          isRoadmapsComplete
            ? `${result.best_fit_role?.name ?? 'Software role'} readiness roadmap`
            : 'Calibrate the skills behind your recommended role'
        }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
        {{
          isRoadmapsComplete
            ? 'This profile blends your role discovery result with the Phase 2 skill assessment to map your current level, strongest signals, priority gaps, and next portfolio moves.'
            : 'Answer a short set of role-aware skill prompts. The full chart, roadmap, and recommendations stay hidden until this step is complete.'
        }}
      </p>
      <div v-if="isRoadmapsComplete" class="mt-6 grid gap-3 md:grid-cols-3">
        <div class="metric-card p-4">
          <p class="eyebrow">Overall score</p>
          <p class="mt-3 data-value text-4xl font-black text-ink">
            {{ overallCapabilityScore }}%
          </p>
        </div>
        <div class="metric-card p-4">
          <p class="eyebrow">Readiness status</p>
          <p class="mt-3 text-2xl font-black text-ink">
            {{ readinessStatus }}
          </p>
        </div>
        <div class="metric-card p-4">
          <p class="eyebrow">Best-fit role</p>
          <p class="mt-3 text-2xl font-black text-ink">
            {{ result.best_fit_role?.name ?? 'Still calibrating' }}
          </p>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          v-if="isRoadmapsComplete"
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
          @click="exportRoadmapReport"
        >
          Download roadmap report
        </button>
        <button
          v-if="isRoadmapsComplete"
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
          @click="exportSpiderChartSvg"
        >
          Download spider chart
        </button>
      </div>
    </section>

    <section
      v-if="!isRoadmapsComplete"
      class="glass-panel mt-8 p-6 md:p-8"
      aria-live="polite"
    >
      <div class="flex flex-wrap items-center gap-3">
        <span class="eyebrow">Skill assessment</span>
        <span
          class="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-soft"
        >
          Question {{ currentQuestionIndex + 1 }} of
          {{ roadmapQuestions.length }}
        </span>
      </div>

      <div
        class="mt-5 rounded-lg border border-border-subtle bg-surface-muted p-5 md:p-6"
      >
        <p
          class="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
        >
          Rate concrete execution behaviors to generate your Roadmaps profile.
        </p>
        <h2 class="font-display text-3xl leading-tight text-ink md:text-5xl">
          Answer before viewing your roadmap
        </h2>
        <p class="mt-4 text-sm text-ink-soft">
          Keep this practical: answer based on what you can do today without
          outside help.
        </p>
        <div
          class="mt-5 h-2 overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-label="Phase 2 progress"
          :aria-valuenow="roadmapsProgressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))] transition-all duration-500"
            :style="{ width: `${roadmapsProgressPercent}%` }"
          />
        </div>
      </div>

      <div v-if="activeQuestion" class="mt-8">
        <div
          class="rounded-md border border-border-subtle bg-surface-card p-4 md:p-5"
        >
          <p
            class="text-base font-semibold leading-7 text-ink md:text-[1.05rem]"
          >
            {{ activeQuestion.prompt }}
          </p>
          <div class="mt-3 grid gap-2 sm:grid-cols-5">
            <button
              v-for="option in answerScale"
              :key="`${activeQuestion.id}-${option.value}`"
              type="button"
              class="answer-option answer-option--scale rounded-md px-3 py-3 text-xs font-semibold uppercase tracking-[0.04em] transition"
              :class="
                activeQuestionAnswer === option.value
                  ? 'is-selected text-accent'
                  : 'text-ink-soft'
              "
              @click="selectAnswer(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5"
      >
        <p class="status-copy">
          {{
            hasAnsweredAll
              ? 'All prompts answered. Ready to evaluate.'
              : 'Complete every prompt to unlock results.'
          }}
        </p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="currentQuestionIndex === 0"
            @click="goToPreviousQuestion"
          >
            Previous
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-shadow transition hover:-translate-y-0.5 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="
              !Number.isFinite(activeQuestionAnswer ?? NaN) || isSavingRoadmaps
            "
            @click="goToNextQuestion"
          >
            {{
              currentQuestionIndex === roadmapQuestions.length - 1
                ? isSavingRoadmaps
                  ? 'Saving...'
                  : 'Show roadmap results'
                : 'Next question'
            }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">Spider chart</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">Current capability map</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-ink-soft">
        This chart starts from your Survey 1 profile and updates as you answer
        Survey 2.
      </p>
      <div id="roadmaps-spider-chart" class="mt-6 mx-auto max-w-4xl">
        <SkillSpiderChart
          v-if="hasRoadmapChartData"
          :dimensions="blendedDimensions"
        />
        <p
          v-else
          class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
        >
          Roadmap chart data is not available for this session yet.
        </p>
      </div>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">Profile read</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">
        Knowledge + personality fit
      </h2>

      <div class="mt-6 space-y-3">
        <p
          v-for="signal in evaluation.personalitySignals"
          :key="signal"
          class="rounded-md border border-border-subtle bg-surface-card p-4 text-sm leading-6 text-ink-soft"
        >
          {{ signal }}
        </p>
      </div>

      <div class="mt-6 space-y-3">
        <p
          v-for="guidance in roadmapsCatalog.role_guidance"
          :key="guidance"
          class="rounded-md border border-border-subtle bg-accent/10 p-4 text-sm leading-6 text-ink"
        >
          {{ guidance }}
        </p>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div class="rounded-md border border-border-subtle bg-surface-card p-4">
          <p class="eyebrow">Strongest now</p>
          <ul class="mt-3 space-y-2 text-sm text-ink">
            <li v-for="strength in recalculatedStrengths" :key="strength">
              {{ strength }}
            </li>
          </ul>
        </div>
        <div class="rounded-md border border-border-subtle bg-surface-card p-4">
          <p class="eyebrow">Develop next</p>
          <ul class="mt-3 space-y-2 text-sm text-ink">
            <li v-for="gap in recalculatedGrowthAreas" :key="gap">
              {{ gap }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">PSP + SDLC actions</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">
        Recommended execution steps
      </h2>
      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <div
          v-for="item in recommendedActions"
          :key="item.dimension"
          class="rounded-md border border-border-subtle bg-surface-card p-4"
        >
          <p class="eyebrow">
            {{ item.dimension }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{ item.action }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 grid gap-6 lg:grid-cols-3">
      <section class="paper-panel p-6 md:p-8">
        <p class="eyebrow">Technologies</p>
        <h2 class="mt-4 text-3xl font-bold text-ink">Learn next</h2>
        <div class="mt-6 flex flex-wrap gap-2">
          <span
            v-for="technology in suggestedTechnologies"
            :key="technology"
            class="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 text-sm font-bold text-ink"
          >
            {{ technology }}
          </span>
        </div>
      </section>

      <section class="paper-panel p-6 md:p-8 lg:col-span-2">
        <p class="eyebrow">Suggested projects</p>
        <h2 class="mt-4 text-3xl font-bold text-ink">Build for evidence</h2>
        <div class="mt-6 grid gap-3 md:grid-cols-3">
          <div
            v-for="project in suggestedProjects"
            :key="project.title"
            class="metric-card p-4"
          >
            <p class="text-sm font-bold text-ink">{{ project.title }}</p>
            <p class="mt-2 text-sm leading-6 text-ink-soft">
              {{ project.copy }}
            </p>
          </div>
        </div>
      </section>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">Roadmap actions</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">
        Recommended learning sequence
      </h2>
      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <div
          v-for="(topic, index) in topRoadmapTopics"
          :key="topic.id"
          class="rounded-md border border-border-subtle bg-surface-card p-4"
        >
          <p class="eyebrow">Phase {{ index + 1 }}</p>
          <p class="mt-2 text-sm font-semibold text-ink">
            {{ topic.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{
              topic.description ||
              'This topic is prioritized from your preferred-role gap profile.'
            }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="isRoadmapsComplete" class="mt-8 paper-panel p-6 md:p-8">
      <p class="eyebrow">Recommended resources</p>
      <h2 class="mt-4 text-3xl font-bold text-ink">
        Keep the improvement plan practical
      </h2>
      <div class="mt-6 grid gap-3 md:grid-cols-3">
        <div
          v-for="resource in recommendedResources"
          :key="resource"
          class="flow-node p-4 pl-5"
        >
          <p class="text-sm font-semibold leading-6 text-ink">
            {{ resource }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
