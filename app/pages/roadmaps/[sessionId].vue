<script setup lang="ts">
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useLocale } from '~/composables/useLocale'
import { sortTopicsByDisplayOrder } from '~/utils/assessment'
import { buildRoadmapsEvaluation, getRoadmapScaleLabel } from '~/utils/roadmaps'
import {
  getRoadmapTopics,
  fetchTopicResources,
  getRoadmapSlug,
} from '~/utils/roadmapTopics'
import type { RadarDimension } from '~/utils/roadmaps'
import RoadmapGuidanceCard from '~/components/roadmaps/RoadmapGuidanceCard.vue'
import RoadmapQuestionPanel from '~/components/roadmaps/RoadmapQuestionPanel.vue'
import RoadmapCompletedOverview from '~/components/roadmaps/RoadmapCompletedOverview.vue'
import RoadmapFitProfileSection from '~/components/roadmaps/RoadmapFitProfileSection.vue'
import RoadmapLearningSequence from '~/components/roadmaps/RoadmapLearningSequence.vue'
import RoadmapInsightsSection from '~/components/roadmaps/RoadmapInsightsSection.vue'
import { getErrorMessage } from '~/utils/api'
import { useQuestionI18n } from '~/composables/useQuestionI18n'
import type {
  ApiError,
  AssessmentSession,
  PillarInsight,
  Recommendation,
  ResourceLink,
  RoadmapTopic,
  RoadmapsCatalogDimension,
  RoadmapsCatalogQuestion,
  RoadmapsScaleOption,
} from '~~/shared/types/assessment'

const route = useRoute('/roadmaps/[sessionId]')
const sessionId = computed(() => route.params.sessionId as string)
const { getResults, getHistory } = useAssessmentResults()
const {
  getRoadmapsCatalog,
  getRoadmapsState,
  getRoadmapsNextQuestion,
  saveRoadmapsState,
} = useRoadmapsApiClient()
const toast = useToast()
const { getSession } = useAssessmentSession()
const prefersReduced = useReducedMotion()
const AUTO_ADVANCE_DELAY_MS = 220
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

const { data: _roadmapsData, refresh } = await useAsyncData(
  `roadmaps-${sessionId.value}`,
  async () => {
    const session = await getSession(sessionId.value).catch(
      () => null as AssessmentSession | null,
    )

    const assessmentResult = await getResults(sessionId.value).catch(
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
        getHistory(sessionId.value).catch(() => null),
        getRoadmapsCatalog(sessionId.value),
        getRoadmapsState(sessionId.value).catch(() => ({
          completed: false,
          answers: {},
          completed_at: null,
        })),
      ],
    )
    let initialQuestionId: string | null = null
    if (!roadmapsState.completed) {
      const questions = buildRoadmapQuestions(roadmapsCatalog?.questions)
      const answers = { ...(roadmapsState.answers ?? {}) }
      const unanswered = getUnansweredQuestions(questions, answers)

      if (unanswered.length) {
        try {
          const response = await getRoadmapsNextQuestion(
            sessionId.value,
            answers,
          )
          initialQuestionId = response.next_question?.id ?? null
        } catch {
          const scaleValues = (roadmapsCatalog?.scale ?? []).map(
            (option: RoadmapsScaleOption) => option.value,
          )
          const scaleMin = scaleValues.length ? Math.min(...scaleValues) : 1
          const scaleMax = scaleValues.length ? Math.max(...scaleValues) : 5
          initialQuestionId =
            getBestLocalCandidate(unanswered, questions, answers, scaleMin, scaleMax)
              ?.id ?? null
        }
      }
    }

    return {
      session,
      result,
      history,
      roadmapsCatalog,
      roadmapsState,
      initialQuestionId,
    }
  },
)

const _roadmapsSnapshot = _roadmapsData.value ?? {
  session: null,
  result: null,
  history: null,
  roadmapsCatalog: null,
  roadmapsState: null,
  initialQuestionId: null,
}
const roadmapsCatalog = _roadmapsSnapshot.roadmapsCatalog
const result = computed(
  () => _roadmapsData.value?.result ?? _roadmapsSnapshot.result,
)
const session = _roadmapsSnapshot.session
const history = _roadmapsSnapshot.history
const roadmapsState = _roadmapsSnapshot.roadmapsState
const { isThai: globalIsThai, localeInitialized } = useLocale()
const isThai = computed(() => {
  if (localeInitialized.value) return globalIsThai.value
  return session?.language === 'th'
})

