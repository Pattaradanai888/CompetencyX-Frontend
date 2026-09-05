<script setup lang="ts">
import { defineAsyncComponent, hydrateOnVisible } from 'vue'
import SkillAssessmentGuidanceCard from '~/components/roadmaps/SkillAssessmentGuidanceCard.vue'
import SkillAssessmentQuestionPanel from '~/components/roadmaps/SkillAssessmentQuestionPanel.vue'
import RoadmapNextTopics from '~/components/roadmaps/RoadmapNextTopics.vue'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useHeldTopicMarking } from '~/composables/useHeldTopicMarking'
import { seedLastSessionState } from '~/composables/useLastSession'
import { useLocale } from '~/composables/useLocale'
import { useQuestionI18n } from '~/composables/useQuestionI18n'
import { useSkillAssessmentApiClient } from '~/composables/useSkillAssessmentApiClient'
import {
  buildSkillAssessmentQuestions,
  useSkillAssessmentQuestions,
} from '~/composables/useSkillAssessmentQuestions'
import { getErrorMessage } from '~/utils/api'
import { getPillarLabel, getRoleDisplayName } from '~/utils/assessment'
import { AUTO_ADVANCE_DELAY_MS } from '~/utils/constants'
import {
  buildRadarDimensions,
  cleanPillarLabel,
  getRoadmapScaleLabel,
  getTopicEntryTitle,
} from '~/utils/roadmaps'
import type { DimensionCard, RadarDimension } from '~/utils/roadmaps'
import { fetchTopicResources, getRoadmapSlug } from '~/utils/roadmapTopics'
import type {
  ApiError,
  AssessmentSession,
  ResourceLink,
  RoadmapTopic,
  SkillAssessmentProgress,
  SkillAssessmentScaleOption,
  SkillAssessmentSessionState,
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
const { getResults } = useAssessmentResults()
const { getSession } = useAssessmentSession()
const {
  getSkillAssessmentCatalog,
  getSkillAssessmentState,
  getSkillAssessmentNextQuestion,
  saveSkillAssessmentState,
} = useSkillAssessmentApiClient()
const { getRoleRoadmap } = useCatalogApi()
const toast = useToast()
const prefersReduced = useReducedMotion()

function emptySkillState(): SkillAssessmentSessionState {
  return { completed: false, answers: {}, completed_at: null }
}

/**
 * Everything the page needs in one round: the session, the role-discovery
 * result when there is one, the Skill Assessment catalog and state, and --
 * for an unfinished assessment -- the backend's decision about which item
 * to ask first (ADR-0005). The answer history is not fetched: nothing on
 * this page is derived from it any more.
 */
const { data, refresh } = await useAsyncData(
  `skill-assessment-${sessionId.value}`,
  async () => {
    const session = await getSession(sessionId.value).catch(
      () => null as AssessmentSession | null,
    )

    // A session started from a known role never ran role discovery, so the
    // results endpoint answers 409 for it. The browser logs every 4xx at the
    // network layer even when the promise is caught, so skip the call.
    const hasRoleDiscoveryResult = session?.phase === 'recommendation_ready'

    const [result, catalog, state] = await Promise.all([
      hasRoleDiscoveryResult
        ? getResults(sessionId.value).catch(() => null)
        : Promise.resolve(null),
      getSkillAssessmentCatalog(sessionId.value).catch(() => null),
      getSkillAssessmentState(sessionId.value).catch(() => emptySkillState()),
    ])

    let initialQuestionId: string | null = null
    let initialProgress: SkillAssessmentProgress | null = state.progress ?? null
    let submitOnMount = false
    if (!state.completed) {
      try {
        const response = await getSkillAssessmentNextQuestion(
          sessionId.value,
          state.answers ?? {},
        )
        initialQuestionId = response.next_question?.id ?? null
        initialProgress = response.progress ?? initialProgress
        // Saved answers and nothing further to ask: the assessment should
        // already have been completed, so it is completed now.
        submitOnMount =
          initialQuestionId === null &&
          Object.keys(state.answers ?? {}).length > 0
      } catch {
        // The panel shows that the next item is still being resolved; the
        // first answer retries. The page never picks an item of its own.
      }
    }

    return {
      session,
      result,
      catalog,
      state,
      initialQuestionId,
      initialProgress,
      submitOnMount,
    }
  },
)

const session = computed(() => data.value?.session ?? null)
const result = computed(() => data.value?.result ?? null)
const catalog = data.value?.catalog ?? null

/**
 * The live copy of the skill-assessment state. Submitting refetches it, and
 * marking or unmarking a Held Topic replaces it with the backend's recomputed
 * response, so the suggestions react without a page reload.
 */
const liveSkillState = ref<SkillAssessmentSessionState>(
  data.value?.state ?? emptySkillState(),
)
const skillAssessmentAnswers = ref<Record<string, number>>({
  ...(data.value?.state.answers ?? {}),
})
const isSkillAssessmentComplete = ref(data.value?.state.completed ?? false)
const progress = ref<SkillAssessmentProgress | null>(
  data.value?.initialProgress ?? null,
)

/**
 * The snapshot above is taken once. `refresh()` replaces the fetched data
 * after the assessment is submitted, so everything derived from it follows
 * the refetched state -- otherwise the finished page would render from the
 * empty answer set captured on load.
 */
watch(
  () => data.value?.state,
  (state) => {
    if (!state) return
    liveSkillState.value = state
    skillAssessmentAnswers.value = { ...(state.answers ?? {}) }
    isSkillAssessmentComplete.value = state.completed
    if (state.progress) progress.value = state.progress
    // The header's resume label reads this; keep it in step after submit.
    seedLastSessionState(session.value, state.completed)
  },
)

seedLastSessionState(session.value, data.value?.state.completed === true)

const { isThai: globalIsThai, localeInitialized } = useLocale()
const isThai = computed(() => {
  if (localeInitialized.value) return globalIsThai.value
  return session.value?.language === 'th'
})
const t = usePageI18n('roadmaps', isThai)

// ---------------------------------------------------------------------------
// Role and role-discovery context
// ---------------------------------------------------------------------------

const hasRoleAnswers = computed(
  () => (session.value?.milestones?.answered_role_questions ?? 0) > 0,
)

const preferredRole = computed(
  () => result.value?.preferred_role ?? session.value?.preferred_role ?? null,
)
const bestFitRole = computed(
  () => result.value?.best_fit_role ?? session.value?.best_fit_role ?? null,
)
const preferredRoleName = computed(() =>
  preferredRole.value
    ? getRoleDisplayName(preferredRole.value, isThai.value)
    : null,
)
const bestFitRoleName = computed(() =>
  bestFitRole.value
    ? getRoleDisplayName(bestFitRole.value, isThai.value)
    : null,
)
const skillAssessmentRoleTitle = computed(
  () =>
    bestFitRoleName.value ??
    preferredRoleName.value ??
    (isThai.value ? 'บทบาทซอฟต์แวร์' : 'Software role'),
)
const currentRoleSlug = computed(
  () =>
    result.value?.preferred_role?.slug ??
    session.value?.preferred_role?.slug ??
    result.value?.ranked_roles?.[0]?.slug ??
    null,
)

// ---------------------------------------------------------------------------
// The questionnaire: one item at a time, the backend deciding which
// ---------------------------------------------------------------------------

const skillAssessmentQuestions = buildSkillAssessmentQuestions(
  catalog?.questions,
)
const answerScale = catalog?.scale ?? []

const { requestNextQuestion } = useSkillAssessmentQuestions(
  sessionId,
  computed(() => skillAssessmentQuestions),
  skillAssessmentAnswers,
)

const currentQuestionId = ref<string | null>(
  data.value?.initialQuestionId ?? null,
)
/** The items asked so far, so "previous" walks back the order actually asked. */
const askedQuestionIds = ref<string[]>([])
const isSavingSkillAssessment = ref(false)
const isAutoAdvancing = ref(false)
const isResolvingNextQuestion = ref(false)
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

const activeQuestion = computed(
  () =>
    skillAssessmentQuestions.find(
      (question) => question.id === currentQuestionId.value,
    ) ?? null,
)
const { localizedPrompt } = useQuestionI18n(() => activeQuestion.value)

const activeQuestionAnswer = computed(() => {
  if (!activeQuestion.value) return null
  return skillAssessmentAnswers.value[activeQuestion.value.id] ?? null
})

const answeredCount = computed(
  () =>
    progress.value?.answered ??
    Object.keys(skillAssessmentAnswers.value).length,
)
/** The most that can be asked, from the backend; the catalog size until it says. */
const questionCeiling = computed(
  () => progress.value?.ceiling ?? skillAssessmentQuestions.length,
)

const skillAssessmentProgressPercent = computed(() => {
  if (isSkillAssessmentComplete.value) return 100
  if (!questionCeiling.value) return 0
  return Math.min(
    100,
    Math.round((answeredCount.value / questionCeiling.value) * 100),
  )
})

const selectedScaleOption = computed(() => {
  if (!Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)) return null
  return (
    answerScale.find(
      (option: SkillAssessmentScaleOption) =>
        option.value === activeQuestionAnswer.value,
    ) ?? null
  )
})

