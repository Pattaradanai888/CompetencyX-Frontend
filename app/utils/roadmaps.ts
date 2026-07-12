import type {
  AnswerHistory,
  AssessmentHistory,
  AssessmentResult,
  PillarInsight,
  RadarDimension,
  RoadmapsEvaluation,
  RoadmapTopic,
} from '~~/shared/types/assessment'

export type { RadarDimension, RoadmapsEvaluation }

export function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export interface TopicDifficultyLabels {
  foundation: string
  intermediate: string
  advanced: string
  targeted: string
}

/**
 * Maps a topic difficulty (1–5 numeric scale from the API, or a
 * pre-labelled string) to a display label.
 */
export function getTopicDifficultyLabel(
  difficulty: RoadmapTopic['difficulty'],
  labels: TopicDifficultyLabels,
): string {
  if (typeof difficulty === 'string' && difficulty.trim()) {
    return difficulty
  }

  if (typeof difficulty === 'number') {
    if (difficulty <= 2) return labels.foundation
    if (difficulty <= 4) return labels.intermediate
    return labels.advanced
  }

  return labels.targeted
}

function average(values: number[]): number {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function normalizeScaleValue(scaleValue: number | null): number | null {
  if (scaleValue === null || Number.isNaN(scaleValue)) {
    return null
  }

  return clamp((scaleValue + 2) / 4)
}

function matchTopic(answer: AnswerHistory, keywords: string[]) {
  const topic = (answer.topic_slug ?? '').toLowerCase()
  return keywords.some((keyword) => topic.includes(keyword))
}

function getTopicScore(answers: AnswerHistory[], keywords: string[]) {
  const matchedScores = answers
    .filter((answer) => matchTopic(answer, keywords))
    .map((answer) => normalizeScaleValue(answer.scale_value))
    .filter((score): score is number => score !== null)

  return average(matchedScores)
}

function pillarScore(pillars: PillarInsight[], key: string) {
  const pillar = pillars.find((item) => item.key === key)
  return clamp(pillar?.normalized_score ?? 0)
}

function summarizeDimensions(dimensions: RadarDimension[]) {
  const ordered = [...dimensions].sort(
    (left, right) => right.value - left.value,
  )
  const STRENGTH_THRESHOLD = 0.7
  const GAP_THRESHOLD = 0.5
  const above = ordered.filter((d) => d.value >= STRENGTH_THRESHOLD)
  const below = ordered.filter((d) => d.value < GAP_THRESHOLD)
  const strengths =
    above.length > 0
      ? above.map((item) => item.label)
      : ordered.slice(0, 1).map((item) => item.label)
  const growthAreas =
    below.length > 0
      ? below.map((item) => item.label)
      : ordered.slice(-1).map((item) => item.label)
  return { strengths, growthAreas }
}

function buildPersonalitySignals(
  result: AssessmentResult,
  dimensions: RadarDimension[],
) {
  const topRole =
    result.best_fit_role?.name ??
    result.preferred_role?.name ??
    'your current target role'
  const highest = [...dimensions]
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((item) => item.label)

  return [
    `Best-fit trajectory currently aligns with ${topRole}.`,
    `Strong natural signal in ${highest.join(' and ')}.`,
    result.role_alignment_status === 'aligned'
      ? 'Profile indicates stable role confidence and consistency.'
      : 'Profile suggests exploration mode before locking a final path.',
  ]
}

export function buildRoadmapsEvaluation(
  result: AssessmentResult,
  history: AssessmentHistory | null,
): RoadmapsEvaluation {
  const answers = history?.answers ?? []
  const pillars = result.pillar_profile ?? []

  const dimensions: RadarDimension[] = [
    {
      key: 'psp-planning',
      label: 'PSP Planning',
      value: clamp(
        average([
          pillarScore(pillars, 'planning_discipline'),
          getTopicScore(answers, ['planning', 'estimation']),
        ]),
      ),
      track: 'psp',
    },
    {
      key: 'psp-quality',
      label: 'PSP Quality Discipline',
      value: clamp(
        average([
          pillarScore(pillars, 'quality_focus'),
          getTopicScore(answers, ['quality', 'defect', 'review']),
        ]),
      ),
      track: 'psp',
    },
    {
      key: 'sdlc-requirements',
      label: 'Requirements Analysis',
      value: clamp(
        average([
          pillarScore(pillars, 'analysis'),
          getTopicScore(answers, ['requirement', 'analysis']),
        ]),
      ),
      track: 'sdlc',
    },
    {
      key: 'sdlc-design',
      label: 'System Design & Architecture',
      value: clamp(
        average([
          pillarScore(pillars, 'architecture'),
          getTopicScore(answers, ['design', 'architecture']),
        ]),
      ),
      track: 'sdlc',
    },
    {
      key: 'sdlc-development',
      label: 'Development / Coding',
      value: clamp(
        average([
          pillarScore(pillars, 'implementation'),
          getTopicScore(answers, ['coding', 'development', 'implementation']),
        ]),
      ),
      track: 'sdlc',
    },
    {
      key: 'sdlc-testing',
      label: 'Testing & QA',
      value: clamp(
        average([
          pillarScore(pillars, 'testing'),
          getTopicScore(answers, ['testing', 'qa']),
        ]),
      ),
      track: 'sdlc',
    },
    {
      key: 'sdlc-deployment',
      label: 'Deployment & Release',
      value: clamp(
        average([
          pillarScore(pillars, 'delivery'),
          getTopicScore(answers, ['deploy', 'release', 'delivery']),
        ]),
      ),
      track: 'sdlc',
    },
    {
      key: 'sdlc-maintenance',
      label: 'Maintenance & Support',
      value: clamp(
        average([
          pillarScore(pillars, 'operations'),
          getTopicScore(answers, ['maintenance', 'support', 'operations']),
        ]),
      ),
      track: 'sdlc',
    },
  ]

  const { strengths, growthAreas } = summarizeDimensions(dimensions)
  const personalitySignals = buildPersonalitySignals(result, dimensions)

  return {
    dimensions,
    strengths,
    growthAreas,
    personalitySignals,
  }
}

export interface DimensionCard extends RadarDimension {
  percent: number
  description: string
}

export interface TrackHighlight {
  key: 'psp' | 'sdlc'
  label: string
  description: string
  average: number
  strongest: string
}

export function formatPillarScore(pillar: PillarInsight): string {
  return pillar.normalized_score.toFixed(2)
}

export function cleanPillarLabel(label: string): string {
  return label.replace(/^[A-Z]+\d+\s*[-–—]\s*/, '').trim()
}

export function pillarScoreMax(pillars: PillarInsight[]): number {
  if (!pillars.length) return 0
  return Math.max(...pillars.map((p) => p.normalized_score))
}

export function getRoadmapScaleLabel(
  option: { label: string; value: number },
  isThai: boolean,
): string {
  if (!isThai) {
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
