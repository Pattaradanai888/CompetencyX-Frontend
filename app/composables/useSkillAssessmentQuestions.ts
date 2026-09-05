import type { Ref } from 'vue'
import type {
  SkillAssessmentCatalogQuestion,
  SkillAssessmentProgress,
} from '~~/shared/types/assessment'
import { useSkillAssessmentApiClient } from '~/composables/useSkillAssessmentApiClient'

export type SkillAssessmentQuestion = {
  id: string
  prompt: string
  translations?: SkillAssessmentCatalogQuestion['translations']
  dimensionKey: string
  topicSlug: string
  topicTitle: string
}

export function buildSkillAssessmentQuestions(
  catalogQuestions: SkillAssessmentCatalogQuestion[] | undefined | null,
): SkillAssessmentQuestion[] {
  return (catalogQuestions ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    translations: question.translations,
    dimensionKey: question.dimension_key,
    topicSlug: question.topic_slug,
    topicTitle: question.topic_title,
  }))
}

export interface NextQuestionDecision {
  /** The item to ask next, or null when the backend says the assessment should stop. */
  question: SkillAssessmentQuestion | null
  progress: SkillAssessmentProgress | null
}

/**
 * Which item to ask next is the backend's decision, made from the answers
 * given so far: it applies the stop rule (floor, ceiling, and Recommendation
 * Stability) and picks the item whose rating would move the suggestions most
 * (ADR-0003, ADR-0005). The client does not pick a question of its own when
 * the backend cannot be reached -- an order that does not come from the
 * backend's evidence is a guess -- so a failure is thrown to the caller.
 */
export function useSkillAssessmentQuestions(
  sessionId: Ref<string>,
  skillAssessmentQuestions: Ref<SkillAssessmentQuestion[]>,
  skillAssessmentAnswers: Ref<Record<string, number>>,
) {
  const { getSkillAssessmentNextQuestion } = useSkillAssessmentApiClient()

  async function requestNextQuestion(): Promise<NextQuestionDecision> {
    const response = await getSkillAssessmentNextQuestion(
      sessionId.value,
      skillAssessmentAnswers.value,
    )
    const nextQuestionId = response.next_question?.id ?? null
    if (nextQuestionId === null) {
      return { question: null, progress: response.progress ?? null }
    }
    const question = skillAssessmentQuestions.value.find(
      (candidate) => candidate.id === nextQuestionId,
    )
    // An item the catalog does not carry is a contract break, not the stop
    // signal: treating it as null would submit the assessment early.
    if (!question) {
      throw new Error(`Unknown Skill Assessment item: ${nextQuestionId}`)
    }
    return { question, progress: response.progress ?? null }
  }

  return {
    requestNextQuestion,
  }
}