const skillAssessmentGuidanceTitle = computed(() =>
  preferredRoleName.value
    ? t.value.roleTrack.replace('{role}', preferredRoleName.value)
    : t.value.skillCalibration,
)

const skillAssessmentProgressSummary = computed(() => {
  const calibrationState = progress.value?.settled
    ? t.value.readyToReview
    : answeredCount.value
      ? t.value.buildingConfidence
      : t.value.stillCalibrating
  const progressState = isSavingSkillAssessment.value
    ? t.value.saving
    : t.value.inProgress

  return `${answeredCount.value} ${t.value.answered} ${t.value.answeredOfUpTo} ${questionCeiling.value} • ${calibrationState} • ${progressState}`
})

const skillAssessmentMicrocopy = computed(() => {
  if (isSavingSkillAssessment.value) return t.value.savingSignal
  if (
    (isAutoAdvancing.value || isResolvingNextQuestion.value) &&
    selectedScaleOption.value
  ) {
    return `${getRoadmapScaleLabel(selectedScaleOption.value, isThai.value)}. ${t.value.movingNext}`
  }
  if (selectedScaleOption.value) {
    return `${getRoadmapScaleLabel(selectedScaleOption.value, isThai.value)}.`
  }
  return t.value.selectOne
})

const skillAssessmentPromptContext = computed(() =>
  activeQuestion.value ? t.value.promptContext : t.value.preparingPrompt,
)

