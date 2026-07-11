export type AssessmentPhase = 'role_discovery' | 'recommendation_ready'

export type AssessmentStatus = 'in_progress' | 'completed'
export type QuestionStage = 'role' | 'skill'
export type QuestionType =
  | 'yes_no'
  | 'yes_no_maybe'
  | 'single_choice'
  | 'ranked_choice'
  | 'likert_5'
export type PathKind = 'preferred' | 'best_fit'
export type PolicyType = 'rule_based' | 'q_learning'
export type ConfidenceIndicator = 'low' | 'medium' | 'high'
export type RoleAlignmentStatus = 'unknown' | 'aligned' | 'mismatch'
export type RoleResolutionStatus =
  | 'unknown'
  | 'in_progress'
  | 'resolved'
  | 'low_confidence'
export type LikertScaleValue = -2 | -1 | 0 | 1 | 2

export interface Role {
  id: number
  slug: string
  name: string
  description?: string
  top_ka_codes?: string[]
  core_tasks?: string[]
  swebok_source_version?: string
}

export interface TopicPrerequisite {
  topic_id: number
  required_mastery_threshold: number
  dependency_weight: number
  title?: string
}

export interface ResourceLink {
  type:
    | 'book'
    | 'video'
    | 'article'
    | 'course'
    | 'official'
    | 'website'
    | 'roadmap'
    | 'feed'
  title: string
  url: string
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
  topic_group?: string
  prerequisite_titles?: string[]
  subtopic_titles?: string[]
  follow_on_titles?: string[]
  is_gap?: boolean
  resource_links?: ResourceLink[]
}

export interface QuestionOption {
  id: number
  key: string
  label: string
  value?: string
  display_order?: number
}

export interface ResponseScaleOption {
  key: string
  label: string
  value: LikertScaleValue
}

export interface Question {
  id: number
  code: string
  stage: QuestionStage
  question_type: QuestionType
  prompt: string
  help_text?: string
  translations?: Record<string, { prompt?: string; help_text?: string }>
  role: string | null
  topic: string | null
  difficulty?: number
  options: QuestionOption[]
  response_scale?: ResponseScaleOption[]
}

export interface SessionMilestones {
  answered_role_questions: number
  answered_core_role_questions: number
  answered_tie_break_questions: number
}

export interface AssessmentSession {
  id: string
  status: AssessmentStatus
  phase: AssessmentPhase
  best_fit_confidence?: number
  preferred_role: Role | null
  current_role: Role | null
  best_fit_role: Role | null
  profile?: Record<string, unknown> | null
  language?: 'en' | 'th'
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

export interface AssessmentResult extends Omit<
  AssessmentSession,
  'current_question'
> {
  pillar_profile: PillarInsight[]
  ranked_roles: RankedRoleInsight[]
  preferred_role_gap_topics: RoadmapTopic[]
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
  selected_option_id: number | null
  selected_option_key: string | null
  selected_option_label: string | null
  scale_value: LikertScaleValue | null
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

export interface RoadmapsSessionState {
  completed: boolean
  answers: Record<string, number>
  completed_at: string | null
}

export interface RoadmapsScaleOption {
  label: string
  value: number
  label_th?: string
}

export interface RoadmapsCatalogDimension {
  key: string
  label: string
  track: 'psp' | 'sdlc'
  low_score_action: string
}

export interface RoadmapsCatalogQuestion {
  id: string
  prompt: string
  dimension_key: string
  display_order?: number
  translations?: {
    th?: {
      prompt?: string
    }
  }
}

export interface RoadmapsCatalog {
  version: string
  scale: RoadmapsScaleOption[]
  dimensions: RoadmapsCatalogDimension[]
  questions: RoadmapsCatalogQuestion[]
  role_guidance: string[]
}

export interface RoadmapsNextQuestionResponse {
  next_question: RoadmapsCatalogQuestion | null
}

export interface SessionCreatePayload {
  preferred_role_slug?: string
  /** The user's current role, used for gap-analysis during session creation. */
  current_role_slug?: string
  language?: 'en' | 'th'
  profile?: Record<string, unknown>
}

export interface BaseAnswerSubmitPayload {
  question_id: number
  response_time_ms?: number
  confidence_indicator?: ConfidenceIndicator
}

export interface OptionAnswerSubmitPayload extends BaseAnswerSubmitPayload {
  option_id: number
  scale_value?: never
}

export interface LikertAnswerSubmitPayload extends BaseAnswerSubmitPayload {
  scale_value: LikertScaleValue
  option_id?: never
}

export type AnswerSubmitPayload =
  | OptionAnswerSubmitPayload
  | LikertAnswerSubmitPayload

export interface ApiError {
  statusCode: number
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Roadmap evaluation types (shared between roadmaps.ts util and components)
// ---------------------------------------------------------------------------

export interface RadarDimension {
  key: string
  label: string
  value: number
  track: 'psp' | 'sdlc'
}

export interface RoadmapsEvaluation {
  dimensions: RadarDimension[]
  strengths: string[]
  growthAreas: string[]
  personalitySignals: string[]
}
