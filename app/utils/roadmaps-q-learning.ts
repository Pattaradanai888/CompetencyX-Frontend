export type RoadmapsLevelBucket =
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high'

export type RoadmapsProgressBucket =
  | 'starting'
  | 'early'
  | 'mid'
  | 'late'
  | 'complete'

export interface RoadmapsQDimensionSnapshot {
  key: string
  mastery: number
  uncertainty: number
  answeredCount: number
}

export interface RoadmapsQQuestion {
  id: string
  dimensionKey: string
}

export interface RoadmapsQState {
  roleSlug: string
  progress: RoadmapsProgressBucket
  readiness: RoadmapsLevelBucket
  topNeedDimension: string | null
  currentQuestionId: string | null
  answeredCount: number
  remainingCount: number
  masteryBuckets: Record<string, RoadmapsLevelBucket>
  uncertaintyBuckets: Record<string, RoadmapsLevelBucket>
  coverageBuckets: Record<string, RoadmapsLevelBucket>
}

export interface RoadmapsQTransition {
  previousState: RoadmapsQState
  nextState: RoadmapsQState
  actionQuestionId: string
  answerValue: number
  reward: number
}

export interface BuildRoadmapsQStateInput {
  roleSlug?: string | null
  currentQuestionId?: string | null
  questions: RoadmapsQQuestion[]
  dimensions: Array<{ key: string; value: number }>
  answers: Record<string, number>
  answerScaleMin?: number
  answerScaleMax?: number
}

export interface BuildRoadmapsRewardInput {
  previousState: RoadmapsQState
  nextState: RoadmapsQState
  actionQuestionId: string
  answerValue: number
}