async function submitSkillAssessment() {
  isSavingSkillAssessment.value = true
  try {
    const savePromise = saveSkillAssessmentState(sessionId.value, {
      completed: true,
      answers: { ...skillAssessmentAnswers.value },
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
      title: t.value.saveErrorTitle,
      description:
        error instanceof Error && error.message === 'Save timeout'
          ? t.value.saveTimeoutMessage
          : (getErrorMessage(error as ApiError) ?? undefined),
      color: 'error',
    })
  } finally {
    isSavingSkillAssessment.value = false
  }
}

/**
 * Ask the backend what comes next, with every answer held. A `null` item is
 * the stop signal: the answers are submitted as they stand, however many
 * items remain unasked (ADR-0005). A failed request is reported and leaves
 * the current item on screen; the next answer asks again.
 */
async function goToNextQuestion() {
  if (
    !activeQuestion.value ||
    !Number.isFinite(activeQuestionAnswer.value ?? Number.NaN)
  ) {
    return
  }

  isResolvingNextQuestion.value = true
  try {
    const decision = await requestNextQuestion()
    if (decision.progress) progress.value = decision.progress
    if (decision.question) {
      askedQuestionIds.value = [
        ...askedQuestionIds.value,
        activeQuestion.value.id,
      ]
      currentQuestionId.value = decision.question.id
      return
    }
    await submitSkillAssessment()
  } catch (error) {
    toast.add({
      title: t.value.nextQuestionErrorTitle,
      description:
        getErrorMessage(error as ApiError) ?? t.value.nextQuestionErrorHint,
      color: 'error',
    })
  } finally {
    isResolvingNextQuestion.value = false
  }
}

