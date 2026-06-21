<script setup lang="ts">
import { motion } from 'motion-v'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { sortTopicsByDisplayOrder } from '~/utils/assessment'
import { buildRoadmapsEvaluation } from '~/utils/roadmaps'
import type { RadarDimension } from '~/utils/roadmaps'
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  AssessmentSession,
  PillarInsight,
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

const { data: _roadmapsData } = await useAsyncData(
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

const session = _roadmapsData.value!.session
const result = _roadmapsData.value!.result
const history = _roadmapsData.value!.history
const roadmapsCatalog = _roadmapsData.value!.roadmapsCatalog
const roadmapsState = _roadmapsData.value!.roadmapsState
const isThai = computed(() => session?.language === 'th')

const t = computed(() => {
  if (isThai.value) {
    return {
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
      capabilityMap: 'แผนภาพความสามารถ',
      profileCenterpiece: 'ภาพรวมโปรไฟล์',
      mapCopy:
        'แผนภาพนี้ช่วยให้เห็นรูปแบบการทำงานปัจจุบัน ขณะที่ส่วนอื่นของหน้าช่วยตีความและวางก้าวถัดไป',
      section: 'ส่วนที่',
      knowledgePersonalityFit: 'ความรู้ + ความเหมาะสมด้านบุคลิกภาพ',
      section2Copy:
        'แยกสัญญาณความสามารถออกจากสัญญาณบุคลิกภาพ เพื่อให้อ่านภาพรวมความเหมาะสมได้ชัดเจน',
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
      prerequisite: 'เรื่องพื้นฐานก่อนหน้า',
      prerequisites: 'เรื่องพื้นฐานก่อนหน้า',
      followOn: 'ต่อยอด',
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
      noTopicDescription: 'หัวข้อนี้ถูกจัดลำดับจากช่องว่างของบทบาทที่คุณเลือก',
    }
  }

  return {
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
    capabilityMap: 'Capability map',
    profileCenterpiece: 'Profile centerpiece',
    mapCopy:
      'The map keeps your current execution shape visible while the rest of the page focuses on interpretation and next steps.',
    section: 'Section',
    knowledgePersonalityFit: 'Knowledge + personality fit',
    section2Copy:
      'Separate the execution signal from the personality signal so the fit story is readable at a glance.',
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
    prerequisite: 'prerequisite',
    prerequisites: 'prerequisites',
    followOn: 'Follow-on',
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
    noTopicDescription:
      'This topic is prioritized from your preferred-role gap profile.',
  }
})

const preferredRoleName = computed(
  () => result?.preferred_role?.name ?? session?.preferred_role?.name ?? null,
)
const bestFitRoleName = computed(
  () => result?.best_fit_role?.name ?? session?.best_fit_role?.name ?? null,
)
const survey2RoleTitle = computed(
  () =>
    bestFitRoleName.value ??
    preferredRoleName.value ??
    (isThai.value ? 'บทบาทซอฟต์แวร์' : 'Software role'),
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
      roadmapsCatalog.dimensions.map((item: RoadmapsCatalogDimension) => [
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

const topRoadmapTopics = computed<RoadmapTopic[]>(() =>
  sortTopicsByDisplayOrder(result?.preferred_role_gap_topics ?? []).slice(0, 6),
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
  const strongestSignals = [...blendedDimensions.value]
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((item) => item.label)

  const signalSummary = strongestSignals.length
    ? isThai.value
      ? `สัญญาณพฤติกรรมที่เด่นที่สุดอยู่ที่ ${strongestSignals.join(' และ ')}`
      : `Your strongest behavioral signals appear around ${strongestSignals.join(
          ' and ',
        )}.`
    : isThai.value
      ? 'โปรไฟล์พฤติกรรมของคุณยังอยู่ระหว่างการปรับเทียบตามมิติของแผนพัฒนา'
      : 'Your behavioral profile is still being calibrated across the roadmap dimensions.'

  const confidenceSummary =
    result?.role_alignment_status === 'aligned'
      ? isThai.value
        ? 'รูปแบบคำตอบบอกว่าคุณมีความมั่นใจในบทบาทค่อนข้างชัดเจน แผนพัฒนาจึงควรเน้นเปลี่ยนนิสัยการทำงานเหล่านี้ให้เป็นหลักฐานที่แข็งแรงขึ้น'
        : 'The pattern suggests stable role confidence, so the roadmap can focus on turning those work habits into stronger execution evidence.'
      : isThai.value
        ? 'รูปแบบคำตอบบอกว่ายังมีพื้นที่ให้สำรวจก่อนล็อกเส้นทางแน่นเกินไป แผนพัฒนาจึงควรใช้มิติคะแนนต่ำเป็น feedback เชิงปฏิบัติ'
        : 'The pattern suggests there is still room to explore before locking the path too tightly, so the roadmap should use low-scoring dimensions as practical feedback.'

  return isThai.value
    ? `โปรไฟล์ปัจจุบันสอดคล้องกับทิศทาง ${roleName} มากที่สุด ${signalSummary} ${confidenceSummary}`
    : `Your current profile is most consistent with the ${roleName} direction. ${signalSummary} ${confidenceSummary}`
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
    (sum: number, pillar: PillarInsight) => sum + pillar.normalized_score,
    0,
  )
  return Math.round((total / personalityPillars.value.length) * 100)
})

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
    if (raw <= 2) return t.value.foundation
    if (raw <= 4) return t.value.intermediate
    return t.value.advanced
  }

  return t.value.targeted
}

