import { flushPromises as vueFlushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import RoadmapsPage from '../../app/pages/roadmaps/[sessionId].vue'
import { ACCOUNT_TOKEN_KEY } from '../../app/utils/constants'

async function flushPromises() {
  await vueFlushPromises()
  await nextTick()
  await vueFlushPromises()
  await nextTick()
}

function clonedSkillState() {
  return JSON.parse(JSON.stringify(skillStatePayload))
}

const {
  getSessionMock,
  getResultsMock,
  getHistoryMock,
  getSkillAssessmentCatalogMock,
  getSkillAssessmentStateMock,
  getRoleRoadmapMock,
  markHeldTopicMock,
  unmarkHeldTopicMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getResultsMock: vi.fn(),
  getHistoryMock: vi.fn(),
  getSkillAssessmentCatalogMock: vi.fn(),
  getSkillAssessmentStateMock: vi.fn(),
  getRoleRoadmapMock: vi.fn(),
  markHeldTopicMock: vi.fn(),
  unmarkHeldTopicMock: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({
  params: { sessionId: 'session-1' },
  query: {},
}))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    getSession: getSessionMock,
  }),
}))

vi.mock('~/composables/useAssessmentResults', () => ({
  useAssessmentResults: () => ({
    getResults: getResultsMock,
    getHistory: getHistoryMock,
  }),
}))

vi.mock('~/composables/useSkillAssessmentApiClient', () => ({
  useSkillAssessmentApiClient: () => ({
    getSkillAssessmentCatalog: getSkillAssessmentCatalogMock,
    getSkillAssessmentNextQuestion: vi.fn().mockResolvedValue({
      next_question: null,
    }),
    getSkillAssessmentState: getSkillAssessmentStateMock,
    saveSkillAssessmentState: vi.fn(),
    markHeldTopic: markHeldTopicMock,
    unmarkHeldTopic: unmarkHeldTopicMock,
  }),
}))

vi.mock('~/composables/useCatalogApi', () => ({
  useCatalogApi: () => ({
    getRoleRoadmap: getRoleRoadmapMock,
  }),
}))

const sessionPayload = {
  id: 'session-1',
  status: 'completed',
  phase: 'recommendation_ready',
  best_fit_confidence: 0.81,
  preferred_role: {
    id: 1,
    slug: 'backend-engineer',
    name: 'Backend Engineer',
  },
  best_fit_role: {
    id: 1,
    slug: 'backend-engineer',
    name: 'Backend Engineer',
  },
  profile: null,
  started_at: '2026-04-17T04:00:00Z',
  updated_at: '2026-04-17T04:02:00Z',
  completed_at: '2026-04-17T04:02:00Z',
  milestones: {
    answered_role_questions: 2,
    answered_core_role_questions: 2,
    answered_tie_break_questions: 0,
  },
  role_alignment_status: 'aligned',
  role_resolution_status: 'resolved',
  guidance_summary: 'Done.',
  current_question: null,
}

const resultsPayload = {
  ...sessionPayload,
  pillar_profile: [
    {
      key: 'systems_design',
      label: 'Systems Design',
      raw_score: 8,
      normalized_score: 0.84,
      evidence_count: 3,
    },
    {
      key: 'quality_focus',
      label: 'Quality Focus',
      raw_score: 7,
      normalized_score: 0.72,
      evidence_count: 2,
    },
  ],
  ranked_roles: [],
  preferred_role_gap_topics: [
    {
      id: 1,
      slug: 'api-design',
      title: 'API Design',
      description: 'Design contracts, validation, and versioning.',
      difficulty: 3,
      display_order: 1,
      parent_id: null,
      prerequisites: [],
    },
  ],
}

function externalTopic(
  slug: string,
  title: string,
  displayOrder: number,
  prerequisiteTitles: string[] = [],
) {
  return {
    slug,
    title,
    node_type: 'topic' as const,
    display_order: displayOrder,
    prerequisite_titles: prerequisiteTitles,
    subtopic_titles: [],
    follow_on_titles: [],
  }
}

const roadmapPayload = {
  role: { id: 1, slug: 'backend-engineer', name: 'Backend Engineer' },
  topics: [],
  prerequisite_edges: [],
  external_topics: [
    externalTopic('internet-and-web', 'Internet and web protocols', 1),
    externalTopic('data-storage', 'Data storage', 2, ['Internet and web protocols']),
    externalTopic('caching', 'Caching', 3, ['Data storage']),
  ],
  external_source: null,
}

const catalogPayload = {
  version: '1',
  scale: [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
  ],
  dimensions: [
    {
      key: 'psp-planning',
      label: 'PSP Planning',
      track: 'psp' as const,
      low_score_action: 'Practice planning discipline.',
    },
    {
      key: 'sdlc-design',
      label: 'System Design & Architecture',
      track: 'sdlc' as const,
      low_score_action: 'Practice architecture tradeoffs.',
    },
  ],
  questions: [],
  role_guidance: [
    'Lean into systems thinking.',
    'Keep strengthening delivery reliability.',
  ],
}