function selectAnswer(value: number) {
  if (
    !activeQuestion.value ||
    isSavingSkillAssessment.value ||
    isAutoAdvancing.value ||
    isResolvingNextQuestion.value
  ) {
    return
  }

  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)

  skillAssessmentAnswers.value = {
    ...skillAssessmentAnswers.value,
    [activeQuestion.value.id]: value,
  }
  isAutoAdvancing.value = true

  autoAdvanceTimer = setTimeout(() => {
    isAutoAdvancing.value = false
    autoAdvanceTimer = null
    void goToNextQuestion()
  }, AUTO_ADVANCE_DELAY_MS)
}

function goToPreviousQuestion() {
  const previous = askedQuestionIds.value.at(-1)
  if (!previous) return
  askedQuestionIds.value = askedQuestionIds.value.slice(0, -1)
  currentQuestionId.value = previous
}

if (data.value?.submitOnMount) {
  onMounted(() => {
    void submitSkillAssessment()
  })
}

onBeforeUnmount(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})

// ---------------------------------------------------------------------------
// The finished view: what the backend reports about the rated sets
// ---------------------------------------------------------------------------

const topicStates = computed(() => liveSkillState.value.topic_states ?? [])
/** The next three to five topics, in the order the API returned them. */
const suggestedTopics = computed(() => liveSkillState.value.next_topics ?? [])
const readiness = computed(() => liveSkillState.value.readiness ?? null)

/** One axis per rated set; a set nobody asked about is not plotted (ADR-0003). */
const dimensions = computed<RadarDimension[]>(() =>
  buildRadarDimensions(topicStates.value, isThai.value),
)
const assessedDimensionsDesc = computed(() =>
  [...dimensions.value].sort((left, right) => right.value - left.value),
)

/** Per-axis target keyed by set key, so the radar can plot the role's shape. */
const targetByDimension = computed<Record<string, number>>(
  () => readiness.value?.targets ?? {},
)

const overallCapabilityScore = computed(() =>
  Math.round((readiness.value?.overall_mastery ?? 0) * 100),
)

/**
 * The role's own target from its roadmap. There is no flat fallback: a role
 * with no readiness data is shown without a To-Be comparison rather than
 * against an invented constant.
 */
const targetReadinessScore = computed<number | null>(() => {
  const overall = readiness.value?.overall_target
  return overall ? Math.round(overall * 100) : null
})

const capabilityGap = computed<number | null>(() =>
  targetReadinessScore.value === null
    ? null
    : Math.max(0, targetReadinessScore.value - overallCapabilityScore.value),
)

const isAtTarget = computed(
  () =>
    targetReadinessScore.value !== null &&
    overallCapabilityScore.value >= targetReadinessScore.value,
)

const STRENGTH_THRESHOLD = 0.7
const GAP_THRESHOLD = 0.5
const MAX_STRENGTH_CARDS = 4

/**
 * One list behind both the strength count and the strength cards, so the
 * summary cannot say "1 area" while the cards below it list four.
 */
const strengthDimensions = computed(() => {
  if (!assessedDimensionsDesc.value.length) return []
  const above = assessedDimensionsDesc.value.filter(
    (dimension) => dimension.value >= STRENGTH_THRESHOLD,
  )
  const selected = above.length
    ? above
    : assessedDimensionsDesc.value.slice(0, 1)
  return selected.slice(0, MAX_STRENGTH_CARDS)
})

const recalculatedStrengths = computed(() =>
  strengthDimensions.value.map((item) => item.label),
)

