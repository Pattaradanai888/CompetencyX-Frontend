<script setup lang="ts">
import { motion } from 'motion-v'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useLocale } from '~/composables/useLocale'
import { sortTopicsByDisplayOrder } from '~/utils/assessment'
import { buildRoadmapsEvaluation } from '~/utils/roadmaps'
import {
  getRoadmapTopics,
  fetchTopicResources,
  getRoadmapSlug,
} from '~/utils/roadmapTopics'
import type { RadarDimension } from '~/utils/roadmaps'
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { getErrorMessage } from '~/utils/api'
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
    return { session, result, history, roadmapsCatalog, roadmapsState }
  },
)

const _roadmapsSnapshot = _roadmapsData.value ?? {
  session: null,
  result: null,
  history: null,
  roadmapsCatalog: null,
  roadmapsState: null,
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

const t = computed(() => {
  if (isThai.value) {
    return {
      backToHome: 'กลับไปหน้าแรก',
      backToSurvey1: 'กลับไปผลลัพธ์ Survey 1',
      session: 'เซสชัน',
      finalDashboard: 'แดชบอร์ดผลลัพธ์สุดท้าย',
      phase2Assessment: 'แบบประเมินเฟส 2',
      readinessRoadmap: 'แผนพัฒนาความพร้อม',
      calibrateSkills: 'ประเมินทักษะที่อยู่เบื้องหลังบทบาทที่แนะนำ',
      completeIntro:
        'โปรไฟล์นี้รวมผลค้นหาบทบาทกับแบบประเมินทักษะเฟส 2 เพื่อสรุประดับปัจจุบัน จุดแข็ง ช่องว่างสำคัญ และก้าวถัดไป',
      incompleteIntro:
        'ตอบคำถามทักษะสั้น ๆ ที่สัมพันธ์กับบทบาท ระบบจะแสดงกราฟ แผนพัฒนา และคำแนะนำฉบับเต็มหลังทำขั้นตอนนี้เสร็จ',
      assessmentComplete: 'ทำแบบประเมินเสร็จแล้ว',
      readinessOrganized: 'ถูกจัดเป็นแผนพัฒนาที่ชัดเจน',
      viewIntro:
        'หน้านี้แยกสรุปโปรไฟล์ สัญญาณความเหมาะสม ลำดับการเรียนรู้ และข้อมูลวิเคราะห์เพื่อให้อ่านขั้นตอนถัดไปได้ง่าย',
      personalityResult: 'ผลบุคลิกภาพ',
      personalityFit: 'ความเหมาะสมด้านบุคลิกภาพ',
      basedOnProfile: 'อิงจากโปรไฟล์หลัก',
      heroMetrics: 'ตัวชี้วัดหลัก',
      overallReadiness: 'ความพร้อมโดยรวม',
      readinessStatus: 'สถานะความพร้อม',
      strongestNow: 'จุดแข็งตอนนี้',
      roleGapInsight: 'ข้อมูลช่องว่างบทบาท',
      currentCapability: 'ความสามารถปัจจุบันของคุณ',
      asIs: 'ปัจจุบัน',
      toBe: 'เป้าหมาย',
      gapInsightCopy:
        'เปรียบเทียบระดับความสามารถปัจจุบันของคุณกับสิ่งที่บทบาทเป้าหมายต้องการ',
      topGaps: 'ช่องว่างที่ควรพัฒนา',
      gapTopicsCount: 'หัวข้อลำดับถัดไป',
      capabilityMap: 'แผนภาพความสามารถ',
      profileCenterpiece: 'ภาพรวมโปรไฟล์',
      mapCopy:
        'แผนภาพนี้ช่วยให้เห็นรูปแบบการทำงานปัจจุบัน ขณะที่ส่วนอื่นของหน้าช่วยตีความและวางก้าวถัดไป',
      section: 'ส่วนที่',
      knowledgePersonalityFit: 'ความรู้ + ความเหมาะสมด้านบุคลิกภาพ',
      section2Copy:
        'แยกสัญญาณความสามารถออกจากสัญญาณบุคลิกภาพ เพื่อให้อ่านภาพรวมความเหมาะสมได้ชัดเจน',
      section2AltTitle: 'ระดับความสามารถปัจจุบัน',
      section2AltCopy:
        'คะแนนความสามารถของคุณในแต่ละมิติ แบ่งตามทักษะ PSP และ SDLC',
      knowledgeFit: 'ความเหมาะสมด้านความรู้',
      capabilityAlignment: 'ความสอดคล้องของความสามารถ',
      currentReadiness: 'ความพร้อมปัจจุบัน',
      knowledgeFitCopy:
        'ความเหมาะสมด้านความรู้ผสมสัญญาณจาก Survey 1 กับหลักฐานการทำงานจาก Survey 2 ในมิติ PSP และ SDLC',
      strongest: 'เด่นสุด',
      behavioralAlignment: 'ความสอดคล้องเชิงพฤติกรรม',
      profileCoherence: 'ความสอดคล้องของโปรไฟล์',
      behaviorCopy:
        'การ์ดนี้สรุปเรดาร์บุคลิกภาพและคำแนะนำบทบาทให้เป็นสัญญาณสั้น ๆ แทนข้อความยาว',
      recommendedSequence: 'ลำดับการเรียนรู้ที่แนะนำ',
      sequenceCopy:
        'แผนพัฒนาที่เปลี่ยนโปรไฟล์ความเหมาะสมของคุณให้เป็นขั้นตอนปฏิบัติสำหรับสร้างหลักฐานตามบทบาท',
      step: 'ขั้นตอน',
      roleGap: 'ช่องว่างบทบาท',
      additionalInsights: 'ข้อมูลวิเคราะห์เพิ่มเติม',
      insightsCopy:
        'รายละเอียดสนับสนุนถูกจัดเป็นการ์ดเล็ก ๆ เพื่อให้หน้ายังอ่านง่ายและไม่แน่นเกินไป',
      strengthDistribution: 'การกระจายจุดแข็ง',
      strongestDimensions: 'มิติที่แข็งแรงที่สุด',
      strongestDimensionsCopy:
        'พื้นที่ความสามารถที่ได้คะแนนสูงและกำลังช่วยสนับสนุนความเหมาะสมของคุณ',
      developmentPriorities: 'ลำดับความสำคัญในการพัฒนา',
      improveNext: 'ควรพัฒนาถัดไป',
      improveNextCopy: 'พื้นที่คะแนนต่ำที่ช่วยเพิ่มความพร้อมได้เร็วที่สุด',
      roleReady: 'พร้อมสำหรับบทบาท',
      projectReady: 'พร้อมเริ่มโปรเจกต์',
      foundationBuilding: 'กำลังสร้างพื้นฐาน',
      readyToReview: 'พร้อมทบทวน',
      buildingConfidence: 'กำลังสร้างความมั่นใจ',
      stillCalibrating: 'กำลังปรับเทียบ',
      answered: 'ตอบแล้ว',
      saving: 'กำลังบันทึก',
      inProgress: 'กำลังทำ',
      savingSignal: 'กำลังบันทึกสัญญาณคำตอบและเตรียมขั้นตอนถัดไป',
      movingNext: 'กำลังไปยังข้อความถัดไป',
      selectOne: 'เลือกหนึ่งคำตอบเพื่อไปต่ออัตโนมัติ',
      preparingPrompt: 'กำลังเตรียมคำถามถัดไป',
      promptContext: 'วางข้อความนี้บนระดับความคิดเห็นแล้วไปต่อ',
      foundation: 'พื้นฐาน',
      intermediate: 'ระดับกลาง',
      advanced: 'ขั้นสูง',
      targeted: 'เฉพาะจุด',
      previous: 'ย้อนกลับ',
      refreshPrompt: 'รีเฟรชเซสชันเพื่อแสดงคำถามถัดไปโดยไม่สูญเสียความคืบหน้า',
      resolvingQuestion: 'ระบบกำลังจัดเตรียมคำถามปรับเทียบถัดไป',

      gapToTarget: 'ช่องว่างสู่เป้าหมาย',
      targetReadiness: 'เป้าหมายความพร้อม',
      pointsNeeded: 'คะแนนที่ต้องพัฒนา',
      gapClosed: 'ถึงเป้าหมายแล้ว',

      priority: 'ลำดับความสำคัญ',
      roadmap: 'แผนพัฒนา',
      resources: 'แหล่งเรียนรู้',
      labelBook: 'หนังสือ',
      labelVideo: 'วิดีโอ',
      labelArticle: 'บทความ',
      labelCourse: 'คอร์ส',
      labelOfficial: 'ทางการ',
      labelWebsite: 'เว็บไซต์',
      labelRoadmap: 'แผนพัฒนา',
      labelFeed: 'ฟีด',
    }
  }

  return {
    backToHome: 'Back to Home',
    backToSurvey1: 'Back to Survey 1 results',
    session: 'Session',
    finalDashboard: 'Final result dashboard',
    phase2Assessment: 'Phase 2 assessment',
    readinessRoadmap: 'readiness roadmap',
    calibrateSkills: 'Calibrate the skills behind your recommended role',
    completeIntro:
      'This profile blends your role discovery result with the Phase 2 skill assessment to map your current level, strongest signals, priority gaps, and next portfolio moves.',
    incompleteIntro:
      'Answer a short set of role-aware skill prompts. The full chart, roadmap, and recommendations stay hidden until this step is complete.',
    assessmentComplete: 'Assessment complete',
    readinessOrganized: 'readiness, organized into a clear growth plan.',
    viewIntro:
      'This view separates your profile summary, fit signals, learning sequence, and supporting analytics so the next actions are easy to scan.',
    personalityResult: 'Personality result',
    personalityFit: 'Personality fit',
    basedOnProfile: 'Based on pillar profile',
    heroMetrics: 'Hero metrics',
    overallReadiness: 'Overall readiness',
    readinessStatus: 'Readiness status',
    strongestNow: 'Strongest now',
    roleGapInsight: 'Role gap insight',
    currentCapability: 'Your current capability',
    asIs: 'As-Is',
    toBe: 'To-Be',
    gapInsightCopy:
      'Compare your current capability level against what the target role requires.',
    topGaps: 'Top gap areas',
    gapTopicsCount: 'topics to focus on next',
    capabilityMap: 'Capability map',
    profileCenterpiece: 'Profile centerpiece',
    mapCopy:
      'The map keeps your current execution shape visible while the rest of the page focuses on interpretation and next steps.',
    section: 'Section',
    knowledgePersonalityFit: 'Knowledge + personality fit',
    section2Copy:
      'Separate the execution signal from the personality signal so the fit story is readable at a glance.',
    section2AltTitle: 'Current capability breakdown',
    section2AltCopy:
      'Your capability scores across each dimension, grouped by PSP and SDLC tracks.',
    knowledgeFit: 'Knowledge fit',
    capabilityAlignment: 'Capability alignment',
    currentReadiness: 'current readiness',
    knowledgeFitCopy:
      'Your knowledge fit blends Survey 1 signals with Survey 2 execution evidence across PSP and SDLC dimensions.',
    strongest: 'Strongest',
    behavioralAlignment: 'Behavioral alignment',
    profileCoherence: 'profile coherence',
    behaviorCopy:
      'This card translates your personality radar and role guidance into concise signals instead of long narrative blocks.',
    recommendedSequence: 'Recommended learning sequence',
    sequenceCopy:
      'A focused roadmap that turns your fit profile into a practical step-by-step path for building stronger role evidence.',
    step: 'Step',
    roleGap: 'Role gap',
    additionalInsights: 'Additional insights and analytics',
    insightsCopy:
      'Supporting detail is grouped into smaller cards so the page stays analytical without becoming dense.',
    strengthDistribution: 'Strength distribution',
    strongestDimensions: 'Strongest dimensions',
    strongestDimensionsCopy:
      'The highest-scoring capability areas currently carrying your fit.',
    developmentPriorities: 'Development priorities',
    improveNext: 'Improve next',
    improveNextCopy:
      'The lowest-scoring areas that will move readiness fastest.',
    roleReady: 'Role ready',
    projectReady: 'Project ready',
    foundationBuilding: 'Foundation building',
    readyToReview: 'Ready to review',
    buildingConfidence: 'Building confidence',
    stillCalibrating: 'Still calibrating',
    answered: 'answered',
    saving: 'Saving',
    inProgress: 'In progress',
    savingSignal: 'Saving your assessment signal and preparing the next step.',
    movingNext: 'Moving to the next statement.',
    selectOne: 'Select one response to continue automatically.',
    preparingPrompt: 'Preparing prompt',
    promptContext: 'Place the statement on the agreement scale and continue.',
    foundation: 'Foundation',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    targeted: 'Targeted',
    previous: 'Previous',
    refreshPrompt:
      'Refreshing the session should surface the next prompt without losing your progress.',
    resolvingQuestion: 'We are resolving the next calibration question.',
    gapToTarget: 'Gap to target',
    targetReadiness: 'Target readiness',
    pointsNeeded: 'points needed',
    gapClosed: 'At target level',
    priority: 'Priority',
    roadmap: 'Roadmap',
    resources: 'Resources',
    labelBook: 'Book',
    labelVideo: 'Video',
    labelArticle: 'Article',
    labelCourse: 'Course',
    labelOfficial: 'Official',
    labelWebsite: 'Website',
    labelRoadmap: 'Roadmap',
    labelFeed: 'Feed',
  }
})

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

const isRoadmapsComplete = ref(roadmapsState.completed)

type RoadmapQuestion = {
  id: string
  prompt: string
  dimensionKey: string
}

const roadmapQuestions: RoadmapQuestion[] = (
  roadmapsCatalog?.questions ?? []
).map((question: RoadmapsCatalogQuestion) => ({
  id: question.id,
  prompt: question.prompt,
  dimensionKey: question.dimension_key,
}))

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
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return null
  }

  return normalizeRoadmapsAnswer(raw)
}

