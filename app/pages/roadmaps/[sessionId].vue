<script setup lang="ts">
import { motion } from 'motion-v'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import {
  sortMasteryDescending,
  sortTopicsByDisplayOrder,
} from '~/utils/assessment'
import { buildRoadmapsEvaluation } from '~/utils/roadmaps'
import type { RadarDimension } from '~/utils/roadmaps'
import MasteryMeter from '~/components/results/MasteryMeter.vue'
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  AssessmentSession,
  PillarInsight,
  RoadmapTopic,
  RoadmapsCatalogQuestion,
} from '~/shared/types/assessment'

const route = useRoute('/roadmaps/[sessionId]')
const {
  getResults,
  getHistory,
  getRoadmapsCatalog,
  getRoadmapsNextQuestion,
  getRoadmapsState,
  saveRoadmapsState,
} = useAssessmentResults()
const toast = useToast()
const { getSession } = useAssessmentSession()
const prefersReduced = useReducedMotion()
const isGuidanceExpanded = ref(false)
const AUTO_ADVANCE_DELAY_MS = 220
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

const { data: _roadmapsData } = await useAsyncData(
  `roadmaps-${route.params.sessionId}`,
  async () => {
    const session = await getSession(route.params.sessionId).catch(
      () => null as AssessmentSession | null,
    )

    const assessmentResult = await getResults(route.params.sessionId).catch(
      (error) => {
        if ((error as ApiError).statusCode === 409) {
          return null
        }
        throw error
      },
    )

    const [result, history, roadmapsCatalog, roadmapsState] = await Promise.all(
      [
        Promise.resolve(assessmentResult),
        getHistory(route.params.sessionId).catch(() => null),
        getRoadmapsCatalog(route.params.sessionId),
        getRoadmapsState(route.params.sessionId).catch(() => ({
          completed: false,
          answers: {},
          completed_at: null,
        })),
      ],
    )
    return { session, result, history, roadmapsCatalog, roadmapsState }
  },
)

const session = _roadmapsData.value!.session
const result = _roadmapsData.value!.result
const history = _roadmapsData.value!.history
const roadmapsCatalog = _roadmapsData.value!.roadmapsCatalog
const roadmapsState = _roadmapsData.value!.roadmapsState

const preferredRoleName = computed(
  () => result?.preferred_role?.name ?? session?.preferred_role?.name ?? null,
)
const bestFitRoleName = computed(
  () => result?.best_fit_role?.name ?? session?.best_fit_role?.name ?? null,
)
const survey2RoleTitle = computed(
  () => bestFitRoleName.value ?? preferredRoleName.value ?? 'Software role',
)

const evaluation = computed(() => {
  if (!result) {
    return {
      dimensions: [],
      strengths: [],
      growthAreas: [],
      personalitySignals: [],
    }
  }

  return buildRoadmapsEvaluation(result, history)
})

const baseDimensions = computed<RadarDimension[]>(() => {
  const fromEvaluation = new Map(
    evaluation.value.dimensions.map((item) => [item.key, item]),
  )

  return roadmapsCatalog.dimensions.map(
    (dimension: { key: string; label: string; track: 'psp' | 'sdlc' }) => {
      const existing = fromEvaluation.get(dimension.key)
      return {
        key: dimension.key,
        label: dimension.label,
        track: dimension.track,
        value: existing?.value ?? 0.5,
      }
    },
  )
})

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
const isAutoAdvancing = ref(false)

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

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

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
    baseDimensions.value.map((item) => [item.key, item]),
  )

  return baseDimensions.value.map((dimension) => {
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

function answeredQuestionsCountForDimension(dimensionKey: string): number {
  return roadmapQuestions.filter((question) => {
    if (question.dimensionKey !== dimensionKey) {
      return false
    }
    return Number.isFinite(roadmapAnswers.value[question.id])
  }).length
}

function getDimensionMastery(dimensionKey: string): number {
  const matchingAnswers = roadmapQuestions
    .filter((question) => question.dimensionKey === dimensionKey)
    .map((question) => roadmapAnswers.value[question.id])
    .filter((value): value is number => Number.isFinite(value))

  if (!matchingAnswers.length) {
    return 0.5
  }

  const normalized = matchingAnswers.map((value) =>
    normalizeRoadmapsAnswer(value),
  )
  const average =
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  return clamp(average)
}

function scoreAdaptiveCandidate(question: RoadmapQuestion): number {
  const mastery = getDimensionMastery(question.dimensionKey)
  const uncertainty = 1 - Math.abs(mastery - 0.5) * 2
  const developmentNeed = 1 - mastery
  const coverageBonus =
    answeredQuestionsCountForDimension(question.dimensionKey) === 0 ? 0.25 : 0
  return developmentNeed * 0.55 + uncertainty * 0.3 + coverageBonus
}

function getUnansweredQuestions(): RoadmapQuestion[] {
  return roadmapQuestions.filter(
    (question) => !Number.isFinite(roadmapAnswers.value[question.id]),
  )
}

async function pickNextQuestionWithRl(): Promise<RoadmapQuestion | null> {
  const unanswered = getUnansweredQuestions()
  if (!unanswered.length) {
    return null
  }

  try {
    const response = await getRoadmapsNextQuestion(
      route.params.sessionId,
      roadmapAnswers.value,
    )
    const nextQuestionId = response.next_question?.id
    if (!nextQuestionId) {
      return null
    }
    return (
      roadmapQuestions.find((question) => question.id === nextQuestionId) ?? null
    )
  } catch {
    return unanswered.reduce(
      (best, current) => {
        if (!best) {
          return current
        }

        return scoreAdaptiveCandidate(current) > scoreAdaptiveCandidate(best)
          ? current
          : best
      },
      null as RoadmapQuestion | null,
    )
  }
}

function setCurrentQuestionById(questionId: string | null) {
  if (!questionId) {
    currentQuestionIndex.value = 0
    return
  }

  const nextIndex = roadmapQuestions.findIndex(
    (question) => question.id === questionId,
  )
  currentQuestionIndex.value = nextIndex === -1 ? 0 : nextIndex
}

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
  const answeredCount = roadmapQuestions.filter((question) =>
    Number.isFinite(roadmapAnswers.value[question.id]),
  ).length
  return Math.round(
    (answeredCount / roadmapQuestions.length) * 100,
  )
})