const recalculatedGrowthAreas = computed(() => {
  if (!assessedDimensionsDesc.value.length) return []
  const below = assessedDimensionsDesc.value.filter(
    (dimension) => dimension.value < GAP_THRESHOLD,
  )
  if (below.length > 0) return below.map((item) => item.label)
  return assessedDimensionsDesc.value.slice(-1).map((item) => item.label)
})

/**
 * The strength cards are the strength list: same sets, same count. The blurb
 * says what the score is -- a set only reaches the cards as the relatively
 * strongest when nothing cleared the threshold, and calling that "a strength
 * to maintain" would overstate it.
 */
const strongestDimensionCards = computed<DimensionCard[]>(() =>
  strengthDimensions.value.map((dimension) => ({
    ...dimension,
    percent: Math.round(dimension.value * 100),
    description:
      dimension.value >= STRENGTH_THRESHOLD
        ? t.value.strengthHold
        : t.value.relativeStrength,
  })),
)

/** Whether the suggestions settled, or the assessment ended at the ceiling. */
const confidenceNote = computed<string | null>(() => {
  const confidence = liveSkillState.value.confidence
  if (confidence === 'high') return t.value.confidenceHigh
  if (confidence === 'low') return t.value.confidenceLow
  return null
})

const suggestedPriorityTopics = computed(() =>
  suggestedTopics.value.map((entry) => ({
    topic_slug: entry.topic_slug,
    topic_title: getTopicEntryTitle(entry, isThai.value),
  })),
)

const {
  canMarkHeld,
  busyTopicKey,
  heldEntries,
  markTopicHeld,
  unmarkTopicHeld,
} = useHeldTopicMarking(
  () => sessionId.value,
  liveSkillState,
  () => isThai.value,
)

// ---------------------------------------------------------------------------
// Personality (role discovery), shown only when the session ran it
// ---------------------------------------------------------------------------

const personalityPillars = computed(() => result.value?.pillar_profile ?? [])

const topPersonalityPillars = computed(() =>
  [...personalityPillars.value]
    .sort((left, right) => right.normalized_score - left.normalized_score)
    .slice(0, 4),
)

const personalityFitRaw = computed(() => {
  if (!personalityPillars.value.length) return 0
  return Math.max(
    ...personalityPillars.value.map((pillar) => pillar.normalized_score),
  )
})

const personalityFitNarrative = computed(() => {
  const roleName = skillAssessmentRoleTitle.value
  const labels = topPersonalityPillars.value
    .slice(0, 3)
    .map((pillar) => cleanPillarLabel(getPillarLabel(pillar, isThai.value)))

  const pillarSummary =
    labels.length >= 2
      ? isThai.value
        ? `โปรไฟล์ของคุณเน้นไปที่ "${labels[0]}" โดยมี "${labels[1]}" เป็นองค์ประกอบเสริม`
        : `Your profile leans most on "${labels[0]}", complemented by "${labels[1]}"`
      : labels.length === 1
        ? isThai.value
          ? `โปรไฟล์ของคุณถูกขับเคลื่อนโดย "${labels[0]}" เป็นหลัก`
          : `Your profile is primarily driven by "${labels[0]}"`
        : isThai.value
          ? 'ยังไม่มีข้อมูลบุคลิกภาพที่เพียงพอ'
          : 'Not enough personality data yet.'

  const aligned = result.value?.role_alignment_status === 'aligned'
  const alignmentContext = aligned
    ? isThai.value
      ? `รูปแบบนี้สอดคล้องกับทิศทางของ ${roleName} — จุดแข็งตามธรรมชาติของคุณตรงกับสิ่งที่บทบาทนี้ต้องการ`
      : `This pattern aligns with the ${roleName} direction — your natural tendencies match what this role typically demands.`
    : isThai.value
      ? `รูปแบบนี้ยังมีจุดที่แตกต่างจากทิศทางของ ${roleName} — ใช้ข้อมูลนี้เป็นแนวทางในการปรับทิศทางการพัฒนา`
      : `This pattern has some differences from the ${roleName} direction — use this as a guide for where to focus your growth.`

  const guidanceSummary = aligned
    ? isThai.value
      ? 'เสริมจุดแข็งที่มีอยู่แล้วโดยต่อยอดจากเสาหลักที่โดดเด่น และใช้เสาหลักที่ต่ำกว่าเป็นพื้นที่พัฒนาใหม่'
      : 'Build on existing momentum by doubling down on your strongest pillars while using lower ones as deliberate growth areas.'
    : isThai.value
      ? 'ลองสำรวจว่าเสาหลักที่สูงของคุณสามารถปรับใช้กับบทบาทนี้ได้หรือไม่ หรือลองพิจารณาบทบาทอื่นที่สอดคล้องกับธรรมชาติของคุณมากกว่า'
      : 'Explore whether your higher pillars could be applied to this direction, or consider other roles that may better fit your natural style.'

  return `${pillarSummary}. ${alignmentContext} ${guidanceSummary}`
})

