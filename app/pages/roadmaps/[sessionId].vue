<script setup lang="ts">
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useLocale } from '~/composables/useLocale'
import { sortTopicsByDisplayOrder } from '~/utils/assessment'
import { buildRoadmapsEvaluation, getRoadmapScaleLabel, cleanPillarLabel } from '~/utils/roadmaps'
import {
  fetchTopicResources,
  getRoadmapSlug,
} from '~/utils/roadmapTopics'
import { useCatalogApi } from '~/composables/useCatalogApi'
import type { RadarDimension } from '~/utils/roadmaps'
import { defineAsyncComponent, hydrateOnVisible } from 'vue'
import SkillAssessmentGuidanceCard from '~/components/roadmaps/SkillAssessmentGuidanceCard.vue'
import SkillAssessmentQuestionPanel from '~/components/roadmaps/SkillAssessmentQuestionPanel.vue'
import { getErrorMessage } from '~/utils/api'
import { useQuestionI18n } from '~/composables/useQuestionI18n'
import type {
  ApiError,
  AssessmentSession,
  ResourceLink,
  RoadmapTopic,
  SkillAssessmentCatalogDimension,
  SkillAssessmentCatalogQuestion,
  SkillAssessmentScaleOption,
} from '~~/shared/types/assessment'

const RoadmapCompletedOverview = defineAsyncComponent({
  loader: () => import('~/components/roadmaps/RoadmapCompletedOverview.vue'),
  hydrate: hydrateOnVisible(),
})
const RoadmapFitProfileSection = defineAsyncComponent({
  loader: () => import('~/components/roadmaps/RoadmapFitProfileSection.vue'),
  hydrate: hydrateOnVisible(),
})
const RoadmapLearningSequence = defineAsyncComponent({
  loader: () => import('~/components/roadmaps/RoadmapLearningSequence.vue'),
  hydrate: hydrateOnVisible(),
})

const route = useRoute('/roadmaps/[sessionId]')
const sessionId = computed(() => route.params.sessionId as string)
const { getResults, getHistory } = useAssessmentResults()
const {
  getSkillAssessmentCatalog,
  getSkillAssessmentState,
  getSkillAssessmentNextQuestion,
  saveSkillAssessmentState,
} = useSkillAssessmentApiClient()
const toast = useToast()
const { getSession } = useAssessmentSession()
const prefersReduced = useReducedMotion()
const AUTO_ADVANCE_DELAY_MS = 220
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