const t = usePageI18n('roadmaps', isThai)

const hasRoleAnswers = computed(() => {
  return (session?.milestones?.answered_role_questions ?? 0) > 0
})

const preferredRoleName = computed(
  () =>
    result.value?.preferred_role?.name ?? session?.preferred_role?.name ?? null,
)
const bestFitRoleName = computed(
  () =>
    result.value?.best_fit_role?.name ?? session?.best_fit_role?.name ?? null,
)
const survey2RoleTitle = computed(
  () =>
    bestFitRoleName.value ??
    preferredRoleName.value ??
    (isThai.value ? 'บทบาทซอฟต์แวร์' : 'Software role'),
)

const evaluation = computed(() => {
  if (!result.value) {
    return {
      dimensions: [],
      strengths: [],
      growthAreas: [],
      personalitySignals: [],
    }
  }

  return buildRoadmapsEvaluation(result.value, history)
})

const baseDimensions = computed<RadarDimension[]>(() => {
  const fromEvaluation = new Map(
    evaluation.value.dimensions.map((item) => [item.key, item]),
  )

  return (roadmapsCatalog?.dimensions ?? []).map(
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

const isRoadmapsComplete = ref(roadmapsState?.completed)

type RoadmapQuestion = {
  id: string
  prompt: string
  translations?: RoadmapsCatalogQuestion['translations']
  dimensionKey: string
}

const roadmapQuestions: RoadmapQuestion[] = buildRoadmapQuestions(
  roadmapsCatalog?.questions,
)

const answerScale = roadmapsCatalog?.scale ?? []
const answerScaleValues = answerScale.map(
  (option: RoadmapsScaleOption) => option.value,
)
const answerScaleMin = answerScaleValues.length
  ? Math.min(...answerScaleValues)
  : 1
const answerScaleMax = answerScaleValues.length
  ? Math.max(...answerScaleValues)
  : 5

const roadmapAnswers = ref<Record<string, number>>({
  ...(roadmapsState?.answers ?? {}),
})
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

const activeQuestionRef = computed(() => activeQuestion.value)
const { localizedPrompt } = useQuestionI18n(() => activeQuestionRef.value)

const activeQuestionAnswer = computed(() => {
  if (!activeQuestion.value) {
    return null
  }

  return roadmapAnswers.value[activeQuestion.value.id] ?? null
})

const catalogByKey = computed(
  () =>
    new Map<string, RoadmapsCatalogDimension>(
      (roadmapsCatalog?.dimensions ?? []).map(
        (item: RoadmapsCatalogDimension) => [item.key, item],
      ),
    ),
)

const { blendedDimensions, pickNextQuestionWithRl } = useRoadmapQuestions(
  computed(() => sessionId.value),
  computed(() => roadmapQuestions),
  roadmapAnswers,
  computed(() => answerScaleMin),
  computed(() => answerScaleMax),
  baseDimensions,
  catalogByKey,
)

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

if (!roadmapsState?.completed) {
  setCurrentQuestionById(_roadmapsSnapshot.initialQuestionId ?? null)
}

const sortedDimensionsDesc = computed(() =>
  [...blendedDimensions.value].sort((left, right) => right.value - left.value),
)

const currentRoleSlug = computed(
  () =>
    result.value?.preferred_role?.slug ??
    session?.preferred_role?.slug ??
    result.value?.ranked_roles?.[0]?.slug ??
    null,
)

const roadmapShTopics = ref<RoadmapTopic[]>([])
const topicResources = reactive(new Map<number, ResourceLink[]>())
const loadingResources = ref<Set<number>>(new Set())

async function loadTopicResources(topicId: number, topicTitle: string) {
  if (topicResources.has(topicId) || loadingResources.value.has(topicId)) return
  const slug = getRoadmapSlug(currentRoleSlug.value ?? '')
  if (!slug) {
    return
  }
  loadingResources.value = new Set([...loadingResources.value, topicId])
  const links = await fetchTopicResources(slug, topicTitle)
  if (links.length) {
    topicResources.set(topicId, links)
  }
  const next = new Set(loadingResources.value)
  next.delete(topicId)
  loadingResources.value = next
}

watch(
  currentRoleSlug,
  async (slug) => {
    if (slug) {
      roadmapShTopics.value = await getRoadmapTopics(slug)
    }
  },
  { immediate: true },
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
    (sum: number, dimension: RadarDimension) => sum + dimension.value,
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
  return Math.round((answeredCount / roadmapQuestions.length) * 100)
})

const answeredPromptCount = computed(() => {
  return roadmapQuestions.filter((question) =>
    Number.isFinite(roadmapAnswers.value[question.id]),
  ).length
})

const selectedScaleOption = computed(() => {
  if (!Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)) {
    return null
  }

  return (
    answerScale.find(
      (option: RoadmapsScaleOption) =>
        option.value === activeQuestionAnswer.value,
    ) ?? null
  )
})

const phase2GuidanceTitle = computed(() => {
  return preferredRoleName.value
    ? `${preferredRoleName.value} track`
    : 'Skill calibration'
})

const phase2ProgressSummary = computed(() => {
  const calibrationState = hasAnsweredAll.value
    ? t.value.readyToReview
    : answeredPromptCount.value
      ? t.value.buildingConfidence
      : t.value.stillCalibrating
  const progressState = isSavingRoadmaps.value
    ? t.value.saving
    : t.value.inProgress

  return `Q${answeredPromptCount.value} ${t.value.answered} • ${calibrationState} • ${progressState}`
})

const phase2Microcopy = computed(() => {
  if (isSavingRoadmaps.value) {
    return t.value.savingSignal
  }

  if (isAutoAdvancing.value && selectedScaleOption.value) {
    return `${getRoadmapScaleLabel(selectedScaleOption.value, isThai.value)}. ${t.value.movingNext}`
  }

  if (selectedScaleOption.value) {
    return `${getRoadmapScaleLabel(selectedScaleOption.value, isThai.value)}.`
  }

  return t.value.selectOne
})

const phase2PromptContext = computed(() => {
  if (!activeQuestion.value) {
    return t.value.preparingPrompt
  }

  return t.value.promptContext
})

const readinessStatus = computed(() => {
  if (overallCapabilityScore.value >= 78) return t.value.roleReady
  if (overallCapabilityScore.value >= 58) return t.value.projectReady
  return t.value.foundationBuilding
})

const TARGET_READINESS_SCORE = 78

const capabilityGap = computed(() =>
  Math.max(0, TARGET_READINESS_SCORE - overallCapabilityScore.value),
)

const isAtTarget = computed(
  () => overallCapabilityScore.value >= TARGET_READINESS_SCORE,
)

const topRoadmapTopics = computed<RoadmapTopic[]>(() => {
  const gapTopics = sortTopicsByDisplayOrder(
    (result.value?.preferred_role_gap_topics ?? []) as RoadmapTopic[],
  ).slice(0, 6)

  if (gapTopics.length && !roadmapShTopics.value.length) {
    return gapTopics
  }

  if (roadmapShTopics.value.length) {
    const gapTitles = new Set(
      gapTopics.map((t) => t.title.toLowerCase().trim()),
    )
    return roadmapShTopics.value.map((rt) => ({
      ...rt,
      is_gap:
        gapTitles.has(rt.title.toLowerCase().trim()) ||
        gapTitles.has(rt.slug.replace(/-/g, ' ')),
    }))
  }

  const recs = [
    result.value?.preferred_path_recommendation,
    result.value?.best_fit_path_recommendation,
  ].filter((r): r is Recommendation => r != null && r.topic_title != null)

  if (recs.length) {
    return recs.slice(0, 6).map((rec, index) => ({
      id: rec.topic_id ?? -(index + 1),
      slug: rec.topic_slug ?? '',
      title: rec.topic_title!,
      description: rec.reason,
      difficulty: 0,
      display_order: index,
      parent_id: null,
      prerequisites: [],
    }))
  }

  if (evaluation.value.growthAreas.length) {
    return evaluation.value.growthAreas.slice(0, 6).map((label, index) => ({
      id: -(index + 10),
      slug: label.toLowerCase().replace(/\s+/g, '-'),
      title: label,
      description: undefined,
      difficulty: 0,
      display_order: index,
      parent_id: null,
      prerequisites: [],
    }))
  }

  return sortedDimensionsDesc.value
    .slice(-6)
    .reverse()
    .map((dim, index) => ({
      id: -(index + 20),
      slug: dim.key,
      title: dim.label,
      description: undefined,
      difficulty: 0,
      display_order: index,
      parent_id: null,
      prerequisites: [],
    }))
})

const roadmapShTopicsByTitle = computed(() => {
  const exact = new Map<string, RoadmapTopic>()
  const fuzzy = new Map<string, RoadmapTopic>()
  for (const t of roadmapShTopics.value) {
    exact.set(t.title, t)
    fuzzy.set(t.title.toLowerCase().trim(), t)
    fuzzy.set(t.slug.replace(/-/g, ' '), t)
  }
  return { exact, fuzzy }
})

function findEnriched(title: string, slug: string): RoadmapTopic | undefined {
  const { exact, fuzzy } = roadmapShTopicsByTitle.value
  const match = exact.get(title)
  if (match) return match
  const nl = title.toLowerCase().trim()
  const fuzz = fuzzy.get(nl)
  if (fuzz) return fuzz
  const slugSpace = slug.replace(/-/g, ' ')
  return fuzzy.get(slugSpace)
}

const displayTopics = computed<RoadmapTopic[]>(() =>
  topRoadmapTopics.value.map((t) => {
    const enriched = findEnriched(t.title, t.slug)
    let prerequisite_titles = t.prerequisite_titles
    let subtopic_titles = t.subtopic_titles
    let follow_on_titles = t.follow_on_titles

    if (!prerequisite_titles?.length && enriched?.prerequisite_titles?.length) {
      prerequisite_titles = enriched.prerequisite_titles
    }
    if (!prerequisite_titles?.length) {
      const titles = (t.prerequisites ?? [])
        .map((p) => p.title)
        .filter((title): title is string => !!title)
      if (titles.length) {
        prerequisite_titles = titles
      }
    }
    if (!subtopic_titles?.length && enriched?.subtopic_titles?.length) {
      subtopic_titles = enriched.subtopic_titles
    }
    if (!follow_on_titles?.length && enriched?.follow_on_titles?.length) {
      follow_on_titles = enriched.follow_on_titles
    }

    return {
      ...t,
      topic_group: t.topic_group || enriched?.topic_group,
      prerequisite_titles,
      subtopic_titles,
      follow_on_titles,
    }
  }),
)

watch(
  () => displayTopics.value,
  (topics) => {
    for (const t of topics) {
      loadTopicResources(t.id, t.title)
    }
  },
  { immediate: true },
)

const displayPersonalitySignals = computed(() => {
  if (evaluation.value.personalitySignals.length) {
    return evaluation.value.personalitySignals
  }

  const roleName = survey2RoleTitle.value
  return [
    isThai.value
      ? `โปรไฟล์ปัจจุบันถูกปรับเทียบกับทิศทาง ${roleName}`
      : `Current profile is calibrated for ${roleName}.`,
    isThai.value
      ? 'คะแนน Survey 2 สะท้อนนิสัยการทำงานในมิติ PSP และ SDLC'
      : `Survey 2 scores reflect execution habits across PSP and SDLC dimensions.`,
    isThai.value
      ? 'ใช้มิติคะแนนต่ำเป็นลำดับสำคัญในการพัฒนาถัดไป'
      : 'Use low-scoring dimensions as immediate next-improvement priorities.',
  ]
})

const personalityFitNarrative = computed(() => {
  const roleName = survey2RoleTitle.value
  const topThree = topPersonalityPillars.value.slice(0, 3)
  const pillarSummary = topThree.length
    ? isThai.value
      ? `เสาหลักที่มีคะแนนสูงสุด: ${topThree.map((p) => `${p.label} ${(p.normalized_score * 10).toFixed(1)}/10`).join(', ')}`
      : `Top profile pillars: ${topThree.map((p) => `${p.label} ${(p.normalized_score * 10).toFixed(1)}/10`).join(', ')}`
    : isThai.value
      ? 'ยังไม่มีข้อมูลเสาหลักบุคลิกภาพที่เพียงพอ'
      : 'Not enough personality pillar data yet.'

  const avgScore = personalityPillars.value.length
    ? (
        (personalityPillars.value.reduce(
          (sum: number, p: PillarInsight) => sum + p.normalized_score,
          0,
        ) /
          personalityPillars.value.length) *
        10
      ).toFixed(1)
    : '0.0'

  const alignmentContext = isThai.value
    ? `คะแนนความสอดคล้องบุคลิกภาพโดยรวมอยู่ที่ ${avgScore}/10`
    : `Your overall personality alignment score is ${avgScore}/10`

  const guidanceSummary =
    result.value?.role_alignment_status === 'aligned'
      ? isThai.value
        ? `คะแนนระดับนี้บ่งชี้ว่าคุณมีความสอดคล้องกับทิศทาง ${roleName} พอสมควร ควรใช้คะแนนเสาหลักต่ำเป็นจุดเน้นในการพัฒนา`
        : `This alignment level suggests reasonable consistency with the ${roleName} direction. Use lower-scoring pillars as development focus areas.`
      : isThai.value
        ? `คะแนนระดับนี้บ่งชี้ว่ายังมีโอกาสสำรวจเพิ่มเติมก่อนตัดสินใจเลือกเส้นทาง ใช้เสาหลักที่ได้คะแนนต่ำเป็น feedback เพื่อปรับทิศทาง`
        : `This suggests room to explore before locking a path. Use low-scoring pillars as directional feedback.`

  return `${pillarSummary}. ${alignmentContext}. ${guidanceSummary}`
})

const personalityPillars = computed(() => result.value?.pillar_profile ?? [])

const topPersonalityPillars = computed(() =>
  [...personalityPillars.value]
    .sort((left, right) => right.normalized_score - left.normalized_score)
    .slice(0, 4),
)

const trackHighlights = computed(() => {
  const tracks = [
    {
      key: 'psp',
      label: isThai.value ? 'วินัยแบบ PSP' : 'PSP discipline',
      description: isThai.value
        ? 'การวางแผน วินัยด้านคุณภาพ และความสม่ำเสมอทางวิศวกรรม'
        : 'Planning, quality discipline, and engineering consistency.',
    },
    {
      key: 'sdlc',
      label: isThai.value ? 'การส่งมอบแบบ SDLC' : 'SDLC delivery',
      description: isThai.value
        ? 'การทำงานตั้งแต่วิเคราะห์ สร้าง ทดสอบ ปล่อยใช้งาน และดูแลระบบ'
        : 'Execution across analysis, build, testing, release, and support.',
    },
  ] as const

  return tracks.map((track) => {
    const dimensions = blendedDimensions.value.filter(
      (dimension) => dimension.track === track.key,
    )
    const average = dimensions.length
      ? Math.round(
          (dimensions.reduce(
            (sum: number, dimension: RadarDimension) => sum + dimension.value,
            0,
          ) /
            dimensions.length) *
            100,
        )
      : 0

    return {
      ...track,
      average,
      strongest:
        [...dimensions].sort((left, right) => right.value - left.value)[0]
          ?.label ??
        (isThai.value ? 'สัญญาณยังไม่เพียงพอ' : 'Not enough signal yet'),
    }
  })
})

const strongestDimensionCards = computed(() =>
  sortedDimensionsDesc.value.slice(0, 4).map((dimension) => ({
    ...dimension,
    percent: Math.round(dimension.value * 100),
    description: isThai.value
      ? 'คำตอบของคุณแสดงถึงความสามารถที่สม่ำเสมอในด้านนี้'
      : 'Your responses reflect consistent strength in this area.',
  })),
)

const growthDimensionCards = computed(() =>
  [...sortedDimensionsDesc.value]
    .reverse()
    .slice(0, 4)
    .map((dimension) => {
      const cat = catalogByKey.value.get(dimension.key)
      return {
        ...dimension,
        percent: Math.round(dimension.value * 100),
        description: isThai.value
          ? 'ให้ความสำคัญกับด้านนี้เพื่อเพิ่มความพร้อม'
          : (cat?.low_score_action ??
            'Focus on this area to improve overall readiness.'),
      }
    }),
)

const personalityFitScoreDisplay = computed(() => {
  if (!personalityPillars.value.length) return '0/10'
  const avg =
    personalityPillars.value.reduce(
      (sum: number, p: PillarInsight) => sum + p.normalized_score,
      0,
    ) / personalityPillars.value.length
  return `${(avg * 10).toFixed(1)}/10`
})

async function submitRoadmaps() {
  if (!hasAnsweredAll.value) {
    return
  }

  isSavingRoadmaps.value = true

  try {
    const savePromise = saveRoadmapsState(sessionId.value, {
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
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Could not save Roadmaps',
      description:
        error instanceof Error && error.message === 'Save timeout'
          ? 'Saving took too long. Please try again.'
          : (getErrorMessage(error as ApiError) ?? undefined),
      color: 'error',
    })
  } finally {
    isSavingRoadmaps.value = false
  }
}

function selectAnswer(value: number) {
  if (
    !activeQuestion.value ||
    isSavingRoadmaps.value ||
    isAutoAdvancing.value
  ) {
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
        v-if="hasRoleAnswers"
        :to="`/results/${route.params.sessionId}`"
        class="editorial-link text-sm"
      >
        {{ t.backToSurvey1 }}
      </NuxtLink>
      <p class="text-sm text-ink-soft">
        {{ t.session }} {{ route.params.sessionId }}
      </p>
    </div>

    <section v-if="isRoadmapsComplete" class="glass-panel mt-6 p-6 md:p-8">
      <p class="eyebrow">
        {{ isRoadmapsComplete ? t.finalDashboard : t.phase2Assessment }}
      </p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{
          isRoadmapsComplete
            ? `${survey2RoleTitle} ${t.readinessRoadmap}`
            : t.calibrateSkills
        }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
        {{ isRoadmapsComplete ? t.completeIntro : t.incompleteIntro }}
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
        <RoadmapGuidanceCard
          :title="phase2GuidanceTitle"
          :progress-summary="phase2ProgressSummary"
          :progress-percent="roadmapsProgressPercent"
          :prompt-context="phase2PromptContext"
          :preferred-role-name="preferredRoleName"
        />
      </aside>

      <RoadmapQuestionPanel
        :question="activeQuestion"
        :prompt="localizedPrompt || activeQuestion?.prompt || ''"
        :prompt-context="phase2PromptContext"
        :microcopy="phase2Microcopy"
        :answer-scale="answerScale"
        :selected-value="activeQuestionAnswer"
        :is-saving="isSavingRoadmaps"
        :is-auto-advancing="isAutoAdvancing"
        :is-first-question="currentQuestionIndex === 0"
        :is-thai="isThai"
        :prefers-reduced="prefersReduced ?? false"
        @select="selectAnswer"
        @previous="goToPreviousQuestion"
      />
    </section>

    <template v-if="isRoadmapsComplete">
      <RoadmapCompletedOverview
        :role-title="survey2RoleTitle"
        :personality-signal="displayPersonalitySignals[0]"
        :top-personality-pillars="topPersonalityPillars"
        :personality-fit-score-display="personalityFitScoreDisplay"
        :overall-capability-score="overallCapabilityScore"
        :readiness-status="readinessStatus"
        :recalculated-strengths="recalculatedStrengths"
        :recalculated-growth-areas="recalculatedGrowthAreas"
        :target-score="TARGET_READINESS_SCORE"
        :is-at-target="isAtTarget"
        :capability-gap="capabilityGap"
        :display-topics="displayTopics"
        :blended-dimensions="blendedDimensions"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <RoadmapFitProfileSection
        :overall-capability-score="overallCapabilityScore"
        :track-highlights="trackHighlights"
        :strongest-dimension-cards="strongestDimensionCards"
        :top-personality-pillars="topPersonalityPillars"
        :personality-fit-score-display="personalityFitScoreDisplay"
        :personality-fit-narrative="personalityFitNarrative"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <RoadmapLearningSequence
        :topics="displayTopics"
        :topic-resources="topicResources"
        :is-thai="isThai"
      />

      <RoadmapInsightsSection
        :strongest-dimension-cards="strongestDimensionCards"
        :growth-dimension-cards="growthDimensionCards"
        :is-thai="isThai"
      />
    </template>
  </main>
</template>
