import type {
  AssessmentInsights,
  AssessmentResult,
  AssessmentSession,
  QuestionStage,
  QuestionType,
  Recommendation,
  RoleAlignmentStatus,
  RoleResolutionStatus,
  SessionMilestones,
  TopicMastery,
} from '~~/shared/types/assessment'

export function isSessionComplete(
  session: AssessmentSession | AssessmentResult,
): boolean {
  return (
    session.status === 'completed' ||
    session.phase === 'recommendation_ready' ||
    session.phase === 'completed'
  )
}

export function getQuestionStageLabel(
  stage: QuestionStage,
  lang?: string,
): string {
  if (lang === 'th') {
    return stage === 'role' ? 'ค้นหาบทบาท' : 'ประเมินทักษะ'
  }
  return stage === 'role' ? 'Role discovery' : 'Skill assessment'
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
    if (status === 'ambiguous') {
      return 'เป้าหมายยังไม่ชัดเจน'
    }
    if (status === 'mismatch') {
      return 'เป้าหมายที่ต้องปรับตัว'
    }
    return 'กำลังวิเคราะห์ทักษะ'
  }

  if (status === 'aligned') {
    return 'Trajectory aligned'
  }

  if (status === 'ambiguous') {
    return 'Role still ambiguous'
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
    if (status === 'ambiguous') {
      return 'ก้ำกึ่ง'
    }
    if (status === 'in_progress') {
      return 'กำลังดำเนินการ'
    }
    return 'ไม่ระบุ'
  }

  if (status === 'resolved') {
    return 'Resolved'
  }

  if (status === 'ambiguous') {
    return 'Ambiguous'
  }

  if (status === 'in_progress') {
    return 'In progress'
  }

  return 'Unknown'
}

export function getTotalAnswered(milestones: SessionMilestones): number {
  return (
    milestones.answered_role_questions + milestones.answered_skill_questions
  )
}

function formatPercent(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0%'
  }

  return `${Math.round(value * 100)}%`
}

export const formatConfidencePercent = formatPercent

export function getRecommendationHeadline(
  recommendation: Recommendation | null,
): string {
  if (!recommendation) {
    return 'Recommendation in progress'
  }

  return recommendation.topic_title || 'No next topic recommended yet'
}

export function hasTopicRecommendation(
  recommendation: Recommendation | null,
): boolean {
  return Boolean(
    recommendation?.topic_id &&
    recommendation.topic_slug &&
    recommendation.topic_title,
  )
}

export const formatMasteryPercent = formatPercent

export function sortTopicsByDisplayOrder<
  T extends { display_order?: number | null },
>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      (Number(left.display_order) || 0) - (Number(right.display_order) || 0),
  )
}

export function sortMasteryDescending(items: TopicMastery[]): TopicMastery[] {
  return [...items].sort(
    (left, right) => (right.mastery_score ?? 0) - (left.mastery_score ?? 0),
  )
}

export function sortRankedRolesDescending(
  items: AssessmentInsights['ranked_roles'] | AssessmentResult['ranked_roles'],
) {
  return [...items].sort((left, right) => right.fit_score - left.fit_score)
}