const { data: _skillAssessmentData, refresh } = await useAsyncData(
  `skill-assessment-${sessionId.value}`,
  async () => {
    const session = await getSession(sessionId.value).catch(
      () => null as AssessmentSession | null,
    )

    // A session started from a known role never ran role discovery, so the
    // results and history endpoints answer 409 for it. The browser logs every
    // 4xx at the network layer even when the promise is caught, so skip the
    // calls outright instead of catching the error afterwards.
    const hasRoleDiscoveryResult = session?.phase === 'recommendation_ready'

    const assessmentResult = hasRoleDiscoveryResult
      ? await getResults(sessionId.value).catch((error) => {
          if ((error as ApiError).statusCode === 409) {
            return null
          }
          throw error
        })
      : null

    const [result, history, skillAssessmentCatalog, skillAssessmentState] = await Promise.all(
      [
        Promise.resolve(assessmentResult),
        hasRoleDiscoveryResult
          ? getHistory(sessionId.value).catch(() => null)
          : Promise.resolve(null),
        getSkillAssessmentCatalog(sessionId.value),
        getSkillAssessmentState(sessionId.value).catch(() => ({
          completed: false,
          answers: {},
          completed_at: null,
        })),
      ],
    )
    let initialQuestionId: string | null = null
    if (!skillAssessmentState.completed) {
      const questions = buildSkillAssessmentQuestions(skillAssessmentCatalog?.questions)
      const answers = { ...(skillAssessmentState.answers ?? {}) }
      const unanswered = getUnansweredQuestions(questions, answers)

      if (unanswered.length) {
        try {
          const response = await getSkillAssessmentNextQuestion(
            sessionId.value,
            answers,
          )
          initialQuestionId = response.next_question?.id ?? null
        } catch {
          const scaleValues = (skillAssessmentCatalog?.scale ?? []).map(
            (option: SkillAssessmentScaleOption) => option.value,
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
      skillAssessmentCatalog,
      skillAssessmentState,
      initialQuestionId,
    }
  },
)

const _skillAssessmentSnapshot = _skillAssessmentData.value ?? {
  session: null,
  result: null,
  history: null,
  skillAssessmentCatalog: null,
  skillAssessmentState: null,
  initialQuestionId: null,
}
const skillAssessmentCatalog = _skillAssessmentSnapshot.skillAssessmentCatalog
const result = computed(
  () => _skillAssessmentData.value?.result ?? _skillAssessmentSnapshot.result,
)
const session = _skillAssessmentSnapshot.session
const history = _skillAssessmentSnapshot.history
const skillAssessmentState = _skillAssessmentSnapshot.skillAssessmentState
seedLastSessionState(session, skillAssessmentState?.completed === true)
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
const skillAssessmentRoleTitle = computed(
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

  return (skillAssessmentCatalog?.dimensions ?? []).map(
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

const isSkillAssessmentComplete = ref(skillAssessmentState?.completed)

type SkillAssessmentQuestion = {
  id: string
  prompt: string
  translations?: SkillAssessmentCatalogQuestion['translations']
  dimensionKey: string
}

const skillAssessmentQuestions: SkillAssessmentQuestion[] = buildSkillAssessmentQuestions(
  skillAssessmentCatalog?.questions,
)

const answerScale = skillAssessmentCatalog?.scale ?? []
const answerScaleValues = answerScale.map(
  (option: SkillAssessmentScaleOption) => option.value,
)
const answerScaleMin = answerScaleValues.length
  ? Math.min(...answerScaleValues)
  : 1
const answerScaleMax = answerScaleValues.length
  ? Math.max(...answerScaleValues)
  : 5

const skillAssessmentAnswers = ref<Record<string, number>>({
  ...(skillAssessmentState?.answers ?? {}),
})
const currentQuestionIndex = ref(0)
const isSavingSkillAssessment = ref(false)
const isAutoAdvancing = ref(false)

const hasAnsweredAll = computed(() => {
  return skillAssessmentQuestions.every((question) =>
    Number.isFinite(skillAssessmentAnswers.value[question.id]),
  )
})

const activeQuestion = computed(
  () => skillAssessmentQuestions[currentQuestionIndex.value] ?? null,
)

const activeQuestionRef = computed(() => activeQuestion.value)
const { localizedPrompt } = useQuestionI18n(() => activeQuestionRef.value)

const activeQuestionAnswer = computed(() => {
  if (!activeQuestion.value) {
    return null
  }

  return skillAssessmentAnswers.value[activeQuestion.value.id] ?? null
})

const catalogByKey = computed(
  () =>
    new Map<string, SkillAssessmentCatalogDimension>(
      (skillAssessmentCatalog?.dimensions ?? []).map(
        (item: SkillAssessmentCatalogDimension) => [item.key, item],
      ),
    ),
)

const { blendedDimensions, pickNextQuestionWithRl } = useSkillAssessmentQuestions(
  computed(() => sessionId.value),
  computed(() => skillAssessmentQuestions),
  skillAssessmentAnswers,
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

  const nextIndex = skillAssessmentQuestions.findIndex(
    (question) => question.id === questionId,
  )
  currentQuestionIndex.value = nextIndex === -1 ? 0 : nextIndex
}

if (!skillAssessmentState?.completed) {
  setCurrentQuestionById(_skillAssessmentSnapshot.initialQuestionId ?? null)
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

const { getRoleRoadmap } = useCatalogApi()

/**
 * The role's roadmap now comes from our own backend, which imports the
 * roadmap.sh graph as master data (already ordered so a prerequisite precedes
 * what it unlocks). The page used to fetch that graph from
 * raw.githubusercontent.com in the browser and fail silently offline, which
 * dropped the sequence from a full roadmap back to a handful of curated topics.
 * A role with no imported snapshot returns an empty list and the page falls
 * back to the curated topics exactly as before.
 */
async function loadRoleRoadmap(slug: string): Promise<RoadmapTopic[]> {
  try {
    const roadmap = await getRoleRoadmap(slug)
    return roadmap.external_topics.map((topic, index) => ({
      id: -(index + 30),
      slug: topic.slug,
      title: topic.title,
      description: undefined,
      difficulty: 0,
      display_order: topic.display_order,
      parent_id: null,
      prerequisites: [],
      topic_group: topic.topic_group,
      prerequisite_titles: topic.prerequisite_titles,
      subtopic_titles: topic.subtopic_titles,
      follow_on_titles: topic.follow_on_titles,
    }))
  } catch {
    return []
  }
}

// Client-only: the roadmap is supplementary to the server-rendered session data
// and lands in a plain ref, so an SSR fetch would be discarded anyway.
if (import.meta.client) {
  watch(
    currentRoleSlug,
    async (slug) => {
      if (slug) {
        roadmapShTopics.value = await loadRoleRoadmap(slug)
      }
    },
    { immediate: true },
  )
}

const STRENGTH_THRESHOLD = 0.7
const GAP_THRESHOLD = 0.5

const recalculatedStrengths = computed(() => {
  const above = sortedDimensionsDesc.value.filter(
    (d) => d.value >= STRENGTH_THRESHOLD,
  )
  if (above.length > 0) return above.map((item) => item.label)
  return sortedDimensionsDesc.value.slice(0, 1).map((item) => item.label)
})

const recalculatedGrowthAreas = computed(() => {
  const below = sortedDimensionsDesc.value.filter(
    (d) => d.value < GAP_THRESHOLD,
  )
  if (below.length > 0) return below.map((item) => item.label)
  return sortedDimensionsDesc.value.slice(-1).map((item) => item.label)
})

const overallCapabilityScore = computed(() => {
  if (!blendedDimensions.value.length) return 0
  const total = blendedDimensions.value.reduce(
    (sum: number, dimension: RadarDimension) => sum + dimension.value,
    0,
  )
  return Math.round((total / blendedDimensions.value.length) * 100)
})

const DIMENSION_KEYWORDS: Record<string, string[]> = {
  'psp-planning': ['planning', 'estimation'],
  'psp-quality': ['quality', 'defect', 'review'],
  'sdlc-requirements': ['requirement', 'analysis'],
  'sdlc-design': ['design', 'architecture'],
  'sdlc-development': ['coding', 'development', 'implementation'],
  'sdlc-testing': ['testing', 'qa'],
  'sdlc-deployment': ['deploy', 'release', 'delivery'],
  'sdlc-maintenance': ['maintenance', 'support', 'operations'],
}

const skillAssessmentPrioritizedTopics = computed(() => {
  if (!displayTopics.value.length) return []

  const bottomKeys = new Set(
    [...sortedDimensionsDesc.value]
      .reverse()
      .slice(0, recalculatedGrowthAreas.value.length)
      .map((d) => d.key),
  )

  const weakKeywords = new Set<string>()
  for (const key of bottomKeys) {
    for (const kw of DIMENSION_KEYWORDS[key] ?? []) {
      weakKeywords.add(kw)
    }
  }

  const matching: RoadmapTopic[] = []
  const rest: RoadmapTopic[] = []
  for (const topic of displayTopics.value) {
    const text = `${topic.title} ${topic.slug ?? ''}`.toLowerCase()
    if ([...weakKeywords].some((kw) => text.includes(kw))) {
      matching.push(topic)
    } else {
      rest.push(topic)
    }
  }
  return [...matching, ...rest]
})

const skillAssessmentProgressPercent = computed(() => {
  if (!skillAssessmentQuestions.length) return 0
  if (isSkillAssessmentComplete.value) return 100
  const answeredCount = skillAssessmentQuestions.filter((question) =>
    Number.isFinite(skillAssessmentAnswers.value[question.id]),
  ).length
  return Math.round((answeredCount / skillAssessmentQuestions.length) * 100)
})

const answeredPromptCount = computed(() => {
  return skillAssessmentQuestions.filter((question) =>
    Number.isFinite(skillAssessmentAnswers.value[question.id]),
  ).length
})

const selectedScaleOption = computed(() => {
  if (!Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)) {
    return null
  }

  return (
    answerScale.find(
      (option: SkillAssessmentScaleOption) =>
        option.value === activeQuestionAnswer.value,
    ) ?? null
  )
})

const skillAssessmentGuidanceTitle = computed(() => {
  return preferredRoleName.value
    ? `${preferredRoleName.value} track`
    : 'Skill calibration'
})

const skillAssessmentProgressSummary = computed(() => {
  const calibrationState = hasAnsweredAll.value
    ? t.value.readyToReview
    : answeredPromptCount.value
      ? t.value.buildingConfidence
      : t.value.stillCalibrating
  const progressState = isSavingSkillAssessment.value
    ? t.value.saving
    : t.value.inProgress

  return `Q${answeredPromptCount.value} ${t.value.answered} • ${calibrationState} • ${progressState}`
})

const skillAssessmentMicrocopy = computed(() => {
  if (isSavingSkillAssessment.value) {
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

const skillAssessmentPromptContext = computed(() => {
  if (!activeQuestion.value) {
    return t.value.preparingPrompt
  }

  return t.value.promptContext
})

/**
 * Used only for a role whose roadmap has not been imported, so no per-topic
 * target can be derived. Every other role's target comes from its own roadmap:
 * a topic that unlocks others has to be held more firmly than a terminal one.
 */
const FALLBACK_TARGET_READINESS_SCORE = 78

const skillAssessmentReadiness = computed(
  () => skillAssessmentState?.readiness ?? null,
)

/** Per-axis target, keyed by dimension so the radar can plot the role's shape. */
const targetByDimension = computed<Record<string, number>>(() => {
  const targets = skillAssessmentReadiness.value?.targets ?? {}
  const map: Record<string, number> = {}
  for (const question of skillAssessmentCatalog?.questions ?? []) {
    const slug = question.topic_slug
    if (slug && targets[slug] !== undefined) {
      map[question.dimension_key] = targets[slug]
    }
  }
  return map
})

const targetReadinessScore = computed(() => {
  const overall = skillAssessmentReadiness.value?.overall_target
  return overall ? Math.round(overall * 100) : FALLBACK_TARGET_READINESS_SCORE
})

const capabilityGap = computed(() =>
  Math.max(0, targetReadinessScore.value - overallCapabilityScore.value),
)

const isAtTarget = computed(
  () => overallCapabilityScore.value >= targetReadinessScore.value,
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

// Client-only: per-topic resource links come from external roadmap.sh data
// (see the currentRoleSlug watch above) and are only rendered after hydration.
if (import.meta.client) {
  watch(
    () => displayTopics.value,
    (topics) => {
      for (const t of topics) {
        loadTopicResources(t.id, t.title)
      }
    },
    { immediate: true },
  )
}

const personalityFitNarrative = computed(() => {
  const roleName = skillAssessmentRoleTitle.value
  const topThree = topPersonalityPillars.value.slice(0, 3)
  const labels = topThree.map((p) => cleanPillarLabel(p.label))

  const pillarSummary =
    topThree.length >= 2
      ? isThai.value
        ? `โปรไฟล์ของคุณเน้นไปที่ "${labels[0]}" โดยมี "${labels[1]}" เป็นองค์ประกอบเสริม`
        : `Your profile leans most on "${labels[0]}", complemented by "${labels[1]}"`
      : topThree.length === 1
        ? isThai.value
          ? `โปรไฟล์ของคุณถูกขับเคลื่อนโดย "${labels[0]}" เป็นหลัก`
          : `Your profile is primarily driven by "${labels[0]}"`
        : isThai.value
          ? 'ยังไม่มีข้อมูลบุคลิกภาพที่เพียงพอ'
          : 'Not enough personality data yet.'

  const alignmentContext =
    result.value?.role_alignment_status === 'aligned'
      ? isThai.value
        ? `รูปแบบนี้สอดคล้องกับทิศทางของ ${roleName} — จุดแข็งตามธรรมชาติของคุณตรงกับสิ่งที่บทบาทนี้ต้องการ`
        : `This pattern aligns with the ${roleName} direction — your natural tendencies match what this role typically demands.`
      : isThai.value
        ? `รูปแบบนี้ยังมีจุดที่แตกต่างจากทิศทางของ ${roleName} — ใช้ข้อมูลนี้เป็นแนวทางในการปรับทิศทางการพัฒนา`
        : `This pattern has some differences from the ${roleName} direction — use this as a guide for where to focus your growth.`

  const guidanceSummary =
    result.value?.role_alignment_status === 'aligned'
      ? isThai.value
        ? 'เสริมจุดแข็งที่มีอยู่แล้วโดยต่อยอดจากเสาหลักที่โดดเด่น และใช้เสาหลักที่ต่ำกว่าเป็นพื้นที่พัฒนาใหม่'
        : 'Build on existing momentum by doubling down on your strongest pillars while using lower ones as deliberate growth areas.'
      : isThai.value
        ? 'ลองสำรวจว่าเสาหลักที่สูงของคุณสามารถปรับใช้กับบทบาทนี้ได้หรือไม่ หรือลองพิจารณาบทบาทอื่นที่สอดคล้องกับธรรมชาติของคุณมากกว่า'
        : 'Explore whether your higher pillars could be applied to this direction, or consider other roles that may better fit your natural style.'

  return `${pillarSummary}. ${alignmentContext} ${guidanceSummary}`
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
  sortedDimensionsDesc.value.slice(0, 4).map((dimension) => {
    const cat = catalogByKey.value.get(dimension.key)
    return {
      ...dimension,
      percent: Math.round(dimension.value * 100),
      description: isThai.value
        ? (cat?.translations?.th?.low_score_action ?? 'คงไว้ซึ่งจุดแข็ง')
        : (cat?.low_score_action ?? 'Consistent strength'),
    }
  }),
)

const personalityFitRaw = computed(() => {
  if (!personalityPillars.value.length) return 0
  return Math.max(
    ...personalityPillars.value.map((p: PillarInsight) => p.normalized_score),
  )
})

async function submitSkillAssessment() {
  if (!hasAnsweredAll.value) {
    return
  }

  isSavingSkillAssessment.value = true

  try {
    const savePromise = saveSkillAssessmentState(sessionId.value, {
      completed: true,
      answers: { ...skillAssessmentAnswers.value },
      completed_at: new Date().toISOString(),
    })
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error('Save timeout')), 15000)
    })
    const saved = await Promise.race([savePromise, timeoutPromise])

    skillAssessmentAnswers.value = { ...saved.answers }
    isSkillAssessmentComplete.value = saved.completed
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Could not save Skill Assessment',
      description:
        error instanceof Error && error.message === 'Save timeout'
          ? 'Saving took too long. Please try again.'
          : (getErrorMessage(error as ApiError) ?? undefined),
      color: 'error',
    })
  } finally {
    isSavingSkillAssessment.value = false
  }
}

function selectAnswer(value: number) {
  if (
    !activeQuestion.value ||
    isSavingSkillAssessment.value ||
    isAutoAdvancing.value
  ) {
    return
  }

  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
  }

  skillAssessmentAnswers.value[activeQuestion.value.id] = value
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

  void submitSkillAssessment()
}


onBeforeUnmount(() => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
  }
})

useSeoMeta({
  title: computed(() =>
    isThai.value ? 'CompetencyX | แผนเส้นทางพัฒนา' : 'CompetencyX | Roadmaps',
  ),
  description: computed(() =>
    isThai.value
      ? 'การวิเคราะห์ความสามารถด้าน PSP และ SDLC พร้อมแผนเส้นทางเฉพาะบุคคลจากคำตอบของแบบสำรวจแรก'
      : 'PSP and SDLC capability analysis with a personalized roadmap based on your role discovery results.',
  ),
})
</script>

<template>
  <main
    id="main-content"
    :class="['page-wrap', !isSkillAssessmentComplete ? 'skill-assessment-assessment-page' : '']"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        v-if="hasRoleAnswers"
        :to="`/results/${route.params.sessionId}`"
        class="editorial-link text-sm"
      >
        {{ t.backToRoleDiscovery }}
      </NuxtLink>
      <p class="text-sm text-ink-soft">
        {{ t.session }} {{ route.params.sessionId }}
      </p>
    </div>

    <section v-if="isSkillAssessmentComplete" class="glass-panel mt-6 p-6 md:p-8">
      <p class="eyebrow">
        {{ isSkillAssessmentComplete ? t.finalDashboard : t.skillAssessmentTitle }}
      </p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{
          isSkillAssessmentComplete
            ? `${skillAssessmentRoleTitle} ${t.readinessRoadmap}`
            : t.calibrateSkills
        }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
        {{ isSkillAssessmentComplete ? t.completeIntro : t.incompleteIntro }}
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
      v-if="!isSkillAssessmentComplete"
      class="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start"
      aria-live="polite"
    >
      <aside class="lg:sticky lg:top-8">
        <SkillAssessmentGuidanceCard
          :title="skillAssessmentGuidanceTitle"
          :progress-summary="skillAssessmentProgressSummary"
          :progress-percent="skillAssessmentProgressPercent"
          :prompt-context="skillAssessmentPromptContext"
          :preferred-role-name="preferredRoleName"
        />
      </aside>

      <SkillAssessmentQuestionPanel
        :question="activeQuestion"
        :prompt="localizedPrompt || activeQuestion?.prompt || ''"
        :prompt-context="skillAssessmentPromptContext"
        :microcopy="skillAssessmentMicrocopy"
        :answer-scale="answerScale"
        :selected-value="activeQuestionAnswer"
        :is-saving="isSavingSkillAssessment"
        :is-auto-advancing="isAutoAdvancing"
        :is-first-question="currentQuestionIndex === 0"
        :is-thai="isThai"
        :prefers-reduced="prefersReduced ?? false"
        @select="selectAnswer"
        @previous="goToPreviousQuestion"
      />
    </section>

    <template v-if="isSkillAssessmentComplete">
      <RoadmapCompletedOverview
        :role-title="skillAssessmentRoleTitle"
        :overall-capability-score="overallCapabilityScore"
        :recalculated-strengths="recalculatedStrengths"
        :recalculated-growth-areas="recalculatedGrowthAreas"
        :strongest-dimension-cards="strongestDimensionCards"
        :target-score="targetReadinessScore"
        :target-by-dimension="targetByDimension"
        :is-at-target="isAtTarget"
        :capability-gap="capabilityGap"
        :display-topics="displayTopics"
        :priority-topics="skillAssessmentPrioritizedTopics"
        :blended-dimensions="blendedDimensions"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <RoadmapFitProfileSection
        :overall-capability-score="overallCapabilityScore"
        :track-highlights="trackHighlights"
        :strongest-dimension-cards="strongestDimensionCards"
        :top-personality-pillars="topPersonalityPillars"
        :personality-fit-raw="personalityFitRaw"
        :personality-fit-narrative="personalityFitNarrative"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <RoadmapLearningSequence
        :topics="displayTopics"
        :topic-resources="topicResources"
        :is-thai="isThai"
        :role-title="skillAssessmentRoleTitle"
      />

    </template>
  </main>
</template>