export interface RoadmapsQActionSelectionInput {
  state: RoadmapsQState
  candidateQuestionIds: string[]
  qValues: Record<string, number>
  epsilon?: number
  random?: () => number
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function average(values: number[]): number {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function bucketizeLevel(value: number): RoadmapsLevelBucket {
  if (value < 0.2) return 'very_low'
  if (value < 0.4) return 'low'
  if (value < 0.6) return 'medium'
  if (value < 0.8) return 'high'
  return 'very_high'
}

function bucketizeProgress(
  answeredCount: number,
  totalQuestions: number,
): RoadmapsProgressBucket {
  if (totalQuestions <= 0 || answeredCount >= totalQuestions) return 'complete'

  const ratio = answeredCount / totalQuestions
  if (ratio <= 0) return 'starting'
  if (ratio < 0.34) return 'early'
  if (ratio < 0.67) return 'mid'
  return 'late'
}

function normalizeAnswer(
  raw: number,
  answerScaleMin: number,
  answerScaleMax: number,
): number {
  if (answerScaleMin === answerScaleMax) {
    return 1
  }

  return clamp((raw - answerScaleMin) / (answerScaleMax - answerScaleMin))
}

function buildDimensionSnapshots({
  questions,
  dimensions,
  answers,
  answerScaleMin,
  answerScaleMax,
}: Omit<BuildRoadmapsQStateInput, 'roleSlug' | 'currentQuestionId'> & {
  answerScaleMin: number
  answerScaleMax: number
}): RoadmapsQDimensionSnapshot[] {
  return dimensions.map((dimension) => {
    const relatedQuestions = questions.filter(
      (question) => question.dimensionKey === dimension.key,
    )
    const answeredValues = relatedQuestions
      .map((question) => answers[question.id])
      .filter((value): value is number => Number.isFinite(value))

    const normalizedAnswers = answeredValues.map((value) =>
      normalizeAnswer(value, answerScaleMin, answerScaleMax),
    )
    const answeredCount = normalizedAnswers.length
    const totalForDimension = relatedQuestions.length
    const coverage = totalForDimension ? answeredCount / totalForDimension : 0
    const answerMean = average(normalizedAnswers)

    // Uncertainty is highest near 0.5 or when there is no evidence yet.
    const uncertaintyFromPolarity =
      answeredCount > 0 ? 1 - Math.abs(answerMean - 0.5) * 2 : 1
    const uncertaintyFromCoverage = 1 - coverage
    const uncertainty = clamp(
      uncertaintyFromPolarity * 0.65 + uncertaintyFromCoverage * 0.35,
    )

    return {
      key: dimension.key,
      mastery: clamp(answeredCount > 0 ? answerMean : dimension.value),
      uncertainty,
      answeredCount,
    }
  })
}

export function encodeRoadmapsQState(state: RoadmapsQState): string {
  const mastery = Object.entries(state.masteryBuckets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  const uncertainty = Object.entries(state.uncertaintyBuckets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  const coverage = Object.entries(state.coverageBuckets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')

  return [
    `role=${state.roleSlug}`,
    `progress=${state.progress}`,
    `readiness=${state.readiness}`,
    `need=${state.topNeedDimension ?? 'none'}`,
    `current=${state.currentQuestionId ?? 'none'}`,
    `mastery=${mastery}`,
    `uncertainty=${uncertainty}`,
    `coverage=${coverage}`,
  ].join(';')
}

export function buildRoadmapsQState(
  input: BuildRoadmapsQStateInput,
): RoadmapsQState {
  const answerScaleMin = input.answerScaleMin ?? 1
  const answerScaleMax = input.answerScaleMax ?? 5
  const answeredCount = Object.values(input.answers).filter((value) =>
    Number.isFinite(value),
  ).length
  const remainingCount = Math.max(input.questions.length - answeredCount, 0)

  const dimensionSnapshots = buildDimensionSnapshots({
    questions: input.questions,
    dimensions: input.dimensions,
    answers: input.answers,
    answerScaleMin,
    answerScaleMax,
  })

  const readiness = bucketizeLevel(
    average(dimensionSnapshots.map((snapshot) => snapshot.mastery)),
  )

  const topNeedDimension =
    [...dimensionSnapshots].sort((left, right) => {
      const leftNeed = (1 - left.mastery) * 0.65 + left.uncertainty * 0.35
      const rightNeed = (1 - right.mastery) * 0.65 + right.uncertainty * 0.35
      return rightNeed - leftNeed
    })[0]?.key ?? null

  const masteryBuckets = Object.fromEntries(
    dimensionSnapshots.map((snapshot) => [
      snapshot.key,
      bucketizeLevel(snapshot.mastery),
    ]),
  )

  const uncertaintyBuckets = Object.fromEntries(
    dimensionSnapshots.map((snapshot) => [
      snapshot.key,
      bucketizeLevel(snapshot.uncertainty),
    ]),
  )

  const coverageBuckets = Object.fromEntries(
    dimensionSnapshots.map((snapshot) => {
      const totalForDimension = input.questions.filter(
        (question) => question.dimensionKey === snapshot.key,
      ).length
      const coverage = totalForDimension
        ? snapshot.answeredCount / totalForDimension
        : 0

      return [snapshot.key, bucketizeLevel(coverage)]
    }),
  )

  return {
    roleSlug: input.roleSlug ?? 'unknown-role',
    progress: bucketizeProgress(answeredCount, input.questions.length),
    readiness,
    topNeedDimension,
    currentQuestionId: input.currentQuestionId ?? null,
    answeredCount,
    remainingCount,
    masteryBuckets,
    uncertaintyBuckets,
    coverageBuckets,
  }
}

export function buildRoadmapsQReward(input: BuildRoadmapsRewardInput): number {
  const previousNeed = input.previousState.topNeedDimension
  const nextNeed = input.nextState.topNeedDimension
  const previousUncertainty = previousNeed
    ? input.previousState.uncertaintyBuckets[previousNeed]
    : 'medium'
  const nextUncertainty = nextNeed
    ? input.nextState.uncertaintyBuckets[nextNeed]
    : 'medium'

  let reward = 0

  if (input.nextState.answeredCount > input.previousState.answeredCount) {
    reward += 0.35
  }

  if (
    previousNeed &&
    input.actionQuestionId === input.previousState.currentQuestionId
  ) {
    reward += 0.1
  }

  if (previousNeed && previousNeed !== nextNeed) {
    reward += 0.2
  }

  if (previousUncertainty !== nextUncertainty) {
    reward += 0.15
  }

  const normalizedAnswer = clamp((input.answerValue - 1) / 4)
  reward += (1 - Math.abs(normalizedAnswer - 0.5) * 2) * 0.1

  if (input.nextState.progress === 'complete') {
    reward += 0.4
  }

  return clamp(reward)
}

export function selectRoadmapsQAction(
  input: RoadmapsQActionSelectionInput,
): string | null {
  if (!input.candidateQuestionIds.length) {
    return null
  }

  const random = input.random ?? Math.random
  const epsilon = input.epsilon ?? 0.1

  if (random() < epsilon) {
    const index = Math.floor(random() * input.candidateQuestionIds.length)
    return input.candidateQuestionIds[index] ?? null
  }

  return input.candidateQuestionIds.reduce(
    (best, current) => {
      if (!best) {
        return current
      }

      const currentKey = `${encodeRoadmapsQState(input.state)}::${current}`
      const bestKey = `${encodeRoadmapsQState(input.state)}::${best}`
      const currentValue = input.qValues[currentKey] ?? 0
      const bestValue = input.qValues[bestKey] ?? 0

      return currentValue > bestValue ? current : best
    },
    null as string | null,
  )
}

export function buildRoadmapsQTransition(
  previousState: RoadmapsQState,
  nextState: RoadmapsQState,
  actionQuestionId: string,
  answerValue: number,
): RoadmapsQTransition {
  return {
    previousState,
    nextState,
    actionQuestionId,
    answerValue,
    reward: buildRoadmapsQReward({
      previousState,
      nextState,
      actionQuestionId,
      answerValue,
    }),
  }
}