// ---------------------------------------------------------------------------
// The full roadmap: the imported graph, marked by the slugs the API carries
// ---------------------------------------------------------------------------

const roadmapShTopics = ref<RoadmapTopic[]>([])

/**
 * The role's roadmap comes from our own backend, which imports the roadmap.sh
 * graph as master data (already ordered so a prerequisite precedes what it
 * unlocks). A role with no imported snapshot returns an empty list, and the
 * sequence falls back to the suggestions themselves.
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

// Client-only: the roadmap is supplementary to the server-rendered session
// data and lands in a plain ref, so an SSR fetch would be discarded anyway.
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

/** Roadmap nodes covered by a suggested next topic: the Priority tag. */
const suggestedNodeSlugs = computed(
  () =>
    new Set(suggestedTopics.value.flatMap((entry) => entry.node_slugs ?? [])),
)

/** Roadmap nodes covered by a held set, rated or marked: the held badge. */
const heldNodeSlugs = computed(
  () =>
    new Set(
      topicStates.value
        .filter((entry) => entry.state === 'held')
        .flatMap((entry) => entry.node_slugs ?? []),
    ),
)

const displayTopics = computed<RoadmapTopic[]>(() => {
  if (roadmapShTopics.value.length) {
    return roadmapShTopics.value.map((topic) => ({
      ...topic,
      is_gap: suggestedNodeSlugs.value.has(topic.slug),
    }))
  }
  // No imported roadmap for this role: the sequence is the suggestions
  // themselves, each of which is by definition a priority.
  return suggestedTopics.value.map((entry, index) => ({
    id: -(index + 1),
    slug: entry.topic_slug,
    title: getTopicEntryTitle(entry, isThai.value),
    description: undefined,
    difficulty: 0,
    display_order: index,
    parent_id: null,
    prerequisites: [],
    is_gap: true,
  }))
})

const heldDisplayTopicIds = computed<number[]>(() =>
  displayTopics.value
    .filter((topic) => heldNodeSlugs.value.has(topic.slug))
    .map((topic) => topic.id),
)

const topicResources = reactive(new Map<number, ResourceLink[]>())
const loadingResources = ref<Set<number>>(new Set())

async function loadTopicResources(topicId: number, topicTitle: string) {
  if (topicResources.has(topicId) || loadingResources.value.has(topicId)) return
  const slug = getRoadmapSlug(currentRoleSlug.value ?? '')
  if (!slug) return
  loadingResources.value = new Set([...loadingResources.value, topicId])
  const links = await fetchTopicResources(slug, topicTitle)
  if (links.length) {
    topicResources.set(topicId, links)
  }
  const next = new Set(loadingResources.value)
  next.delete(topicId)
  loadingResources.value = next
}

// Client-only: per-topic resource links come from the bundled index and are
// only rendered after hydration.
if (import.meta.client) {
  watch(
    displayTopics,
    (topics) => {
      for (const topic of topics) {
        void loadTopicResources(topic.id, topic.title)
      }
    },
    { immediate: true },
  )
}

/**
 * The full roadmap is one click away from the suggestions — it opens in place
 * rather than being what a finished respondent lands on.
 */
