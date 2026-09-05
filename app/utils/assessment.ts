import type {
  AssessmentInsights,
  AssessmentResult,
  AssessmentSession,
  PillarInsight,
  QuestionStage,
  QuestionType,
  RankedRoleInsight,
  Role,
  RoleAlignmentStatus,
  RoleResolutionStatus,
  SessionMilestones,
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

export function getQuestionStageLabel(
  _stage: QuestionStage,
  lang?: string,
): string {
  // The session only ever asks Role Discovery questions; the Skill
  // Assessment has its own endpoints and its own screen.
  return lang === 'th' ? 'ค้นหาบทบาท' : 'Role discovery'
}

export function getQuestionTypeLabel(
  questionType: QuestionType,
  lang?: string,
): string {
  if (lang === 'th') {
    switch (questionType) {
      case 'yes_no':
        return 'ใช่ / ไม่ใช่'
      case 'yes_no_maybe':
        return 'ใช่ / ไม่ใช่ / อาจจะ'
      case 'likert_5':
        return 'สเกลความเห็น'
      case 'ranked_choice':
        return 'จัดอันดับความสำคัญ'
      default:
        return 'เลือกข้อเดียว'
    }
  }
  switch (questionType) {
    case 'yes_no':
      return 'Yes / no'
    case 'yes_no_maybe':
      return 'Yes / no / maybe'
    case 'likert_5':
      return 'Agreement scale'
    case 'ranked_choice':
      return 'Priority pick'
    default:
      return 'Single choice'
  }
}

export function getAlignmentTone(
  status: RoleAlignmentStatus,
): 'neutral' | 'success' | 'warning' {
  if (status === 'aligned') {
    return 'success'
  }

  if (status === 'mismatch') {
    return 'warning'
  }

  return 'neutral'
}

export function getAlignmentLabel(
  status: RoleAlignmentStatus,
  lang?: string,
): string {
  if (lang === 'th') {
    if (status === 'aligned') {
      return 'ตรงตามเป้าหมาย'
    }
    if (status === 'mismatch') {
      return 'เป้าหมายที่ต้องปรับตัว'
    }
    return 'กำลังวิเคราะห์ทักษะ'
  }

  if (status === 'aligned') {
    return 'Trajectory aligned'
  }

  if (status === 'mismatch') {
    return 'Stretch path'
  }

  return 'Still calibrating'
}

export function getRoleResolutionLabel(
  status: RoleResolutionStatus,
  lang?: string,
): string {
  if (lang === 'th') {
    if (status === 'resolved') {
      return 'วิเคราะห์แล้ว'
    }
    if (status === 'low_confidence') {
      return 'ความมั่นใจยังต่ำ'
    }
    if (status === 'in_progress') {
      return 'กำลังดำเนินการ'
    }
    return 'ไม่ระบุ'
  }

  if (status === 'resolved') {
    return 'Resolved'
  }

  if (status === 'low_confidence') {
    return 'Low confidence'
  }

  if (status === 'in_progress') {
    return 'In progress'
  }

  return 'Unknown'
}

export function getTotalAnswered(milestones: SessionMilestones): number {
  return milestones.answered_role_questions
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
