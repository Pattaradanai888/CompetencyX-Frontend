import type {
  PillarInsight,
  RadarDimension,
  RoadmapTopic,
  SkillAssessmentTopicEntry,
} from '~~/shared/types/assessment'

export type { RadarDimension }

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

export interface DimensionCard extends RadarDimension {
  percent: number
  description: string
}

/** The set's name as the respondent reads it: Canonical Thai Wording in a Thai session. */
export function getTopicEntryTitle(
  entry: SkillAssessmentTopicEntry,
  isThai: boolean,
): string {
  return (isThai && entry.topic_title_th) || entry.topic_title
}

/**
 * One radar axis per *assessed* set. A set nobody rated has no Self-placed
 * Mastery, and plotting a placeholder for it would show a unit nobody asked
 * about as a middling score (ADR-0003), so unassessed sets are left off.
 */
export function buildRadarDimensions(
  entries: SkillAssessmentTopicEntry[],
  isThai: boolean,
): RadarDimension[] {
  return entries
    .filter(
      (entry): entry is SkillAssessmentTopicEntry & { mastery: number } =>
        typeof entry.mastery === 'number',
    )
    .map((entry) => ({
      key: entry.topic_slug,
      label: getTopicEntryTitle(entry, isThai),
      value: clamp(entry.mastery),
    }))
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