const answeredPromptCount = computed(() => {
  return roadmapQuestions.filter((question) =>
    Number.isFinite(roadmapAnswers.value[question.id]),
  ).length
})

const activeQuestionNumber = computed(() => {
  if (!activeQuestion.value) {
    return Math.min(answeredPromptCount.value + 1, roadmapQuestions.length || 1)
  }

  const currentIndex = roadmapQuestions.findIndex(
    (question) => question.id === activeQuestion.value?.id,
  )

  return currentIndex === -1 ? 1 : currentIndex + 1
})

const selectedScaleOption = computed(() => {
  if (!Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)) {
    return null
  }

  return (
    answerScale.find((option) => option.value === activeQuestionAnswer.value) ??
    null
  )
})

const phase2GuidanceTitle = computed(() => {
  return preferredRoleName.value
    ? `${preferredRoleName.value} track`
    : 'Skill calibration'
})

const phase2ProgressSummary = computed(() => {
  const calibrationState = hasAnsweredAll.value
    ? 'Ready to review'
    : answeredPromptCount.value
      ? 'Building confidence'
      : 'Still calibrating'
  const progressState = isSavingRoadmaps.value ? 'Saving' : 'In progress'

  return `Q${answeredPromptCount.value} answered • ${calibrationState} • ${progressState}`
})

const phase2Microcopy = computed(() => {
  if (isSavingRoadmaps.value) {
    return 'Saving your assessment signal and preparing the next step.'
  }

  if (isAutoAdvancing.value && selectedScaleOption.value) {
    return `${selectedScaleOption.value.label}. Moving to the next statement.`
  }

  if (selectedScaleOption.value) {
    return `${selectedScaleOption.value.label}.`
  }

  return 'Select one response to continue automatically.'
})

const phase2PromptContext = computed(() => {
  if (!activeQuestion.value) {
    return 'We are preparing the next calibration prompt.'
  }

  return 'Place the statement on the agreement scale and continue.'
})

const readinessStatus = computed(() => {
  if (overallCapabilityScore.value >= 78) return 'Role ready'
  if (overallCapabilityScore.value >= 58) return 'Project ready'
  return 'Foundation building'
})

const topRoadmapTopics = computed(() =>
  sortTopicsByDisplayOrder(result?.preferred_role_gap_topics ?? []).slice(0, 6),
)