const showFullRoadmap = ref(false)
const fullRoadmapSection = ref<HTMLElement | null>(null)

function toggleFullRoadmap() {
  if (showFullRoadmap.value) {
    showFullRoadmap.value = false
    return
  }
  void openFullRoadmap()
}

async function openFullRoadmap() {
  showFullRoadmap.value = true
  await nextTick()
  fullRoadmapSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

useSeoMeta({
  // `app.vue` appends "| CompetencyX" through its titleTemplate, so the brand
  // is left off here rather than printed at both ends of the tab title.
  title: computed(() => (isThai.value ? 'แผนเส้นทางพัฒนา' : 'Roadmaps')),
  description: computed(() =>
    isThai.value
      ? 'ความพร้อมต่อบทบาทจากการประเมินทักษะ พร้อมหัวข้อที่ควรเรียนต่อไปและแผนเส้นทางเฉพาะบุคคล'
      : 'Role readiness from the skill assessment, with the topics to learn next and a personalised roadmap.',
  ),
})
</script>

<template>
  <main
    id="main-content"
    :class="[
      'page-wrap',
      !isSkillAssessmentComplete ? 'skill-assessment-assessment-page' : '',
    ]"
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

    <section
      v-if="isSkillAssessmentComplete"
      class="glass-panel mt-6 p-6 md:p-8"
    >
      <p class="eyebrow">{{ t.finalDashboard }}</p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{ skillAssessmentRoleTitle }} {{ t.readinessRoadmap }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
        {{ t.completeIntro }}
      </p>
      <p
        v-if="confidenceNote"
        data-testid="confidence-note"
        class="mt-3 max-w-3xl rounded-lg border border-blueprint/15 bg-blueprint/5 px-3 py-2 text-xs leading-6 text-blueprint/80"
      >
        {{ confidenceNote }}
      </p>
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span
          v-if="preferredRoleName"
          class="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink"
        >
          {{ t.knownRole }}: {{ preferredRoleName }}
        </span>
        <span
          v-if="bestFitRoleName"
          class="rounded-full border border-accent-soft bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-accent"
        >
          {{ t.discoveryResult }}: {{ bestFitRoleName }}
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
          :is-thai="isThai"
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
        :is-auto-advancing="isAutoAdvancing || isResolvingNextQuestion"
        :is-first-question="askedQuestionIds.length === 0"
        :is-thai="isThai"
        :prefers-reduced="prefersReduced ?? false"
        @select="selectAnswer"
        @previous="goToPreviousQuestion"
      />
    </section>

    <template v-if="isSkillAssessmentComplete">
      <RoadmapNextTopics
        :topics="suggestedTopics"
        :is-thai="isThai"
        :can-mark="canMarkHeld"
        :busy-topic-key="busyTopicKey"
        :held-entries="heldEntries"
        @mark="markTopicHeld"
        @unmark="unmarkTopicHeld"
      />

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
        :priority-topics="suggestedPriorityTopics"
        :dimensions="dimensions"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <RoadmapFitProfileSection
        :overall-capability-score="overallCapabilityScore"
        :top-personality-pillars="topPersonalityPillars"
        :personality-fit-raw="personalityFitRaw"
        :personality-fit-narrative="personalityFitNarrative"
        :has-role-answers="hasRoleAnswers"
        :is-thai="isThai"
      />

      <div class="mt-10 flex justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated/70 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
          :aria-expanded="showFullRoadmap"
          aria-controls="full-roadmap"
          @click="toggleFullRoadmap"
        >
          {{ showFullRoadmap ? t.hideFullRoadmap : t.viewFullRoadmap }}
        </button>
      </div>

      <div v-if="showFullRoadmap" id="full-roadmap" ref="fullRoadmapSection">
        <RoadmapLearningSequence
          :topics="displayTopics"
          :topic-resources="topicResources"
          :is-thai="isThai"
          :role-title="skillAssessmentRoleTitle"
          :held-topic-ids="heldDisplayTopicIds"
        />
      </div>
    </template>
  </main>
</template>
