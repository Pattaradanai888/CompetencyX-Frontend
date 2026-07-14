import { computed } from 'vue'
import type { Ref } from 'vue'
import { clamp } from '~/utils/roadmaps'
import type { RadarDimension } from '~/utils/roadmaps'
import type {
  SkillAssessmentCatalogDimension,
  SkillAssessmentCatalogQuestion,
} from '~~/shared/types/assessment'
import { useSkillAssessmentApiClient } from '~/composables/useSkillAssessmentApiClient'

export type SkillAssessmentQuestion = {
  id: string
  prompt: string
  translations?: SkillAssessmentCatalogQuestion['translations']
  dimensionKey: string
}

export function buildSkillAssessmentQuestions(
  catalogQuestions: SkillAssessmentCatalogQuestion[] | undefined | null,
): SkillAssessmentQuestion[] {
  return (catalogQuestions ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    translations: question.translations,
    dimensionKey: question.dimension_key,
  }))
}

export function normalizeSkillAssessmentAnswer(
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
  question: SkillAssessmentQuestion,
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): number | null {
  const raw = answers[question.id]
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return null
  }
  return normalizeSkillAssessmentAnswer(raw, answerScaleMin, answerScaleMax)
}

export function answeredQuestionsCountForDimension(
  dimensionKey: string,
  questions: SkillAssessmentQuestion[],
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
  questions: SkillAssessmentQuestion[],
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
    normalizeSkillAssessmentAnswer(value, answerScaleMin, answerScaleMax),
  )
  const average =
    normalized.reduce((sum: number, value: number) => sum + value, 0) /
    normalized.length
  return clamp(average)
}

export function scoreAdaptiveCandidate(
  question: SkillAssessmentQuestion,
  questions: SkillAssessmentQuestion[],
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
  questions: SkillAssessmentQuestion[],
  answers: Record<string, number>,
): SkillAssessmentQuestion[] {
  return questions.filter((question) => !Number.isFinite(answers[question.id]))
}

export function getBestLocalCandidate(
  unanswered: SkillAssessmentQuestion[],
  questions: SkillAssessmentQuestion[],
  answers: Record<string, number>,
  answerScaleMin: number,
  answerScaleMax: number,
): SkillAssessmentQuestion | null {
  return unanswered.reduce(
    (best: SkillAssessmentQuestion | null, current: SkillAssessmentQuestion) => {
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
    null as SkillAssessmentQuestion | null,
  )
}

export function useSkillAssessmentQuestions(
  sessionId: Ref<string>,
  skillAssessmentQuestions: Ref<SkillAssessmentQuestion[]>,
  skillAssessmentAnswers: Ref<Record<string, number>>,
  answerScaleMin: Ref<number>,
  answerScaleMax: Ref<number>,
  baseDimensions: Ref<RadarDimension[]>,
  catalogByKey: Ref<Map<string, SkillAssessmentCatalogDimension>>,
) {
  const { getSkillAssessmentNextQuestion } = useSkillAssessmentApiClient()

  const blendedDimensions = computed<RadarDimension[]>(() => {
    const baseByKey = new Map(
      baseDimensions.value.map((item) => [item.key, item]),
    )

    return baseDimensions.value.map((dimension) => {
      const matchingQuestions = skillAssessmentQuestions.value.filter(
        (question) => question.dimensionKey === dimension.key,
      )
      const influences = matchingQuestions
        .map((question) =>
          getQuestionInfluence(
            question,
            skillAssessmentAnswers.value,
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

  async function pickNextQuestionWithRl(): Promise<SkillAssessmentQuestion | null> {
    const unanswered = getUnansweredQuestions(
      skillAssessmentQuestions.value,
      skillAssessmentAnswers.value,
    )
    if (!unanswered.length) {
      return null
    }

    try {
      const response = await getSkillAssessmentNextQuestion(
        sessionId.value,
        skillAssessmentAnswers.value,
      )
      const nextQuestionId = response.next_question?.id
      if (!nextQuestionId) {
        return null
      }
      return (
        skillAssessmentQuestions.value.find(
          (question) => question.id === nextQuestionId,
        ) ?? null
      )
    } catch {
      return getBestLocalCandidate(
        unanswered,
        skillAssessmentQuestions.value,
        skillAssessmentAnswers.value,
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