const suggestedTechnologies = computed(() => {
  const roleName = result?.best_fit_role?.name?.toLowerCase() ?? ''
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

type ProjectSuggestion = {
  title: string
  copy: string
}

function getRoleProjectTemplates(roleName: string): ProjectSuggestion[] {
  if (roleName.includes('frontend')) {
    return [
      {
        title: 'Accessibility-First Feature Sprint',
        copy: 'Build a responsive feature with keyboard navigation, semantic landmarks, and screen-reader-tested flows.',
      },
      {
        title: 'State & API Integration Module',
        copy: 'Implement a real API-backed page with loading/error states, caching behavior, and clear UX fallbacks.',
      },
      {
        title: 'Performance Refactor Case Study',
        copy: 'Optimize rendering and bundle size, then document before/after metrics and engineering tradeoffs.',
      },
    ]
  }

  if (roleName.includes('backend')) {
    return [
      {
        title: 'Service API + Data Integrity Pack',
        copy: 'Design and implement REST endpoints with validation, pagination, structured errors, and migration-safe schema updates.',
      },
      {
        title: 'Reliability & Observability Slice',
        copy: 'Add request tracing, health checks, retry-safe jobs, and production-ready logging for one backend service.',
      },
      {
        title: 'Auth + Permission Boundary',
        copy: 'Implement role-based access with tests for authorization edges and abuse-case handling.',
      },
    ]
  }

  if (roleName.includes('data')) {
    return [
      {
        title: 'Pipeline-to-Dashboard Flow',
        copy: 'Build an ETL pipeline from raw data to a clean analytics table and publish a dashboard with key decisions.',
      },
      {
        title: 'Data Quality Guardrails',
        copy: 'Create validation checks, anomaly alerts, and a quality report for critical business dimensions.',
      },
      {
        title: 'Experiment Analysis Notebook',
        copy: 'Run a hypothesis-driven analysis with reproducible notebook steps and clear recommendation notes.',
      },
    ]
  }

  if (roleName.includes('devops')) {
    return [
      {
        title: 'CI/CD Reliability Upgrade',
        copy: 'Implement lint/test/security gates, artifact versioning, and rollback-safe deploy strategy in one pipeline.',
      },
      {
        title: 'Infra Provisioning Baseline',
        copy: 'Provision a minimal environment with IaC, secrets handling, and reproducible deployment scripts.',
      },
      {
        title: 'Incident Readiness Drill',
        copy: 'Create monitoring alerts, runbook steps, and a post-incident review template for common outages.',
      },
    ]
  }

  return [
    {
      title: 'End-to-End Delivery Case',
      copy: 'Take one feature from requirements to release with tests, documentation, and measurable outcome.',
    },
    {
      title: 'Quality & Maintenance Sprint',
      copy: 'Improve an existing module by fixing defects, increasing test confidence, and reducing change risk.',
    },
    {
      title: 'Architecture Communication Brief',
      copy: 'Document one technical decision with constraints, alternatives, risks, and operational impact.',
    },
  ]
}

const suggestedProjects = computed(() => {
  const roleName = survey2RoleTitle.value.toLowerCase()
  const templates = getRoleProjectTemplates(roleName)
  const topicHints = topRoadmapTopics.value.slice(0, 3)

  return templates.map((template, index) => {
    const topic = topicHints[index]
    if (!topic) {
      return template
    }

    return {
      title: template.title,
      copy: `${template.copy} Focus scope on ${topic.title.toLowerCase()}.`,
    }
  })
})

const recommendedRoadmapActions = computed(() => {
  const roleName = survey2RoleTitle.value.toLowerCase()
  const weakest = sortedDimensionsDesc.value.slice(-4)

  return weakest.map((dimension) => {
    const defaultAction =
      catalogByKey.value.get(dimension.key)?.low_score_action ??
      'Practice this area while completing your next roadmap topic.'

    let roleActionPrefix = 'Execution focus'
    if (roleName.includes('frontend')) roleActionPrefix = 'UI delivery focus'
    else if (roleName.includes('backend'))
      roleActionPrefix = 'Service reliability focus'
    else if (roleName.includes('data')) roleActionPrefix = 'Data trust focus'
    else if (roleName.includes('devops'))
      roleActionPrefix = 'Platform stability focus'

    return {
      dimension: dimension.label,
      action: `${roleActionPrefix}: ${defaultAction}`,
    }
  })
})

const recommendedResources = computed(() => {
  const roleName = survey2RoleTitle.value.toLowerCase()
  const shared = [
    'Project README template: problem, architecture, tradeoffs, tests, and next improvements',
    'Engineering review checklist for quality, risk, and maintainability',
  ]

  if (roleName.includes('frontend')) {
    return [
      ...shared,
      'MDN Web Docs for platform APIs and browser behavior',
      'WCAG + accessible component patterns reference',
      'Frontend performance audits with Lighthouse and DevTools',
    ]
  }
  if (roleName.includes('backend')) {
    return [
      ...shared,
      'REST API design guidelines and OpenAPI examples',
      'PostgreSQL docs for schema/index/query fundamentals',
      'Observability stack docs (structured logging, metrics, traces)',
    ]
  }
  if (roleName.includes('data')) {
    return [
      ...shared,
      'SQL style and query optimization references',
      'Pandas + data validation framework documentation',
      'Dashboard storytelling and metric design examples',
    ]
  }
  if (roleName.includes('devops')) {
    return [
      ...shared,
      'Docker and container runtime production practices',
      'CI/CD pipeline hardening and rollback strategy guides',
      'Cloud monitoring and incident response runbook examples',
    ]
  }

  return [
    ...shared,
    'Official docs for your selected framework and runtime',
    'Testing strategy guide for unit, integration, and end-to-end coverage',
    'Architecture decision record (ADR) examples for technical communication',
  ]
})

const displayPersonalitySignals = computed(() => {
  if (evaluation.value.personalitySignals.length) {
    return evaluation.value.personalitySignals
  }

  const roleName = survey2RoleTitle.value
  return [
    `Current profile is calibrated for ${roleName}.`,
    `Survey 2 scores reflect execution habits across PSP and SDLC dimensions.`,
    'Use low-scoring dimensions as immediate next-improvement priorities.',
  ]
})

const personalityPillars = computed(() => result?.pillar_profile ?? [])

const topPersonalityPillars = computed(() =>
  [...personalityPillars.value]
    .sort((left, right) => right.normalized_score - left.normalized_score)
    .slice(0, 4),
)

const personalityFitScore = computed(() => {
  if (!personalityPillars.value.length) return 0
  const total = personalityPillars.value.reduce(
    (sum, pillar) => sum + pillar.normalized_score,
    0,
  )
  return Math.round((total / personalityPillars.value.length) * 100)
})

const topMasteryScores = computed(() =>
  sortMasteryDescending(result?.mastery_scores ?? []).slice(0, 4),
)

const trackHighlights = computed(() => {
  const tracks = [
    {
      key: 'psp',
      label: 'PSP discipline',
      description: 'Planning, quality discipline, and engineering consistency.',
    },
    {
      key: 'sdlc',
      label: 'SDLC delivery',
      description:
        'Execution across analysis, build, testing, release, and support.',
    },
  ] as const

  return tracks.map((track) => {
    const dimensions = blendedDimensions.value.filter(
      (dimension) => dimension.track === track.key,
    )
    const average = dimensions.length
      ? Math.round(
          (dimensions.reduce((sum, dimension) => sum + dimension.value, 0) /
            dimensions.length) *
            100,
        )
      : 0

    return {
      ...track,
      average,
      strongest:
        [...dimensions].sort((left, right) => right.value - left.value)[0]
          ?.label ?? 'Not enough signal yet',
    }
  })
})

const strongestDimensionCards = computed(() =>
  sortedDimensionsDesc.value.slice(0, 4).map((dimension) => ({
    ...dimension,
    percent: Math.round(dimension.value * 100),
  })),
)

const growthDimensionCards = computed(() =>
  [...sortedDimensionsDesc.value]
    .reverse()
    .slice(0, 4)
    .map((dimension) => ({
      ...dimension,
      percent: Math.round(dimension.value * 100),
    })),
)

function getTopicDifficultyLabel(topic: RoadmapTopic): string {
  const raw = topic.difficulty

  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }

  if (typeof raw === 'number') {
    if (raw <= 2) return 'Foundation'
    if (raw <= 4) return 'Intermediate'
    return 'Advanced'
  }

  return 'Targeted'
}

function getTopicDuration(topic: RoadmapTopic): string {
  const raw = topic.difficulty

  if (typeof raw === 'number') {
    if (raw <= 2) return '1 to 2 weeks'
    if (raw <= 4) return '2 to 4 weeks'
    return '4 to 6 weeks'
  }

  return 'Focused sprint'
}

function getTopicTags(topic: RoadmapTopic): string[] {
  const tags = ['Role gap']

  if (topic.prerequisites?.length) {
    tags.push(
      topic.prerequisites.length === 1
        ? '1 prerequisite'
        : `${topic.prerequisites.length} prerequisites`,
    )
  }

  if (topic.parent_id !== null) {
    tags.push('Follow-on')
  }

  return tags
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function formatPillarPercent(pillar: PillarInsight): string {
  return formatPercent(pillar.normalized_score * 100)
}

async function submitRoadmaps() {
  if (!hasAnsweredAll.value) {
    return
  }

  isSavingRoadmaps.value = true

  try {
    const savePromise = saveRoadmapsState(route.params.sessionId, {
      completed: true,
      answers: { ...roadmapAnswers.value },
      completed_at: new Date().toISOString(),
    })
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error('Save timeout')), 15000)
    })
    const saved = await Promise.race([savePromise, timeoutPromise])

    roadmapAnswers.value = { ...saved.answers }
    isRoadmapsComplete.value = saved.completed
  } catch (error) {
    toast.add({
      title: 'Could not save Roadmaps',
      description:
        error instanceof Error && error.message === 'Save timeout'
          ? 'Saving took too long. Please try again.'
          : getErrorMessage(error as ApiError),
      color: 'error',
    })
  } finally {
    isSavingRoadmaps.value = false
  }
}