const skillStatePayload = {
  completed: true,
  answers: {},
  completed_at: '2026-04-17T04:05:00Z',
  topic_mastery: { 'backend-developer--databases': 0.25 },
  topic_states: [
    {
      topic_slug: 'backend-developer--databases',
      topic_title: 'Data storage',
      state: 'assessed_gap',
      mastery: 0.25,
    },
    {
      topic_slug: 'backend-developer--caching',
      topic_title: 'Caching',
      state: 'unassessed',
      mastery: null,
    },
    {
      topic_slug: 'backend-developer--version-control',
      topic_title: 'Version control',
      state: 'unassessed',
      mastery: null,
    },
    {
      topic_slug: 'backend-developer--internet-and-web',
      topic_title: 'Internet and web protocols',
      state: 'held',
      mastery: 1.0,
      statement: 'You said you can already work on "Internet and web protocols".',
    },
  ],
  recommended_topics: [
    {
      topic_slug: 'backend-developer--databases',
      topic_title: 'Data storage',
      state: 'assessed_gap',
      mastery: 0.25,
      reason: 'You rated "Data storage" low, and it builds on "Internet and web protocols".',
    },
    {
      topic_slug: 'backend-developer--caching',
      topic_title: 'Caching',
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Caching" yet.',
    },
    {
      topic_slug: 'backend-developer--version-control',
      topic_title: 'Version control',
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Version control" yet.',
    },
  ],
  next_topics: [
    {
      topic_slug: 'backend-developer--databases',
      topic_title: 'Data storage',
      state: 'assessed_gap',
      mastery: 0.25,
      reason: 'You rated "Data storage" low, and it builds on "Internet and web protocols".',
    },
    {
      topic_slug: 'backend-developer--caching',
      topic_title: 'Caching',
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Caching" yet.',
    },
    {
      topic_slug: 'backend-developer--version-control',
      topic_title: 'Version control',
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Version control" yet.',
    },
  ],
  readiness: {
    targets: {},
    overall_target: 0.6,
    overall_mastery: 0.25,
    assessed_count: 1,
  },
  progress: {
    answered: 12,
    total: 18,
    remaining: 6,
    floor: 12,
    ceiling: 18,
    settled: true,
  },
  confidence: 'high',
}