const catalogByKey = computed(
  () =>
    new Map<string, RoadmapsCatalogDimension>(
      (roadmapsCatalog?.dimensions ?? []).map(
        (item: RoadmapsCatalogDimension) => [item.key, item],
      ),
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
      ? influences.reduce((sum: number, value: number) => sum + value, 0) /
        influences.length
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
    normalized.reduce((sum: number, value: number) => sum + value, 0) /
    normalized.length
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
      sessionId.value,
      roadmapAnswers.value,
    )
    const nextQuestionId = response.next_question?.id
    if (!nextQuestionId) {
      return null
    }
    return (
      roadmapQuestions.find((question) => question.id === nextQuestionId) ??
      null
    )
  } catch {
    return unanswered.reduce(
      (best: RoadmapQuestion | null, current: RoadmapQuestion) => {
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
    console.log(`[resources] no slug for ${topicTitle}`)
    return
  }
  loadingResources.value = new Set([...loadingResources.value, topicId])
  console.log(`[resources] loading ${slug}:${topicTitle}`)
  const links = await fetchTopicResources(slug, topicTitle)
  console.log(`[resources] ${slug}:${topicTitle} → ${links.length} links`)
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
    return `${getRoadmapScaleLabel(selectedScaleOption.value)}. ${t.value.movingNext}`
  }

  if (selectedScaleOption.value) {
    return `${getRoadmapScaleLabel(selectedScaleOption.value)}.`
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
    result.value?.preferred_role_gap_topics ?? [],
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
        ? `คะแนนระดับนี้บ่งชี้ว่ายังมีโอกาสสำรวจเพิ่มเติมก่อน锁定เส้นทาง ใช้เสาหลักที่ได้คะแนนต่ำเป็น feedback เพื่อปรับทิศทาง`
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

function getTopicDifficultyLabel(topic: RoadmapTopic): string {
  const raw = topic.difficulty

  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }

  if (typeof raw === 'number') {
    if (raw <= 2) return t.value.foundation
    if (raw <= 4) return t.value.intermediate
    return t.value.advanced
  }

  return t.value.targeted
}

function getTopicTags(topic: RoadmapTopic): string[] {
  const tags: string[] = []

  if (topic.is_gap) {
    tags.push(t.value.priority)
  }
  if (topic.topic_group) {
    tags.push(topic.topic_group)
  } else if (!topic.is_gap) {
    tags.push(t.value.roadmap)
  }

  return tags
}

function getResourceTypeLabel(type: ResourceLink['type']): string {
  const labels: Record<ResourceLink['type'], string> = {
    book: t.value.labelBook,
    video: t.value.labelVideo,
    article: t.value.labelArticle,
    course: t.value.labelCourse,
    official: t.value.labelOfficial,
    website: t.value.labelWebsite,
    roadmap: t.value.labelRoadmap,
    feed: t.value.labelFeed,
  }
  return labels[type] ?? type
}

function getRoadmapScaleLabel(option: {
  label: string
  value: number
}): string {
  if (!isThai.value) {
    return option.label
  }

  switch (option.value) {
    case 1:
      return 'ไม่เห็นด้วยอย่างยิ่ง'
    case 2:
      return 'ไม่เห็นด้วย'
    case 3:
      return 'เป็นกลาง'
    case 4:
      return 'เห็นด้วย'
    case 5:
      return 'เห็นด้วยอย่างยิ่ง'
    default:
      return option.label
  }
}

const personalityFitScoreDisplay = computed(() => {
  if (!personalityPillars.value.length) return '0/10'
  const avg =
    personalityPillars.value.reduce(
      (sum: number, p: PillarInsight) => sum + p.normalized_score,
      0,
    ) / personalityPillars.value.length
  return `${(avg * 10).toFixed(1)}/10`
})

function formatPillarScore(pillar: PillarInsight): string {
  return `${(pillar.normalized_score * 10).toFixed(1)}/10`
}

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
      <NuxtLink to="/" class="editorial-link text-sm">
        {{ t.backToHome }}
      </NuxtLink>
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
                    {{ getRoadmapScaleLabel(option) }}
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
                {{ t.previous }}
              </button>
            </div>
          </div>
        </motion.div>

        <div v-else class="phase2-question-card phase2-question-card--empty">
          <p class="phase2-question-card__prompt-label">
            {{ t.preparingPrompt }}
          </p>
          <h2
            class="phase2-question-card__prompt phase2-question-card__prompt--compact"
          >
            {{ t.resolvingQuestion }}
          </h2>
          <p class="phase2-panel__lead mt-4">
            {{ t.refreshPrompt }}
          </p>
        </div>
      </section>
    </section>

    <template v-if="isRoadmapsComplete">
      <section class="result-spotlight mt-10 overflow-hidden p-5 md:p-10">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          <span aria-hidden="true">✓</span>
          {{ t.assessmentComplete }}
        </div>

        <h2
          class="mt-6 max-w-4xl font-display text-4xl leading-tight text-ink md:text-6xl"
        >
          {{ survey2RoleTitle }} {{ t.readinessOrganized }}
        </h2>
        <p class="mt-5 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ t.viewIntro }}
        </p>

        <div
          class="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start"
        >
          <!-- Left column: cards -->
          <div class="grid gap-5">
            <div v-if="hasRoleAnswers" class="grid gap-5 sm:grid-cols-2">
              <article class="paper-panel p-5">
                <p class="eyebrow">{{ t.personalityResult }}</p>
                <h3 class="mt-2 text-xl font-bold text-ink">
                  {{ survey2RoleTitle }}
                </h3>
                <p class="mt-1 text-xs leading-6 text-ink-soft">
                  {{ displayPersonalitySignals[0] }}
                </p>

                <div class="mt-4 grid gap-2">
                  <div
                    class="rounded-xl border border-border-subtle bg-surface-card px-4 py-3"
                  >
                    <p
                      class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.personalityFit }}
                    </p>
                    <div class="mt-1 flex items-end justify-between gap-3">
                      <p class="data-value text-2xl font-black text-ink">
                        {{ personalityFitScoreDisplay }}
                      </p>
                      <p class="text-[11px] font-semibold text-ink-soft">
                        {{ t.basedOnProfile }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-for="pillar in topPersonalityPillars.slice(0, 3)"
                    :key="pillar.key"
                    class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2.5"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-ink">
                        {{ pillar.label }}
                      </p>
                      <p class="data-value text-sm font-bold text-accent">
                        {{ formatPillarScore(pillar) }}
                      </p>
                    </div>
                    <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                      <div
                        class="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                        :style="{
                          width: `${Math.round(pillar.normalized_score * 100)}%`,
                        }"
                      />
                    </div>
                  </div>
                </div>
              </article>

              <article class="paper-panel p-5 flex flex-col">
                <p class="eyebrow">{{ t.heroMetrics }}</p>
                <div class="mt-4 grid flex-1 gap-2 grid-rows-3">
                  <div class="metric-card p-4">
                    <p
                      class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.overallReadiness }}
                    </p>
                    <p class="mt-1 data-value text-3xl font-black text-ink">
                      {{ overallCapabilityScore }}%
                    </p>
                    <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                      <div
                        class="h-1.5 rounded-full bg-accent"
                        :style="{ width: `${overallCapabilityScore}%` }"
                      />
                    </div>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.readinessStatus }}
                    </p>
                    <p class="mt-1 text-xl font-black text-ink">
                      {{ readinessStatus }}
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.strongestNow }}
                    </p>
                    <p class="mt-1 text-sm leading-6 text-ink-soft">
                      {{ recalculatedStrengths.join(' • ') }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <article class="paper-panel p-5">
              <p class="eyebrow">{{ t.roleGapInsight }}</p>
              <h3 class="mt-2 text-xl font-bold text-ink">
                {{ survey2RoleTitle }}
              </h3>
              <p class="mt-1 text-xs leading-6 text-ink-soft">
                {{ t.gapInsightCopy }}
              </p>

              <div
                class="mt-4 grid gap-3"
                :class="hasRoleAnswers ? '' : 'sm:grid-cols-2'"
              >
                <div
                  class="rounded-xl border-l-4 border-l-blueprint bg-surface-card px-4 py-3"
                >
                  <p
                    class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-blueprint"
                  >
                    {{ t.asIs }}
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink">
                    {{ t.currentCapability }}
                  </p>
                  <div class="mt-2 flex items-end justify-between gap-3">
                    <p class="data-value text-2xl font-black text-ink">
                      {{ overallCapabilityScore }}%
                    </p>
                    <p class="text-[11px] font-semibold text-ink-soft">
                      {{ t.overallReadiness }}
                    </p>
                  </div>
                  <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                    <div
                      class="h-1.5 rounded-full bg-blueprint"
                      :style="{ width: `${overallCapabilityScore}%` }"
                    />
                  </div>
                  <p class="mt-2 text-xs leading-5 text-ink-soft">
                    {{ t.topGaps }}: {{ recalculatedGrowthAreas.join(' • ') }}
                  </p>
                </div>

                <div
                  class="rounded-xl border-l-4 border-l-accent bg-surface-card px-4 py-3"
                >
                  <p
                    class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent"
                  >
                    {{ t.toBe }}
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink">
                    {{ survey2RoleTitle }}
                  </p>
                  <div class="mt-2 flex items-end justify-between gap-3">
                    <p class="data-value text-2xl font-black text-accent">
                      {{ TARGET_READINESS_SCORE }}%
                    </p>
                    <p class="text-[11px] font-semibold text-ink-soft">
                      {{ t.targetReadiness }}
                    </p>
                  </div>
                  <div class="mt-1 h-1.5 rounded-full bg-ink/8">
                    <div
                      class="h-1.5 rounded-full bg-accent"
                      :style="{ width: `${TARGET_READINESS_SCORE}%` }"
                    />
                  </div>
                  <div
                    class="mt-2 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-2"
                  >
                    <p class="text-[11px] font-bold text-ink-soft">
                      {{ t.gapToTarget }}
                    </p>
                    <p
                      class="text-sm font-black"
                      :class="isAtTarget ? 'text-green-600' : 'text-ink'"
                    >
                      {{
                        isAtTarget
                          ? t.gapClosed
                          : `${capabilityGap} ${t.pointsNeeded}`
                      }}
                    </p>
                  </div>
                  <p class="mt-2 text-xs leading-5 text-ink-soft">
                    {{ displayTopics.length }} {{ t.gapTopicsCount }}
                  </p>
                  <div
                    v-if="displayTopics.length"
                    class="mt-1 flex flex-wrap gap-1.5"
                  >
                    <span
                      v-for="topic in displayTopics.slice(0, 3)"
                      :key="topic.id"
                      class="rounded-full border border-border-subtle bg-surface-elevated/60 px-2 py-0.5 text-[11px] font-semibold text-ink-soft"
                    >
                      {{ topic.title }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- Right column: spider chart -->
          <div class="paper-panel p-5 xl:sticky xl:top-8 xl:self-start">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="eyebrow">{{ t.capabilityMap }}</p>
                <h3 class="mt-2 text-xl font-bold text-ink">
                  {{ t.profileCenterpiece }}
                </h3>
              </div>
              <div
                class="shrink-0 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-center"
              >
                <p class="data-value text-lg font-black text-accent">
                  {{ overallCapabilityScore }}%
                </p>
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                >
                  {{ t.overallReadiness }}
                </p>
              </div>
            </div>
            <p class="mt-2 text-xs leading-6 text-ink-soft">
              {{ t.mapCopy }}
            </p>
            <div class="mt-4">
              <SkillSpiderChart :dimensions="blendedDimensions" />
            </div>
          </div>
        </div>
      </section>

      <section class="section-band mt-10 py-12 md:py-16">
        <div class="mx-auto max-w-6xl">
          <div class="max-w-3xl">
            <p class="eyebrow">{{ t.section }} 2</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              {{
                hasRoleAnswers ? t.knowledgePersonalityFit : t.section2AltTitle
              }}
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              {{ hasRoleAnswers ? t.section2Copy : t.section2AltCopy }}
            </p>
          </div>

          <div
            class="mt-10 grid gap-6"
            :class="{ 'xl:grid-cols-2': hasRoleAnswers }"
          >
            <article class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">{{ t.knowledgeFit }}</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    {{ t.capabilityAlignment }}
                  </h3>
                </div>
                <div class="text-right">
                  <p class="data-value text-4xl font-black text-ink">
                    {{ overallCapabilityScore }}%
                  </p>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
                  >
                    {{ t.currentReadiness }}
                  </p>
                </div>
              </div>

              <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
                {{ t.knowledgeFitCopy }}
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
                    {{ t.strongest }}: {{ track.strongest }}
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

            <article v-if="hasRoleAnswers" class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">{{ t.personalityFit }}</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    {{ t.behavioralAlignment }}
                  </h3>
                </div>
                <div class="text-right">
                  <p class="data-value text-4xl font-black text-ink">
                    {{ personalityFitScoreDisplay }}
                  </p>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
                  >
                    {{ t.profileCoherence }}
                  </p>
                </div>
              </div>

              <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
                {{ t.behaviorCopy }}
              </p>

              <p
                class="mt-8 max-w-xl rounded-2xl border border-border-subtle bg-surface-card px-5 py-4 text-sm leading-8 text-ink-soft"
              >
                {{ personalityFitNarrative }}
              </p>

              <div class="mt-8 space-y-4">
                <div v-for="pillar in topPersonalityPillars" :key="pillar.key">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-ink">
                      {{ pillar.label }}
                    </p>
                    <p class="data-value text-sm font-bold text-accent">
                      {{ formatPillarScore(pillar) }}
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
            </article>
          </div>
        </div>
      </section>

      <section class="mt-10">
        <div
          class="rounded-[2rem] border border-border-subtle bg-surface-elevated/70 p-6 shadow-[0_24px_70px_rgba(74,54,35,0.08)] md:p-8"
        >
          <div class="max-w-3xl">
            <p class="eyebrow">{{ t.section }} 3</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              {{ t.recommendedSequence }}
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              {{ t.sequenceCopy }}
            </p>
          </div>
        </div>

        <div class="mt-10 grid gap-5">
          <div
            v-for="(topic, index) in displayTopics"
            :key="topic.id"
            class="relative"
          >
            <div
              v-if="index !== displayTopics.length - 1"
              class="absolute left-5 top-14 hidden h-[calc(100%+1.25rem)] w-px bg-[linear-gradient(180deg,rgba(234,112,31,0.28),rgba(33,122,111,0.14))] md:block"
            />
            <div
              class="absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-accent/20 bg-white text-sm font-black text-accent shadow-[0_10px_24px_rgba(234,112,31,0.16)]"
            >
              {{ index + 1 }}
            </div>

            <article class="paper-panel ml-5 md:ml-14">
              <div
                class="grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8"
              >
                <div class="max-w-3xl">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="eyebrow">{{ t.step }} {{ index + 1 }}</p>
                    <span
                      class="rounded-full border border-accent/16 bg-accent/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-accent"
                    >
                      {{ getTopicDifficultyLabel(topic) }}
                    </span>
                  </div>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    {{ topic.title }}
                  </h3>
                  <p
                    v-if="topic.description"
                    class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft"
                  >
                    {{ topic.description }}
                  </p>
                </div>

                <div
                  class="flex flex-wrap content-start gap-2 md:max-w-56 md:justify-end"
                >
                  <span
                    v-for="tag in getTopicTags(topic)"
                    :key="tag"
                    class="rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div
                v-if="topicResources.get(topic.id)?.length"
                class="border-t border-border-subtle px-6 py-4 md:px-8"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
                >
                  {{ t.resources }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <a
                    v-for="link in topicResources.get(topic.id)"
                    :key="link.url"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/30 hover:text-accent"
                  >
                    <span
                      class="shrink-0 rounded bg-surface-muted px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                      >{{ getResourceTypeLabel(link.type) }}</span
                    >
                    <span>{{ link.title }}</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section-band mt-10 py-12 md:py-16">
        <div class="mx-auto max-w-6xl">
          <div class="max-w-3xl">
            <p class="eyebrow">{{ t.section }} 4</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              {{ t.additionalInsights }}
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              {{ t.insightsCopy }}
            </p>
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-2">
            <article class="paper-panel p-6">
              <p class="eyebrow">{{ t.strengthDistribution }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.strongestDimensions }}
              </h3>
              <p class="mt-2 text-sm leading-7 text-ink-soft">
                {{ t.strongestDimensionsCopy }}
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
                  <p class="mt-2 text-xs leading-5 text-ink-soft">
                    {{ dimension.description }}
                  </p>
                  <div class="mt-2 h-2 rounded-full bg-ink/8">
                    <div
                      class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                      :style="{ width: `${dimension.percent}%` }"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article class="paper-panel p-6">
              <p class="eyebrow">{{ t.developmentPriorities }}</p>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ t.improveNext }}
              </h3>
              <p class="mt-2 text-sm leading-7 text-ink-soft">
                {{ t.improveNextCopy }}
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
                  <p class="mt-2 text-xs leading-5 text-ink-soft">
                    {{ dimension.description }}
                  </p>
                  <div class="mt-2 h-2 rounded-full bg-ink/8">
                    <div
                      class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))]"
                      :style="{ width: `${dimension.percent}%` }"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
/template>