function selectAnswer(value: number) {
  if (!activeQuestion.value || isSavingRoadmaps.value || isAutoAdvancing.value) {
    return
  }

  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
  }

  roadmapAnswers.value[activeQuestion.value.id] = value
  isAutoAdvancing.value = true

  autoAdvanceTimer = setTimeout(() => {
    isAutoAdvancing.value = false
    autoAdvanceTimer = null
    void goToNextQuestion()
  }, AUTO_ADVANCE_DELAY_MS)
}

function goToPreviousQuestion() {
  if (currentQuestionIndex.value <= 0) {
    return
  }

  currentQuestionIndex.value -= 1
}

async function goToNextQuestion() {
  if (
    !activeQuestion.value ||
    !Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)
  ) {
    return
  }

  const nextQuestion = await pickNextQuestionWithRl()
  if (nextQuestion) {
    setCurrentQuestionById(nextQuestion.id)
    return
  }

  void submitRoadmaps()
}

onMounted(async () => {
  if (!roadmapsState.completed) {
    const nextQuestion = await pickNextQuestionWithRl()
    setCurrentQuestionById(nextQuestion?.id ?? null)
  }
})

onBeforeUnmount(() => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
  }
})

useSeoMeta({
  title: 'CompetencyX | Roadmaps',
  description:
    'PSP and SDLC capability analysis with a personalized roadmap based on Survey 1 answers.',
})
</script>