function getTopicTags(topic: RoadmapTopic): string[] {
  const tags = [t.value.roleGap]

  if (topic.prerequisites?.length) {
    tags.push(
      topic.prerequisites.length === 1
        ? `1 ${t.value.prerequisite}`
        : `${topic.prerequisites.length} ${t.value.prerequisites}`,
    )
  }

  if (topic.parent_id !== null) {
    tags.push(t.value.followOn)
  }

  return tags
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
      <NuxtLink
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
      <section class="result-spotlight mt-24 overflow-hidden p-6 md:p-10">
        <div class="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
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
            <p
              class="mt-5 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              {{ t.viewIntro }}
            </p>

            <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:max-w-3xl">
              <article class="paper-panel p-6">
                <p class="eyebrow">{{ t.personalityResult }}</p>
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
                      {{ t.personalityFit }}
                    </p>
                    <div class="mt-2 flex items-end justify-between gap-3">
                      <p class="data-value text-3xl font-black text-ink">
                        {{ personalityFitScore }}%
                      </p>
                      <p class="text-xs font-semibold text-ink-soft">
                        {{ t.basedOnProfile }}
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
                <p class="eyebrow">{{ t.heroMetrics }}</p>
                <div class="mt-4 grid gap-3">
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.overallReadiness }}
                    </p>
                    <p class="mt-2 data-value text-4xl font-black text-ink">
                      {{ overallCapabilityScore }}%
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.readinessStatus }}
                    </p>
                    <p class="mt-2 text-2xl font-black text-ink">
                      {{ readinessStatus }}
                    </p>
                  </div>
                  <div class="metric-card p-4">
                    <p
                      class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
                    >
                      {{ t.strongestNow }}
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
              <p class="eyebrow">{{ t.capabilityMap }}</p>
              <h3 class="mt-3 font-display text-3xl text-ink">
                {{ t.profileCenterpiece }}
              </h3>
              <p class="mt-2 max-w-md text-sm leading-7 text-ink-soft">
                {{ t.mapCopy }}
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
            <p class="eyebrow">{{ t.section }} 2</p>
            <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
              {{ t.knowledgePersonalityFit }}
            </h2>
            <p
              class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base"
            >
              {{ t.section2Copy }}
            </p>
          </div>

          <div class="mt-10 grid gap-6 xl:grid-cols-2">
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

            <article class="paper-panel p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">{{ t.personalityFit }}</p>
                  <h3 class="mt-3 text-2xl font-bold text-ink">
                    {{ t.behavioralAlignment }}
                  </h3>
                </div>
                <div class="text-right">
                  <p class="data-value text-4xl font-black text-ink">
                    {{ personalityFitScore }}%
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
            </article>
          </div>
        </div>
      </section>

      <section class="mt-24">
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
            v-for="(topic, index) in topRoadmapTopics"
            :key="topic.id"
            class="relative"
          >
            <div
              v-if="index !== topRoadmapTopics.length - 1"
              class="absolute left-5 top-14 hidden h-[calc(100%+1.25rem)] w-px bg-[linear-gradient(180deg,rgba(234,112,31,0.28),rgba(33,122,111,0.14))] md:block"
            />
            <div
              class="absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-accent/20 bg-white text-sm font-black text-accent shadow-[0_10px_24px_rgba(234,112,31,0.16)]"
            >
              {{ index + 1 }}
            </div>

            <article class="paper-panel ml-5 overflow-hidden p-0 md:ml-14">
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
                  <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                    {{ topic.description || t.noTopicDescription }}
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
            </article>
          </div>
        </div>
      </section>

      <section class="section-band mt-24 py-12 md:py-16">
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
                  <div class="mt-3 h-2 rounded-full bg-ink/8">
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
