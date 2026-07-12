import { computed } from 'vue'
import type { Ref } from 'vue'
import type { RadarDimension } from '~/utils/roadmaps'
import type {
  RoadmapsCatalogDimension,
  RoadmapsCatalogQuestion,
} from '~~/shared/types/assessment'
import { useRoadmapsApiClient } from '~/composables/useRoadmapsApiClient'

export type RoadmapQuestion = {
  id: string
  prompt: string
  translations?: RoadmapsCatalogQuestion['translations']
  dimensionKey: string
}

export function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function buildRoadmapQuestions(
  catalogQuestions: RoadmapsCatalogQuestion[] | undefined | null,
): RoadmapQuestion[] {
  return (catalogQuestions ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    translations: question.translations,
    dimensionKey: question.dimension_key,
  }))
}

export function normalizeRoadmapsAnswer(
  raw: number,
  answerScaleMin: number,
  answerScaleMax: number,
): number {
  if (answerScaleMax === answerScaleMin) {
    return 1
  }

  const ratio = (raw - answerScaleMin) / (answerScaleMax - answerScaleMin)
  const scoreOutOfTen = 1 + clamp(ratio) * 9
  return scoreOutOfTen / 10
}

export function getQuestionInfluence(
  question: RoadmapQuestion,
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): number | null {
  const raw = answers[question.id]
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return null
  }
  return normalizeRoadmapsAnswer(raw, answerScaleMin, answerScaleMax)
}

export function answeredQuestionsCountForDimension(
  dimensionKey: string,
  questions: RoadmapQuestion[],
  answers: Record<string, number>,
): number {
  return questions.filter((question) => {
    if (question.dimensionKey !== dimensionKey) {
      return false
    }
    return Number.isFinite(answers[question.id])
  }).length
}

export function getDimensionMastery(
  dimensionKey: string,
  questions: RoadmapQuestion[],
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): number {
  const matchingAnswers = questions
    .filter((question) => question.dimensionKey === dimensionKey)
    .map((question) => answers[question.id])
    .filter((value): value is number => Number.isFinite(value))

  if (!matchingAnswers.length) {
    return 0.5
  }

  const normalized = matchingAnswers.map((value) =>
    normalizeRoadmapsAnswer(value, answerScaleMin, answerScaleMax),
  )
  const average =
    normalized.reduce((sum: number, value: number) => sum + value, 0) /
    normalized.length
  return clamp(average)
}

export function scoreAdaptiveCandidate(
  question: RoadmapQuestion,
  questions: RoadmapQuestion[],
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): number {
  const mastery = getDimensionMastery(
    question.dimensionKey,
    questions,
    answers,
    answerScaleMin,
    answerScaleMax,
  )
  const uncertainty = 1 - Math.abs(mastery - 0.5) * 2
  const developmentNeed = 1 - mastery
  const coverageBonus =
    answeredQuestionsCountForDimension(
      question.dimensionKey,
      questions,
      answers,
    ) === 0
      ? 0.25
      : 0
  return developmentNeed * 0.55 + uncertainty * 0.3 + coverageBonus
}

export function getUnansweredQuestions(
  questions: RoadmapQuestion[],
  answers: Record<string, number>,
): RoadmapQuestion[] {
  return questions.filter((question) => !Number.isFinite(answers[question.id]))
}

export function getBestLocalCandidate(
  unanswered: RoadmapQuestion[],
  questions: RoadmapQuestion[],
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): RoadmapQuestion | null {
  return unanswered.reduce(
    (best: RoadmapQuestion | null, current: RoadmapQuestion) => {
      if (!best) {
        return current
      }
      return scoreAdaptiveCandidate(
        current,
        questions,
        answers,
        answerScaleMin,
        answerScaleMax,
      ) >
        scoreAdaptiveCandidate(
          best,
          questions,
          answers,
          answerScaleMin,
          answerScaleMax,
        )
        ? current
        : best
    },
    null as RoadmapQuestion | null,
  )
}

export function useRoadmapQuestions(
  sessionId: Ref<string>,
  roadmapQuestions: Ref<RoadmapQuestion[]>,
  roadmapAnswers: Ref<Record<string, number>>,
  answerScaleMin: Ref<number>,
  answerScaleMax: Ref<number>,
  baseDimensions: Ref<RadarDimension[]>,
  catalogByKey: Ref<Map<string, RoadmapsCatalogDimension>>,
) {
  const { getRoadmapsNextQuestion } = useRoadmapsApiClient()

  const blendedDimensions = computed<RadarDimension[]>(() => {
    const baseByKey = new Map(
      baseDimensions.value.map((item) => [item.key, item]),
    )

    return baseDimensions.value.map((dimension) => {
      const matchingQuestions = roadmapQuestions.value.filter(
        (question) => question.dimensionKey === dimension.key,
      )
      const influences = matchingQuestions
        .map((question) =>
          getQuestionInfluence(
            question,
            roadmapAnswers.value,
            answerScaleMin.value,
            answerScaleMax.value,
          ),
        )
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

  async function pickNextQuestionWithRl(): Promise<RoadmapQuestion | null> {
    const unanswered = getUnansweredQuestions(
      roadmapQuestions.value,
      roadmapAnswers.value,
    )
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
        roadmapQuestions.value.find(
          (question) => question.id === nextQuestionId,
        ) ?? null
      )
    } catch {
      return getBestLocalCandidate(
        unanswered,
        roadmapQuestions.value,
        roadmapAnswers.value,
        answerScaleMin.value,
        answerScaleMax.value,
      )
    }
  }

  return {
    blendedDimensions,
    pickNextQuestionWithRl,
  }
}