<template>
  <main
    id="main-content"
    :class="['page-wrap', !isRoadmapsComplete ? 'phase2-assessment-page' : '']"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        :to="`/results/${route.params.sessionId}`"
        class="editorial-link text-sm"
      >
        Back to Survey 1 results
      </NuxtLink>
      <p class="text-sm text-ink-soft">Session {{ route.params.sessionId }}</p>
    </div>

    <section v-if="isRoadmapsComplete" class="glass-panel mt-6 p-6 md:p-8">
      <p class="eyebrow">
        {{
          isRoadmapsComplete ? 'Final result dashboard' : 'Phase 2 assessment'
        }}
      </p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{
          isRoadmapsComplete
            ? `${survey2RoleTitle} readiness roadmap`
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
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span
          v-if="preferredRoleName"
          class="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink"
        >
          Known role: {{ preferredRoleName }}
        </span>
        <span
          v-if="bestFitRoleName"
          class="rounded-full border border-accent-soft bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-accent"
        >
          Discovery result: {{ bestFitRoleName }}
        </span>
      </div>
    </section>

    <section
      v-if="!isRoadmapsComplete"
      class="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start"
      aria-live="polite"
    >
      <aside class="lg:sticky lg:top-8">
        <section class="phase2-guidance-card">
          <button
            type="button"
            class="phase2-guidance-card__toggle"
            :aria-expanded="isGuidanceExpanded"
            aria-controls="phase2-guidance-body"
            @click="isGuidanceExpanded = !isGuidanceExpanded"
          >
            <div class="min-w-0">
              <p class="phase2-guidance-card__label">Live guidance</p>
              <h2 class="phase2-guidance-card__title">
                {{ phase2GuidanceTitle }}
              </h2>
              <p class="phase2-guidance-card__meta">
                {{ phase2ProgressSummary }}
              </p>
            </div>
            <span
              class="phase2-guidance-card__icon"
              :class="isGuidanceExpanded ? 'rotate-180' : ''"
              aria-hidden="true"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>

          <div
            id="phase2-guidance-body"
            class="grid transition-all duration-300 ease-out"
            :class="
              isGuidanceExpanded
                ? 'mt-6 grid-rows-[1fr] opacity-100'
                : 'mt-0 grid-rows-[0fr] opacity-0'
            "
          >
            <div class="min-h-0 overflow-hidden">
              <p class="phase2-guidance-card__copy">
                Answer calmly and literally. This pass measures present-day
                execution strength, not aspiration.
              </p>

              <div class="phase2-guidance-card__meter">
                <div class="phase2-guidance-card__meter-head">
                  <span>Assessment progress</span>
                  <span>{{ roadmapsProgressPercent }}%</span>
                </div>
                <div
                  class="phase2-guidance-card__progress"
                  role="progressbar"
                  aria-label="Phase 2 progress"
                  :aria-valuenow="roadmapsProgressPercent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="phase2-guidance-card__progress-fill"
                    :style="{ width: `${roadmapsProgressPercent}%` }"
                  />
                </div>
              </div>

              <div class="phase2-guidance-card__facts">
                <div class="phase2-guidance-card__fact">
                  <span class="phase2-guidance-card__fact-label">Phase</span>
                  <span class="phase2-guidance-card__fact-value">
                    Skill assessment
                  </span>
                </div>
                <div class="phase2-guidance-card__fact">
                  <span class="phase2-guidance-card__fact-label">Question</span>
                  <span class="phase2-guidance-card__fact-value">
                    {{ phase2PromptContext }}
                  </span>
                </div>
                <div class="phase2-guidance-card__fact">
                  <span class="phase2-guidance-card__fact-label"
                    >Known role</span
                  >
                  <span class="phase2-guidance-card__fact-value">
                    {{ preferredRoleName || 'Open discovery path' }}
                  </span>
                </div>
              </div>

              <p class="phase2-guidance-card__footnote">
                Your roadmap stays hidden until this calibration step is
                complete.
              </p>
            </div>
          </div>
        </section>
      </aside>

      <section class="phase2-panel">
        <div class="phase2-panel__chips">
          <span class="phase2-panel__eyebrow">Skill assessment</span>
          <span class="phase2-panel__chip phase2-panel__chip--soft">
            Agreement scale
          </span>
        </div>

        <motion.div
          v-if="activeQuestion"
          class="phase2-question-shell"
          :key="activeQuestion.id"
          :initial="
            prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
          "
          :animate="{ opacity: 1, y: 0 }"
          :transition="prefersReduced ? { duration: 0 } : { duration: 0.28 }"
        >
          <div class="phase2-question-card">
            <div class="phase2-question-card__frame">
              <p class="phase2-question-card__prompt-label">
                {{ phase2PromptContext }}
              </p>
              <h2 class="phase2-question-card__prompt">
                {{ activeQuestion.prompt }}
              </h2>
            </div>

            <fieldset
              class="phase2-scale"
              :disabled="isSavingRoadmaps || isAutoAdvancing"
            >
              <legend class="sr-only">
                Choose a value from strongly disagree to strongly agree
              </legend>

              <div class="phase2-scale__caption">
                <span>Strongly disagree</span>
                <span>Strongly agree</span>
              </div>

              <div class="phase2-scale__track">
                <span class="phase2-scale__rail" aria-hidden="true" />

                <button
                  v-for="option in answerScale"
                  :key="`${activeQuestion.id}-${option.value}`"
                  type="button"
                  class="phase2-scale__option"
                  :class="
                    activeQuestionAnswer === option.value
                      ? 'phase2-scale__option--selected'
                      : ''
                  "
                  :aria-pressed="activeQuestionAnswer === option.value"
                  :aria-label="option.label"
                  :disabled="isSavingRoadmaps || isAutoAdvancing"
                  @click="selectAnswer(option.value)"
                >
                  <span class="phase2-scale__orb" aria-hidden="true">
                    <span class="phase2-scale__orb-core" />
                  </span>
                  <span class="phase2-scale__option-label">
                    {{ option.label }}
                  </span>
                </button>
              </div>
            </fieldset>
          </div>

          <div class="phase2-panel__footer">
            <p class="phase2-panel__microcopy">
              {{ phase2Microcopy }}
            </p>
            <div class="phase2-panel__actions">
              <button
                type="button"
                class="phase2-button phase2-button--ghost"
                :disabled="currentQuestionIndex === 0"
                @click="goToPreviousQuestion"
              >
                Previous
              </button>
            </div>
          </div>
        </motion.div>

        <div v-else class="phase2-question-card phase2-question-card--empty">
          <p class="phase2-question-card__prompt-label">Preparing prompt</p>
          <h2
            class="phase2-question-card__prompt phase2-question-card__prompt--compact"
          >
            We are resolving the next calibration question.
          </h2>
          <p class="phase2-panel__lead mt-4">
            Refreshing the session should surface the next prompt without losing
            your progress.
          </p>
        </div>
      </section>
    </section>

    <template v-if="isRoadmapsComplete">
      <section class="result-spotlight mt-24 overflow-hidden p-6 md:p-10">
        <div class="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
            >
              <span aria-hidden="true">✓</span>
              Assessment complete
            </div>

            <h2
              class="mt-6 max-w-4xl font-display text-4xl leading-tight text-ink md:text-6xl"
            >
              {{ survey2RoleTitle }} readiness, organized into a clear growth
              plan.
            </h2>
            <p
              class="mt-5 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              This view separates your profile summary, fit signals, learning
              sequence, and supporting analytics so the next actions are easy to
              scan.
            </p>

            <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:max-w-3xl">
              <article class="paper-panel p-6">
                <p class="eyebrow">Personality result</p>
                <h3 class="mt-3 text-2xl font-bold text-ink">
                  {{ survey2RoleTitle }}
                </h3>
                <p class="mt-2 text-sm leading-7 text-ink-soft">
                  {{ displayPersonalitySignals[0] }}
                </p>

                <div class="mt-6 grid gap-3">
                  <div
                    class="rounded-2xl border border-border-subtle bg-surface-card px-4 py-3"
                  >
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Personality fit
                    </p>
                    <div class="mt-2 flex items-end justify-between gap-3">
                      <p class="data-value text-3xl font-black text-ink">
                        {{ personalityFitScore }}%
                      </p>
                      <p class="text-xs font-semibold text-ink-soft">
                        Based on pillar profile
                      </p>
                    </div>
                  </div>

                  <div
                    v-for="pillar in topPersonalityPillars.slice(0, 3)"
                    :key="pillar.key"
                    class="rounded-2xl border border-border-subtle bg-surface-card px-4 py-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-ink">
                        {{ pillar.label }}
                      </p>
                      <p class="data-value text-sm font-bold text-accent">
                        {{ formatPillarPercent(pillar) }}
                      </p>
                    </div>
                    <div class="mt-3 h-2 rounded-full bg-ink/8">
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

              <article class="paper-panel p-6">
                <p class="eyebrow">Hero metrics</p>
                <div class="mt-4 grid gap-3">
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Overall readiness
                    </p>
                    <p class="mt-2 data-value text-4xl font-black text-ink">
                      {{ overallCapabilityScore }}%
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Readiness status
                    </p>
                    <p class="mt-2 text-2xl font-black text-ink">
                      {{ readinessStatus }}
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Strongest now
                    </p>
                    <p class="mt-2 text-sm leading-7 text-ink-soft">
                      {{ recalculatedStrengths.join(' • ') }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="grid gap-4">
            <div class="paper-panel p-5 md:p-6">
              <p class="eyebrow">Capability map</p>
              <h3 class="mt-3 font-display text-3xl text-ink">
                Profile centerpiece
              </h3>
              <p class="mt-2 max-w-md text-sm leading-7 text-ink-soft">
                The map keeps your current execution shape visible while the
                rest of the page focuses on interpretation and next steps.
              </p>
              <div class="mt-6">
                <SkillSpiderChart :dimensions="blendedDimensions" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-band mt-24 py-12 md:py-16">
        <div class="mx-auto max-w-6xl">
          <div class="max-w-3xl">
            <p class="eyebrow">Section 2</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              Knowledge + personality fit
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              Separate the execution signal from the personality signal so the
              fit story is readable at a glance.
            </p>
          </div>

          <div class="mt-10 grid gap-6 xl:grid-cols-2">
            <article class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">Knowledge fit</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    Capability alignment
                  </h3>
                </div>
                <div class="text-right">
                  <p class="data-value text-4xl font-black text-ink">
                    {{ overallCapabilityScore }}%
                  </p>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
                  >
                    current readiness
                  </p>
                </div>
              </div>

              <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
                Your knowledge fit blends Survey 1 signals with Survey 2
                execution evidence across PSP and SDLC dimensions.
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
                    Strongest: {{ track.strongest }}
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

            <article class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">Personality fit</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    Behavioral alignment
                  </h3>
                </div>
                <div class="text-right">
                  <p class="data-value text-4xl font-black text-ink">
                    {{ personalityFitScore }}%
                  </p>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
                  >
                    profile coherence
                  </p>
                </div>
              </div>

              <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
                This card translates your personality radar and role guidance
                into concise signals instead of long narrative blocks.
              </p>

              <div class="mt-8 space-y-3">
                <div
                  v-for="signal in displayPersonalitySignals"
                  :key="signal"
                  class="metric-card p-4"
                >
                  <p class="text-sm leading-7 text-ink-soft">{{ signal }}</p>
                </div>
              </div>

              <div class="mt-8 space-y-4">
                <div v-for="pillar in topPersonalityPillars" :key="pillar.key">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-ink">
                      {{ pillar.label }}
                    </p>
                    <p class="data-value text-sm font-bold text-accent">
                      {{ formatPillarPercent(pillar) }}
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

              <div class="mt-8 grid gap-3">
                <div
                  v-for="guidance in roadmapsCatalog.role_guidance.slice(0, 2)"
                  :key="guidance"
                  class="rounded-2xl border border-accent/18 bg-accent/8 p-4"
                >
                  <p class="text-sm leading-7 text-ink">{{ guidance }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="mt-24">
        <div class="max-w-3xl">
          <p class="eyebrow">Section 3</p>
          <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
            Recommended learning sequence
          </h2>
          <p
            class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
          >
            A guided roadmap that turns your gap profile into a paced, visible
            progression.
          </p>
        </div>

        <div class="mt-12 grid gap-6">
          <div
            v-for="(topic, index) in topRoadmapTopics"
            :key="topic.id"
            class="relative pl-8 md:pl-12"
          >
            <div
              v-if="index !== topRoadmapTopics.length - 1"
              class="absolute left-[1rem] top-16 hidden h-[calc(100%+1.5rem)] w-px bg-[linear-gradient(180deg,rgba(234,112,31,0.36),rgba(33,122,111,0.18))] md:block"
            />
            <div
              class="absolute left-0 top-8 grid h-8 w-8 place-items-center rounded-full border border-accent/20 bg-white text-xs font-black text-accent shadow-[0_10px_24px_rgba(234,112,31,0.16)] md:left-[0.05rem]"
            >
              {{ index + 1 }}
            </div>

            <article class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="max-w-2xl">
                  <p class="eyebrow">Step {{ index + 1 }}</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    {{ topic.title }}
                  </h3>
                  <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                    {{
                      topic.description ||
                      'This topic is prioritized from your preferred-role gap profile.'
                    }}
                  </p>
                </div>

                <div class="grid min-w-[13rem] gap-3 sm:grid-cols-2 sm:gap-2">
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Difficulty
                    </p>
                    <p class="mt-2 text-sm font-bold text-ink">
                      {{ getTopicDifficultyLabel(topic) }}
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      Duration
                    </p>
                    <p class="mt-2 text-sm font-bold text-ink">
                      {{ getTopicDuration(topic) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap gap-2">
                <span
                  v-for="tag in getTopicTags(topic)"
                  :key="tag"
                  class="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft"
                >
                  {{ tag }}
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section-band mt-24 py-12 md:py-16">
        <div class="mx-auto max-w-6xl">
          <div class="max-w-3xl">
            <p class="eyebrow">Section 4</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              Additional insights and analytics
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              Supporting detail is grouped into smaller cards so the page stays
              analytical without becoming dense.
            </p>
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-3">
            <article class="paper-panel p-6">
              <p class="eyebrow">Strength distribution</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                Strongest dimensions
              </h3>
              <p class="mt-2 text-sm leading-7 text-ink-soft">
                The highest-scoring capability areas currently carrying your
                fit.
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
                  <div class="mt-3 h-2 rounded-full bg-ink/8">
                    <div
                      class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                      :style="{ width: `${dimension.percent}%` }"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article class="paper-panel p-6">
              <p class="eyebrow">Development priorities</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">Improve next</h3>
              <p class="mt-2 text-sm leading-7 text-ink-soft">
                The lowest-scoring areas that will move readiness fastest.
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
                  <div class="mt-3 h-2 rounded-full bg-ink/8">
                    <div
                      class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))]"
                      :style="{ width: `${dimension.percent}%` }"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article v-if="topMasteryScores.length" class="paper-panel p-6">
              <p class="eyebrow">Mastery snapshot</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                Strongest topic evidence
              </h3>
              <p class="mt-2 text-sm leading-7 text-ink-soft">
                Topic-level proof where current confidence and mastery are
                already strongest.
              </p>
              <div class="mt-6 grid gap-3">
                <MasteryMeter
                  v-for="mastery in topMasteryScores"
                  :key="mastery.topic_id"
                  :mastery="mastery"
                />
              </div>
            </article>
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-3">
            <article class="paper-panel p-6">
              <p class="eyebrow">Career alignment</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">Learn next</h3>
              <div class="mt-6 flex flex-wrap gap-2">
                <span
                  v-for="technology in suggestedTechnologies"
                  :key="technology"
                  class="rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-bold text-ink"
                >
                  {{ technology }}
                </span>
              </div>
            </article>

            <article class="paper-panel p-6 lg:col-span-2">
              <p class="eyebrow">Project evidence</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">Build for proof</h3>
              <div class="mt-6 grid gap-4 md:grid-cols-3">
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
            </article>
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-2">
            <article class="paper-panel p-6">
              <p class="eyebrow">Action guidance</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                Soft skill and execution analysis
              </h3>
              <div class="mt-6 grid gap-3">
                <div
                  v-for="item in recommendedRoadmapActions"
                  :key="item.dimension"
                  class="flow-node p-4 pl-5"
                >
                  <p class="text-sm font-bold text-ink">{{ item.dimension }}</p>
                  <p class="mt-2 text-sm leading-6 text-ink-soft">
                    {{ item.action }}
                  </p>
                </div>
              </div>
            </article>

            <article class="paper-panel p-6">
              <p class="eyebrow">Learning readiness</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                Keep the plan practical
              </h3>
              <div class="mt-6 grid gap-3">
                <div
                  v-for="resource in recommendedResources"
                  :key="resource"
                  class="metric-card p-4"
                >
                  <p class="text-sm leading-6 text-ink">{{ resource }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