describe('roadmaps page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem(ACCOUNT_TOKEN_KEY)

    getSessionMock.mockResolvedValue(sessionPayload)
    getResultsMock.mockResolvedValue(resultsPayload)
    getHistoryMock.mockResolvedValue({
      id: 'session-1',
      phase: 'recommendation_ready',
      status: 'completed',
      answers: [],
    })
    getSkillAssessmentCatalogMock.mockResolvedValue(catalogPayload)
    getSkillAssessmentStateMock.mockResolvedValue(skillStatePayload)
    getRoleRoadmapMock.mockResolvedValue(roadmapPayload)
    markHeldTopicMock.mockImplementation(async () =>
      clonedSkillState(),
    )
    unmarkHeldTopicMock.mockImplementation(async () =>
      clonedSkillState(),
    )
  })

  it('renders the segmented completed roadmap dashboard', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    expect(wrapper.text()).toContain('Assessment complete')
    expect(wrapper.text()).toContain('Discovery result')
    expect(wrapper.text()).toContain('Knowledge + personality fit')
    expect(wrapper.text()).toContain('Strength distribution')
  })

  it('renders the suggested topics first, in the order the API returned them', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    const items = wrapper.findAll('[data-testid="next-topic-item"]')
    expect(items.length).toBe(3)

    const renderedOrder = items.map((item) => item.text())
    const indexOf = (needle: string) => {
      const found = renderedOrder.findIndex((text) => text.includes(needle))
      expect(found, `${needle} should be rendered`).toBeGreaterThanOrEqual(0)
      return found
    }

    // The API ordered Data storage (an assessed gap) before the unassessed
    // topics; the screen must keep that exact order.
    expect(indexOf('Data storage')).toBeLessThan(indexOf('Caching'))
    expect(indexOf('Caching')).toBeLessThan(indexOf('Version control'))

    expect(renderedOrder.join('\n')).toContain(
      'You rated "Data storage" low, and it builds on "Internet and web protocols".',
    )
  })

  it('labels an unassessed topic distinctly and never presents it as a gap', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    const items = wrapper.findAll('[data-testid="next-topic-item"]')
    const caching = items.find((item) => item.text().includes('Caching'))
    const databases = items.find((item) => item.text().includes('Data storage'))

    expect(caching).toBeDefined()
    expect(databases).toBeDefined()

    expect(databases!.text()).toContain('Gap to close')
    expect(caching!.text()).toContain('Not assessed yet')
    expect(caching!.text()).not.toContain('Gap to close')
  })

  it('keeps the full roadmap one click away instead of the landing view', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    expect(wrapper.text()).not.toContain('Recommended learning sequence')

    const toggle = wrapper
      .findAll('button')
      .find((button) => button.text().includes('View full roadmap'))
    expect(toggle).toBeDefined()

    await toggle!.trigger('click')
    await vi.dynamicImportSettled()
    await nextTick()

    expect(wrapper.text()).toContain('Recommended learning sequence')

    // A held topic stays visible on the full roadmap as the respondent's own
    // statement rather than a verdict.
    expect(wrapper.text()).toContain('Internet and web protocols')
    expect(wrapper.text()).toContain('You said you can already work on this')
  })

  it('shows the mark-as-held control for a signed-in respondent and updates the suggestions after marking', async () => {
    localStorage.setItem(ACCOUNT_TOKEN_KEY, 'token-1')
    const markedState = clonedSkillState()
    markedState.topic_states = markedState.topic_states.map((entry: { topic_slug: string }) =>
      entry.topic_slug === 'backend-developer--caching'
        ? {
            ...entry,
            state: 'held',
            mastery: 1.0,
            statement: 'You said you can already work on "Caching".',
          }
        : entry,
    )
    markedState.next_topics = markedState.next_topics.filter(
      (entry: { topic_slug: string }) => entry.topic_slug !== 'backend-developer--caching',
    )
    markHeldTopicMock.mockResolvedValue(markedState)

    const wrapper = await mountSuspended(RoadmapsPage)

    const items = wrapper.findAll('[data-testid="next-topic-item"]')
    const caching = items.find((item) => item.text().includes('Caching'))
    expect(caching).toBeDefined()

    const markButton = caching!
      .findAll('button')
      .find((button) => button.text().includes('I already know this'))
    expect(markButton).toBeDefined()

    await markButton!.trigger('click')
    await flushPromises()

    expect(markHeldTopicMock).toHaveBeenCalledWith('session-1', 'backend-developer--caching')

    const afterMark = wrapper.findAll('[data-testid="next-topic-item"]')
    expect(afterMark.find((item) => item.text().includes('Caching'))).toBeUndefined()

    // The undo affordance stays where the mark was made.
    const cachingChip = wrapper
      .findAll('[data-testid="recently-marked-list"] li')
      .find((li) => li.text().includes('Caching'))
    expect(cachingChip).toBeDefined()
    expect(cachingChip!.text()).toContain('You said you can already work on "Caching".')
    const undoButton = cachingChip!
      .findAll('button')
      .find((button) => button.text().includes('Undo mark'))
    expect(undoButton).toBeDefined()
  })

  it('restores the suggestion when the mark is undone from the same place', async () => {
    localStorage.setItem(ACCOUNT_TOKEN_KEY, 'token-1')
    const markedState = clonedSkillState()
    markedState.topic_states = markedState.topic_states.map((entry: { topic_slug: string }) =>
      entry.topic_slug === 'backend-developer--caching'
        ? {
            ...entry,
            state: 'held',
            mastery: 1.0,
            statement: 'You said you can already work on "Caching".',
          }
        : entry,
    )
    markedState.next_topics = markedState.next_topics.filter(
      (entry: { topic_slug: string }) => entry.topic_slug !== 'backend-developer--caching',
    )
    markHeldTopicMock.mockResolvedValue(markedState)
    unmarkHeldTopicMock.mockResolvedValue(clonedSkillState())

    const wrapper = await mountSuspended(RoadmapsPage)

    const cachingCard = wrapper
      .findAll('[data-testid="next-topic-item"]')
      .find((item) => item.text().includes('Caching'))
    const markButton = cachingCard!
      .findAll('button')
      .find((button) => button.text().includes('I already know this'))
    await markButton!.trigger('click')
    await flushPromises()

    const cachingUndoButton = wrapper
      .findAll('[data-testid="recently-marked-list"] li')
      .find((li) => li.text().includes('Caching'))!
      .findAll('button')
      .find((button) => button.text().includes('Undo mark'))
    await cachingUndoButton!.trigger('click')
    await flushPromises()

    expect(unmarkHeldTopicMock).toHaveBeenCalledWith('session-1', 'backend-developer--caching')
    expect(
      wrapper
        .findAll('[data-testid="next-topic-item"]')
        .some((item) => item.text().includes('Caching')),
    ).toBe(true)
    expect(
      wrapper
        .findAll('[data-testid="recently-marked-list"] li')
        .some((li) => li.text().includes('Caching')),
    ).toBe(false)
  })

  it('tells a signed-out respondent plainly that marking requires an account', async () => {
    const wrapper = await mountSuspended(RoadmapsPage)

    expect(wrapper.text()).toContain(
      'Marking a topic as already held requires an account.',
    )
    expect(
      wrapper.findAll('button').some((button) => button.text().includes('I already know this')),
    ).toBe(false)
  })
})


