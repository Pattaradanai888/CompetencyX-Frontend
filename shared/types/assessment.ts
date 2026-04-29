export type AssessmentPhase =
  | 'role_discovery'
  | 'role_ambiguity'
  | 'skill_assessment'
  | 'recommendation_ready'
  | 'completed'

export type AssessmentStatus = 'in_progress' | 'completed'
export type QuestionStage = 'role' | 'skill'
export type QuestionType = 'yes_no' | 'yes_no_maybe' | 'single_choice' | 'ranked_choice'
export type PathKind = 'preferred' | 'best_fit'
export type PolicyType = 'rule_based' | 'bandit' | 'q_learning'
export type ConfidenceIndicator = 'low' | 'medium' | 'high'
export type RoleAlignmentStatus = 'unknown' | 'aligned' | 'mismatch' | 'ambiguous' | string
export type RoleResolutionStatus = 'unknown' | 'in_progress' | 'resolved' | 'ambiguous' | string

export interface Role {
  id: number
  slug: string
  name: string
  description?: string
}

export interface TopicPrerequisite {
  topic_id: number
  required_mastery_threshold: number
  dependency_weight: number
}

export interface RoadmapTopic {
  id: number
  slug: string
  title: string
  description?: string
  difficulty?: number | string
  display_order?: number
  parent_id: number | null
  prerequisites: TopicPrerequisite[]
}

export interface QuestionOption {
  id: number
  key: string
  label: string
  value?: string
  display_order?: number
}

export interface Question {
  id: number
  code: string
  stage: QuestionStage
  question_type: QuestionType
  prompt: string
  help_text?: string
  role: string | null
  topic: string | null
  difficulty?: number
  options: QuestionOption[]
}

export interface SessionMilestones {
  answered_role_questions: number
  answered_skill_questions: number
}

export interface AssessmentSession {
  id: string
  status: AssessmentStatus
  phase: AssessmentPhase
  best_fit_confidence?: number
  preferred_role: Role | null
  best_fit_role: Role | null
  profile?: Record<string, unknown> | null
  started_at: string
  updated_at: string
  completed_at?: string | null
  milestones: SessionMilestones
  role_alignment_status: RoleAlignmentStatus
  role_resolution_status: RoleResolutionStatus
  guidance_summary: string
  current_question: Question | null
}

export interface PillarInsight {
  key: string
  label: string
  raw_score: number
  normalized_score: number
  evidence_count: number
}

export interface RankedRoleInsight {
  slug: string
  name: string
  fit_score: number
  fit_share: number
  top_supporting_pillars: string[]
}

export interface Recommendation {
  id: number
  role_slug: string
  topic_id: number | null
  topic_slug: string | null
  topic_title: string | null
  reason: string
  path_kind?: PathKind
  policy_type?: PolicyType
  score?: number | null
  created_at: string
}

export interface TopicMastery {
  topic_id: number
  topic_slug: string
  topic_title: string
  mastery_score?: number | null
  confidence_score?: number | null
  updated_at: string
}

export interface AssessmentResult
  extends Omit<AssessmentSession, 'current_question'> {
  pillar_profile: PillarInsight[]
  ranked_roles: RankedRoleInsight[]
  preferred_role_gap_topics: RoadmapTopic[]
  mastery_scores: TopicMastery[]
  preferred_path_recommendation: Recommendation | null
  best_fit_path_recommendation: Recommendation | null
}

export interface AssessmentInsights {
  role_resolution_status: RoleResolutionStatus
  best_fit_role: Role | null
  best_fit_confidence?: number
  answered_role_questions: number
  pillar_profile: PillarInsight[]
  ranked_roles: RankedRoleInsight[]
  guidance_summary: string
}

export interface AnswerHistory {
  id: number
  question_id: number
  question_code: string
  question_prompt: string
  question_stage: string
  topic_slug: string | null
  selected_option_id: number
  selected_option_key: string
  selected_option_label: string
  response_time_ms?: number | null
  confidence_indicator?: ConfidenceIndicator | null
  responded_at: string
}

export interface AssessmentHistory {
  id: string
  phase: AssessmentPhase
  status: AssessmentStatus
  answers: AnswerHistory[]
  recommendations: Recommendation[]
}

export interface SessionCreatePayload {
  preferred_role_slug?: string
  profile?: Record<string, unknown>
}

export interface AnswerSubmitPayload {
  question_id: number
  option_id: number
  response_time_ms?: number
  confidence_indicator?: ConfidenceIndicator
}

export interface ApiError {
  statusCode: number
  data: Record<string, unknown>
}
