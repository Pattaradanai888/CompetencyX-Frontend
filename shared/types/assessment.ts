export type AssessmentPhase = 'role_discovery' | 'recommendation_ready'

export type AssessmentStatus = 'in_progress' | 'completed'
/** Only Role Discovery asks through the session; the Skill Assessment has its own endpoints. */
export type QuestionStage = 'role'
export type QuestionType =
  | 'yes_no'
  | 'yes_no_maybe'
  | 'single_choice'
  | 'ranked_choice'
  | 'likert_5'
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
  /** The role as a Thai respondent reads it; empty when the English name is used in Thai too. */
  name_th?: string
  description?: string
  description_th?: string
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
  /** True when one of the suggested Assessable Topic Sets covers this node. */
  is_gap?: boolean
}

export interface ExternalRoadmapTopic {
  slug: string
  title: string
  topic_group?: string
  node_type: 'topic' | 'subtopic'
  display_order: number
  parent_title?: string
  prerequisite_titles: string[]
  subtopic_titles: string[]
  follow_on_titles: string[]
}

export interface ExternalRoadmapSource {
  source: string
  source_url: string
  retrieved_on: string | null
  node_count: number
}

export interface RoleRoadmap {
  role: Role
  topics: RoadmapTopic[]
  prerequisite_edges: {
    topic: string
    prerequisite: string
    required_mastery_threshold: number
    dependency_weight: number
  }[]
  external_topics: ExternalRoadmapTopic[]
  external_source: ExternalRoadmapSource | null
}

export interface SkillAssessmentReadiness {
  /** The mastery each set should reach for this role, keyed by set key. */
  targets: Record<string, number>
  overall_target: number
  overall_mastery: number
  assessed_count?: number
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
  /** Written by the backend in the session's language. */
  guidance_summary: string
  current_question: Question | null
}

export interface PillarInsight {
  key: string
  label: string
  label_th?: string
  raw_score: number
  normalized_score: number
  evidence_count: number
}

export interface RankedRoleInsight {
  slug: string
  name: string
  name_th?: string
  fit_score: number
  fit_share: number
  top_supporting_pillars: string[]
  top_supporting_pillars_th?: string[]
}

export interface AssessmentResult extends Omit<
  AssessmentSession,
  'current_question'
> {
  pillar_profile: PillarInsight[]
  ranked_roles: RankedRoleInsight[]
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
}

/**
 * Where the Skill Assessment stands. `settled` is Recommendation Stability:
 * no further answer could change the next topics, so the backend stops asking.
 */
export interface SkillAssessmentProgress {
  answered: number
  total: number
  remaining: number
  floor: number
  ceiling: number
  settled: boolean
}

export interface SkillAssessmentSessionState {
  completed: boolean
  answers: Record<string, number>
  completed_at: string | null
  topic_mastery?: Record<string, number>
  /** Every assessable unit and its state, so nothing unasked reads as a gap. */
  topic_states?: SkillAssessmentTopicEntry[]
  recommended_topics?: SkillAssessmentTopicEntry[]
  /** What the post-assessment screen reads: the next few topics, not the graph. */
  next_topics?: SkillAssessmentTopicEntry[]
  readiness?: SkillAssessmentReadiness
  progress?: SkillAssessmentProgress
  confidence?: 'low' | 'high' | null
}

export type TopicAssessmentState = 'held' | 'assessed_gap' | 'unassessed'

/**
 * One assessable unit as the backend reports it: a held topic, an assessed
 * gap, or an unassessed topic. An unassessed topic is never a gap.
 */
export interface SkillAssessmentTopicEntry {
  topic_slug: string
  topic_title: string
  /** The unit's Canonical Thai Wording, when the set carries one. */
  topic_title_th?: string | null
  /** The imported roadmap nodes the set covers, so a roadmap view marks them by slug. */
  node_slugs?: string[]
  state: TopicAssessmentState
  mastery: number | null
  reason?: string
  /** The same reason in Thai; the prerequisite names behind it live server-side. */
  reason_th?: string | null
  statement?: string
  statement_th?: string | null
  /** True only when this unit is held because the account marked it. */
  held_by_mark?: boolean
}

export interface SkillAssessmentScaleOption {
  label: string
  value: number
  label_th?: string
}

/** One radar axis: an Assessable Topic Set of the session's target role. */
export interface SkillAssessmentCatalogDimension {
  key: string
  label: string
  low_score_action: string
  translations?: {
    th?: {
      label?: string
      low_score_action?: string
    }
  }
}

export interface SkillAssessmentCatalogQuestion {
  id: string
  prompt: string
  dimension_key: string
  display_order?: number
  /** The Assessable Topic Set the item is about: its key and title. */
  topic_slug: string
  topic_title: string
  translations?: {
    en?: {
      prompt?: string
    }
    th?: {
      prompt?: string
    }
  }
}

export interface SkillAssessmentCatalog {
  version: string
  scale: SkillAssessmentScaleOption[]
  dimensions: SkillAssessmentCatalogDimension[]
  questions: SkillAssessmentCatalogQuestion[]
  role_guidance: string[]
}

export interface SkillAssessmentNextQuestionResponse {
  next_question: SkillAssessmentCatalogQuestion | null
  progress: SkillAssessmentProgress
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
// Accounts
// ---------------------------------------------------------------------------

/** The identity a respondent signs in with. */
export interface Account {
  id: string
  email: string
}

/** What register and sign-in return: the credential to hold, and who it is for. */
export interface AccountCredential {
  token: string
  user: Account
}

export interface AccountCredentialsPayload {
  email: string
  password: string
}

// ---------------------------------------------------------------------------
// Radar
// ---------------------------------------------------------------------------

/** One axis of the readiness radar: an assessed set and its Self-placed Mastery. */
export interface RadarDimension {
  key: string
  label: string
  value: number
}
