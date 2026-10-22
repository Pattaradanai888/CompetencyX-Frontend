import type {
  PillarInsight,
  RadarDimension,
  SkillAssessmentTopicEntry,
} from '~~/shared/types/assessment'

export type { RadarDimension }

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
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

export function cleanPillarLabel(label: string): string {
  return label.replace(/^[A-Z]+\d+\s*[-–—]\s*/, '').trim()
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
