import type {
  AssessmentInsights,
  AssessmentResult,
  AssessmentSession,
  PillarInsight,
  RankedRoleInsight,
  Role,
} from '~~/shared/types/assessment'

/**
 * The role as the respondent reads it. A Thai session reads the role's Thai
 * name when it has one; the English name is the fallback, not the default.
 */
export function getRoleDisplayName(
  role:
    | Pick<Role, 'name' | 'name_th'>
    | Pick<RankedRoleInsight, 'name' | 'name_th'>
    | null
    | undefined,
  isThai: boolean,
): string {
  if (!role) return ''
  return (isThai && role.name_th) || role.name
}

export function getRoleDisplayDescription(
  role: Pick<Role, 'description' | 'description_th'> | null | undefined,
  isThai: boolean,
): string {
  if (!role) return ''
  return (isThai && role.description_th) || role.description || ''
}

export function getPillarLabel(
  pillar: Pick<PillarInsight, 'label' | 'label_th'>,
  isThai: boolean,
): string {
  return (isThai && pillar.label_th) || pillar.label
}

export function getSupportingPillars(
  role: Pick<
    RankedRoleInsight,
    'top_supporting_pillars' | 'top_supporting_pillars_th'
  >,
  isThai: boolean,
): string[] {
  if (isThai && role.top_supporting_pillars_th?.length) {
    return role.top_supporting_pillars_th
  }
  return role.top_supporting_pillars
}

export function isSessionComplete(
  session: AssessmentSession | AssessmentResult,
): boolean {
  return (
    session.status === 'completed' || session.phase === 'recommendation_ready'
  )
}

function formatPercent(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0%'
  }

  return `${Math.round(value * 100)}%`
}

export const formatConfidencePercent = formatPercent

export function sortTopicsByDisplayOrder<
  T extends { display_order?: number | null },
>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      (Number(left.display_order) || 0) - (Number(right.display_order) || 0),
  )
}

export function sortRankedRolesDescending(
  items: AssessmentInsights['ranked_roles'] | AssessmentResult['ranked_roles'],
) {
  return [...items].sort((left, right) => right.fit_score - left.fit_score)
}
