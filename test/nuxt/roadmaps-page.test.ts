import { flushPromises as vueFlushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import RoadmapsPage from '../../app/pages/roadmaps/[sessionId].vue'
import { AUTO_ADVANCE_DELAY_MS } from '../../app/utils/constants'

async function flushPromises() {
  await vueFlushPromises()
  await nextTick()
  await vueFlushPromises()
  await nextTick()
}

/** Lets the auto-advance timer fire and the next-question round trip settle. */
async function settleAnswer() {
  await new Promise((resolve) =>
    setTimeout(resolve, AUTO_ADVANCE_DELAY_MS + 80),
  )
  await flushPromises()
  await flushPromises()
}

function clonedSkillState() {
  return JSON.parse(JSON.stringify(skillStatePayload))
}

const {
  getSessionMock,
  getResultsMock,
  getSkillAssessmentCatalogMock,
  getSkillAssessmentStateMock,
  getSkillAssessmentNextQuestionMock,
  getRoleRoadmapMock,
  saveSkillAssessmentStateMock,
  markHeldTopicMock,
  unmarkHeldTopicMock,
  toastAddMock,
  forgetMock,
  isSignedIn,
} = await vi.hoisted(async () => ({
  // Imports are not in scope inside a hoisted block; the ref is what the
  // mocked current-account composable hands the page and the marking
  // composable, so it has to be reactive.
  getSessionMock: vi.fn(),
  getResultsMock: vi.fn(),
  getSkillAssessmentCatalogMock: vi.fn(),
  getSkillAssessmentStateMock: vi.fn(),
  getSkillAssessmentNextQuestionMock: vi.fn(),
  getRoleRoadmapMock: vi.fn(),
  saveSkillAssessmentStateMock: vi.fn(),
  markHeldTopicMock: vi.fn(),
  unmarkHeldTopicMock: vi.fn(),
  toastAddMock: vi.fn(),
  forgetMock: vi.fn(),
  isSignedIn: (await import('vue')).ref(false),
}))

mockNuxtImport('useRoute', () => () => ({
  params: { sessionId: 'session-1' },
  query: {},
}))

mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))

vi.mock('~/composables/useAssessmentSession', () => ({
  useAssessmentSession: () => ({
    getSession: getSessionMock,
  }),
}))

vi.mock('~/composables/useAssessmentResults', () => ({
  useAssessmentResults: () => ({
    getResults: getResultsMock,
  }),
}))

vi.mock('~/composables/useSkillAssessmentApiClient', () => ({
  useSkillAssessmentApiClient: () => ({
    getSkillAssessmentCatalog: getSkillAssessmentCatalogMock,
    getSkillAssessmentNextQuestion: getSkillAssessmentNextQuestionMock,
    getSkillAssessmentState: getSkillAssessmentStateMock,
    saveSkillAssessmentState: saveSkillAssessmentStateMock,
    markHeldTopic: markHeldTopicMock,
    unmarkHeldTopic: unmarkHeldTopicMock,
  }),
}))

vi.mock('~/composables/useCatalogApi', () => ({
  useCatalogApi: () => ({
    getRoleRoadmap: getRoleRoadmapMock,
  }),
}))

// Sign-in state is what the current-account composable says it is, not a
// storage key: the page and the marking composable read it from there.
vi.mock('~/composables/useCurrentAccount', () => ({
  useCurrentAccount: () => ({
    account: ref(null),
    isSignedIn,
    load: vi.fn(),
    remember: vi.fn(),
    forget: forgetMock,
    signOut: vi.fn(),
  }),
}))

const sessionPayload = {
  id: 'session-1',
  status: 'completed',
  phase: 'recommendation_ready',
  language: 'en',
  best_fit_confidence: 0.81,
  preferred_role: {
    id: 1,
    slug: 'backend-developer',
    name: 'Backend Engineer',
    name_th: 'วิศวกรฝั่งเซิร์ฟเวอร์',
  },
  best_fit_role: {
    id: 1,
    slug: 'backend-developer',
    name: 'Backend Engineer',
    name_th: 'วิศวกรฝั่งเซิร์ฟเวอร์',
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
  role: { id: 1, slug: 'backend-developer', name: 'Backend Engineer' },
  topics: [],
  prerequisite_edges: [],
  external_topics: [
    externalTopic('internet-and-web', 'Internet and web protocols', 1),
    externalTopic('data-storage', 'Data storage', 2, [
      'Internet and web protocols',
    ]),
    externalTopic('caching', 'Caching', 3, ['Data storage']),
    // Covered by no Assessable Topic Set: carries neither badge nor tag.
    externalTopic('apis', 'API design', 4, ['Caching']),
  ],
  external_source: null,
}

const DATABASES = 'backend-developer--databases'
const CACHING = 'backend-developer--caching'
const VERSION_CONTROL = 'backend-developer--version-control'
const INTERNET = 'backend-developer--internet-and-web'

function catalogQuestion(id: string, title: string, order: number) {
  return {
    id,
    prompt: `I could work on "${title}" in a real project without help.`,
    dimension_key: id,
    display_order: order,
    topic_slug: id,
    topic_title: title,
  }
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
      key: DATABASES,
      label: 'Data storage',
      low_score_action: 'Practice data modelling.',
    },
    {
      key: CACHING,
      label: 'Caching',
      low_score_action: 'Practice cache invalidation.',
    },
    {
      key: VERSION_CONTROL,
      label: 'Version control',
      low_score_action: 'Practice branching.',
    },
    {
      key: INTERNET,
      label: 'Internet and web protocols',
      low_score_action: 'Practice HTTP.',
    },
  ],
  questions: [
    catalogQuestion(DATABASES, 'Data storage', 1),
    catalogQuestion(CACHING, 'Caching', 2),
    catalogQuestion(VERSION_CONTROL, 'Version control', 3),
    catalogQuestion(INTERNET, 'Internet and web protocols', 4),
  ],
  role_guidance: [
    'Lean into systems thinking.',
    'Keep strengthening delivery reliability.',
  ],
}

const progressDone = {
  answered: 12,
  total: 18,
  remaining: 6,
  floor: 12,
  ceiling: 18,
  settled: true,
}

const skillStatePayload = {
  completed: true,
  answers: { [DATABASES]: 2, [INTERNET]: 5 },
  completed_at: '2026-04-17T04:05:00Z',
  topic_mastery: { [DATABASES]: 0.25, [INTERNET]: 1.0 },
  topic_states: [
    {
      topic_slug: DATABASES,
      topic_title: 'Data storage',
      topic_title_th: 'การจัดเก็บข้อมูล',
      node_slugs: ['data-storage'],
      state: 'assessed_gap',
      mastery: 0.25,
    },
    {
      topic_slug: CACHING,
      topic_title: 'Caching',
      topic_title_th: null,
      node_slugs: ['caching'],
      state: 'unassessed',
      mastery: null,
    },
    {
      topic_slug: VERSION_CONTROL,
      topic_title: 'Version control',
      topic_title_th: null,
      node_slugs: ['version-control'],
      state: 'unassessed',
      mastery: null,
    },
    {
      topic_slug: INTERNET,
      topic_title: 'Internet and web protocols',
      topic_title_th: 'อินเทอร์เน็ตและโปรโตคอลเว็บ',
      node_slugs: ['internet-and-web'],
      state: 'held',
      mastery: 1.0,
      statement:
        'You said you can already work on "Internet and web protocols".',
      held_by_mark: false,
    },
  ],
  recommended_topics: [
    {
      topic_slug: DATABASES,
      topic_title: 'Data storage',
      node_slugs: ['data-storage'],
      state: 'assessed_gap',
      mastery: 0.25,
      reason:
        'You rated "Data storage" low, and it builds on "Internet and web protocols".',
    },
    {
      topic_slug: CACHING,
      topic_title: 'Caching',
      node_slugs: ['caching'],
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Caching" yet.',
    },
    {
      topic_slug: VERSION_CONTROL,
      topic_title: 'Version control',
      node_slugs: ['version-control'],
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Version control" yet.',
    },
  ],
  next_topics: [
    {
      topic_slug: DATABASES,
      topic_title: 'Data storage',
      node_slugs: ['data-storage'],
      state: 'assessed_gap',
      mastery: 0.25,
      reason:
        'You rated "Data storage" low, and it builds on "Internet and web protocols".',
    },
    {
      topic_slug: CACHING,
      topic_title: 'Caching',
      node_slugs: ['caching'],
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Caching" yet.',
    },
    {
      topic_slug: VERSION_CONTROL,
      topic_title: 'Version control',
      node_slugs: ['version-control'],
      state: 'unassessed',
      mastery: null,
      reason: 'The assessment has not asked about "Version control" yet.',
    },
  ],
  readiness: {
    targets: { [DATABASES]: 0.7, [INTERNET]: 0.8 },
    overall_target: 0.6,
    overall_mastery: 0.25,
    assessed_count: 2,
  },
  progress: progressDone,
  confidence: 'high',
}

/** The state of a respondent who has not answered anything yet. */
function unansweredState() {
  return {
    completed: false,
    answers: {},
    completed_at: null,
    topic_states: [],
    recommended_topics: [],
    next_topics: [],
    readiness: {
      targets: {},
      overall_target: 0.6,
      overall_mastery: 0,
      assessed_count: 0,
    },
    progress: {
      answered: 0,
      total: 18,
      remaining: 18,
      floor: 12,
      ceiling: 18,
      settled: false,
    },
    confidence: null,
  }
}

function nextQuestion(id: string | null, answered: number, settled = false) {
  return {
    next_question: id
      ? catalogPayload.questions.find((question) => question.id === id)
      : null,
    progress: {
      answered,
      total: 18,
      remaining: 18 - answered,
      floor: 12,
      ceiling: 18,
      settled,
    },
  }
}

/** Marks Caching as held by the account: it leaves the suggestions. */
function markedState() {
  const state = clonedSkillState()
  state.topic_states = state.topic_states.map(
    (entry: { topic_slug: string }) =>
      entry.topic_slug === CACHING
        ? {
            ...entry,
            state: 'held',
            mastery: null,
            statement: 'You said you can already work on "Caching".',
            // The API flags a unit held by a mark, so only that one offers undo.
            held_by_mark: true,
          }
        : entry,
  )
  state.next_topics = state.next_topics.filter(
    (entry: { topic_slug: string }) => entry.topic_slug !== CACHING,
  )
  return state
}

async function openFullRoadmap(wrapper: VueWrapper) {
  // Looked up by what it controls, so the helper works in either language.
  const toggle = wrapper.get('button[aria-controls="full-roadmap"]')
  await toggle.trigger('click')
  await vi.dynamicImportSettled()
  await flushPromises()
}

function roadmapNode(wrapper: VueWrapper, title: string) {
  const node = wrapper
    .findAll('[data-testid="roadmap-topic"]')
    .find((article) => article.find('h3').text() === title)
  expect(node, `${title} should be on the roadmap`).toBeDefined()
  return node!
}

describe('roadmaps page', () => {
  beforeEach(() => {
    // Mocks queued with mockResolvedValueOnce must not leak between tests,
    // and the page's useAsyncData caches by key across mounts in the same
    // Nuxt instance, so a test would otherwise read the previous test's state.
    vi.resetAllMocks()
    clearNuxtData()
    isSignedIn.value = false

    getSessionMock.mockResolvedValue(sessionPayload)
    getResultsMock.mockResolvedValue(resultsPayload)
    getSkillAssessmentCatalogMock.mockResolvedValue(catalogPayload)
    getSkillAssessmentStateMock.mockResolvedValue(clonedSkillState())
    getSkillAssessmentNextQuestionMock.mockResolvedValue(
      nextQuestion(null, 12, true),
    )
    getRoleRoadmapMock.mockResolvedValue(roadmapPayload)
    saveSkillAssessmentStateMock.mockImplementation(async () =>
      clonedSkillState(),
    )
    markHeldTopicMock.mockImplementation(async () => clonedSkillState())
    unmarkHeldTopicMock.mockImplementation(async () => clonedSkillState())
  })

  describe('while the assessment is in progress', () => {
    beforeEach(() => {
      getSkillAssessmentStateMock
        .mockResolvedValueOnce(unansweredState())
        .mockResolvedValue(clonedSkillState())
    })

    it('asks the backend for the next item with every answer held, and submits when it says to stop even though items remain', async () => {
      getSkillAssessmentNextQuestionMock
        .mockResolvedValueOnce(nextQuestion(DATABASES, 0))
        .mockResolvedValueOnce(nextQuestion(CACHING, 1))
        .mockResolvedValueOnce(nextQuestion(null, 2, true))

      const wrapper = await mountSuspended(RoadmapsPage)
      expect(wrapper.findAll('[data-testid="next-topic-item"]').length).toBe(0)
      expect(wrapper.text()).toContain('"Data storage"')

      await wrapper
        .findAll('.skill-assessment-scale__option')[1]!
        .trigger('click')
      await settleAnswer()

      expect(getSkillAssessmentNextQuestionMock).toHaveBeenLastCalledWith(
        'session-1',
        { [DATABASES]: 2 },
      )
      expect(wrapper.text()).toContain('"Caching"')
      expect(saveSkillAssessmentStateMock).not.toHaveBeenCalled()

      await wrapper
        .findAll('.skill-assessment-scale__option')[4]!
        .trigger('click')
      await settleAnswer()

      expect(getSkillAssessmentNextQuestionMock).toHaveBeenLastCalledWith(
        'session-1',
        { [DATABASES]: 2, [CACHING]: 5 },
      )
      // Two of four items answered: the backend said stop, so the page
      // submits what it holds rather than asking the remaining two.
      expect(saveSkillAssessmentStateMock).toHaveBeenCalledWith('session-1', {
        completed: true,
        answers: { [DATABASES]: 2, [CACHING]: 5 },
      })
      // The finished view reads the refetched state, not the snapshot
      // captured on load.
      expect(getSkillAssessmentStateMock).toHaveBeenCalledTimes(2)
      expect(wrapper.findAll('[data-testid="next-topic-item"]').length).toBe(3)
      expect(wrapper.text()).toContain('Data storage')
    })

    it('reads progress from the backend: answered of up to the ceiling, and ready to review once settled', async () => {
      getSkillAssessmentNextQuestionMock
        .mockResolvedValueOnce(nextQuestion(DATABASES, 0))
        .mockResolvedValueOnce(nextQuestion(CACHING, 1, true))

      const wrapper = await mountSuspended(RoadmapsPage)
      expect(wrapper.text()).toContain('0 answered of up to 18')
      expect(wrapper.text()).toContain('Still calibrating')

      await wrapper
        .findAll('.skill-assessment-scale__option')[1]!
        .trigger('click')
      await settleAnswer()

      expect(wrapper.text()).toContain('1 answered of up to 18')
      expect(wrapper.text()).toContain('Ready to review')
      const progressbar = wrapper.get('[role="progressbar"]')
      // 1 of a ceiling of 18, not 1 of the 4 catalog items.
      expect(progressbar.attributes('aria-valuenow')).toBe('6')
    })

    it('reports a failed next-question request and stays on the same item, retrying on the next answer', async () => {
      getSkillAssessmentNextQuestionMock
        .mockResolvedValueOnce(nextQuestion(DATABASES, 0))
        .mockRejectedValueOnce({ statusCode: 503, data: {} })
        .mockResolvedValueOnce(nextQuestion(CACHING, 1))

      const wrapper = await mountSuspended(RoadmapsPage)
      expect(wrapper.text()).toContain('"Data storage"')

      await wrapper
        .findAll('.skill-assessment-scale__option')[1]!
        .trigger('click')
      await settleAnswer()

      expect(toastAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Could not fetch the next question',
          color: 'error',
        }),
      )
      // Not advanced, not invented: the same item is still on screen and
      // nothing was submitted.
      expect(wrapper.text()).toContain('"Data storage"')
      expect(saveSkillAssessmentStateMock).not.toHaveBeenCalled()

      await wrapper
        .findAll('.skill-assessment-scale__option')[2]!
        .trigger('click')
      await settleAnswer()

      expect(getSkillAssessmentNextQuestionMock).toHaveBeenLastCalledWith(
        'session-1',
        { [DATABASES]: 3 },
      )
      expect(wrapper.text()).toContain('"Caching"')
    })

    it('submits on mount when saved answers exist and the backend has no further question', async () => {
      getSkillAssessmentStateMock.mockReset()
      getSkillAssessmentStateMock
        .mockResolvedValueOnce({
          ...unansweredState(),
          answers: { [DATABASES]: 2, [INTERNET]: 5 },
        })
        .mockResolvedValue(clonedSkillState())
      getSkillAssessmentNextQuestionMock.mockResolvedValue(
        nextQuestion(null, 2, true),
      )

      const wrapper = await mountSuspended(RoadmapsPage)
      await flushPromises()

      expect(saveSkillAssessmentStateMock).toHaveBeenCalledWith('session-1', {
        completed: true,
        answers: { [DATABASES]: 2, [INTERNET]: 5 },
      })
      expect(wrapper.findAll('[data-testid="next-topic-item"]').length).toBe(3)
    })
  })

  describe('the finished view', () => {
    it('renders the segmented completed roadmap dashboard from the backend figures', async () => {
      const wrapper = await mountSuspended(RoadmapsPage)

      expect(wrapper.text()).toContain('Assessment complete')
      expect(wrapper.text()).toContain('Discovery result')
      expect(wrapper.text()).toContain('Knowledge + personality fit')
      expect(wrapper.text()).toContain('Strength distribution')
      // readiness.overall_mastery and overall_target, not a client average.
      expect(wrapper.text()).toContain('25%')
      expect(wrapper.text()).toContain('60%')
      // No PSP/SDLC tracks: the page describes the assessment taken.
      expect(wrapper.text()).not.toContain('PSP discipline')
      expect(wrapper.text()).not.toContain('SDLC delivery')
    })

    it('plots only the rated sets on the radar and sorts strengths and gaps by mastery', async () => {
      const wrapper = await mountSuspended(RoadmapsPage)

      // Axis labels wrap across SVG lines, so match the start of each.
      const radar = wrapper.get('[data-testid="readiness-radar"]')
      expect(radar.text()).toContain('Data storage')
      expect(radar.text()).toContain('Internet and web')
      expect(radar.text()).not.toContain('Caching')
      expect(radar.text()).not.toContain('Version control')

      const strengths = wrapper.get('[data-testid="strength-cards"]')
      expect(strengths.text()).toContain('Internet and web protocols')
      expect(strengths.text()).not.toContain('Data storage')
      expect(wrapper.text()).toContain('Top gap areas: Data storage')
    })

    it('says the suggestions settled when confidence is high', async () => {
      const wrapper = await mountSuspended(RoadmapsPage)
      expect(wrapper.get('[data-testid="confidence-note"]').text()).toBe(
        'Answering more would not change these suggestions.',
      )
    })

    it('says the assessment ended at the limit when confidence is low', async () => {
      getSkillAssessmentStateMock.mockResolvedValue({
        ...clonedSkillState(),
        confidence: 'low',
      })
      const wrapper = await mountSuspended(RoadmapsPage)
      expect(wrapper.get('[data-testid="confidence-note"]').text()).toContain(
        'ended at the question limit',
      )
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
      const databases = items.find((item) =>
        item.text().includes('Data storage'),
      )

      expect(caching).toBeDefined()
      expect(databases).toBeDefined()

      expect(databases!.text()).toContain('Gap to close')
      expect(caching!.text()).toContain('Not assessed yet')
      expect(caching!.text()).not.toContain('Gap to close')
    })

    it('reads the Thai role name and Thai set wording in a Thai session', async () => {
      getSessionMock.mockResolvedValue({ ...sessionPayload, language: 'th' })
      const wrapper = await mountSuspended(RoadmapsPage)

      expect(wrapper.get('h1').text()).toContain('วิศวกรฝั่งเซิร์ฟเวอร์')
      expect(wrapper.get('[data-testid="readiness-radar"]').text()).toContain(
        'การจัดเก็บข้อมูล',
      )
    })
  })

  describe('the full roadmap', () => {
    it('is one click away instead of the landing view, and marks nodes by the slugs the API carries', async () => {
      const wrapper = await mountSuspended(RoadmapsPage)

      expect(wrapper.text()).not.toContain('Recommended learning sequence')
      await openFullRoadmap(wrapper)
      expect(wrapper.text()).toContain('Recommended learning sequence')

      // Held: a node covered by a held set's node_slugs carries the
      // respondent's own statement, never a verdict.
      const internet = roadmapNode(wrapper, 'Internet and web protocols')
      expect(internet.text()).toContain('You said you can already work on this')
      expect(internet.text()).not.toContain('Priority')

      // Priority: only nodes covered by next_topics[].node_slugs.
      expect(roadmapNode(wrapper, 'Data storage').text()).toContain('Priority')
      expect(roadmapNode(wrapper, 'Caching').text()).toContain('Priority')

      // Covered by no set: neither.
      const apis = roadmapNode(wrapper, 'API design')
      expect(apis.text()).not.toContain('Priority')
      expect(apis.text()).not.toContain('You said you can already work on this')
    })

    it('lists the suggested topics themselves, each tagged Priority, when no roadmap is imported for the role', async () => {
      getRoleRoadmapMock.mockResolvedValue({
        ...roadmapPayload,
        external_topics: [],
      })
      const wrapper = await mountSuspended(RoadmapsPage)
      await openFullRoadmap(wrapper)

      const nodes = wrapper.findAll('[data-testid="roadmap-topic"]')
      expect(nodes.map((node) => node.find('h3').text())).toEqual([
        'Data storage',
        'Caching',
        'Version control',
      ])
      for (const node of nodes) {
        expect(node.text()).toContain('Priority')
      }
    })

    it('localises the search fallback links', async () => {
      getSessionMock.mockResolvedValue({ ...sessionPayload, language: 'th' })
      const wrapper = await mountSuspended(RoadmapsPage)
      await openFullRoadmap(wrapper)

      const node = roadmapNode(wrapper, 'API design')
      expect(node.text()).toContain('ค้นหาบนเว็บ')
      expect(node.text()).toContain('ดูบน YouTube')
      expect(node.text()).not.toMatch(/Search the web|Watch on YouTube/)
    })
  })

  describe('marking a Held Topic', () => {
    it('shows the mark control to a signed-in respondent and moves the topic to the marked list, with its roadmap badge', async () => {
      isSignedIn.value = true
      markHeldTopicMock.mockResolvedValue(markedState())

      const wrapper = await mountSuspended(RoadmapsPage)
      await openFullRoadmap(wrapper)
      expect(roadmapNode(wrapper, 'Caching').text()).toContain('Priority')

      const caching = wrapper
        .findAll('[data-testid="next-topic-item"]')
        .find((item) => item.text().includes('Caching'))
      expect(caching).toBeDefined()

      const markButton = caching!
        .findAll('button')
        .find((button) => button.text().includes('I already know this'))
      expect(markButton).toBeDefined()

      await markButton!.trigger('click')
      await flushPromises()

      expect(markHeldTopicMock).toHaveBeenCalledWith('session-1', CACHING)

      const afterMark = wrapper.findAll('[data-testid="next-topic-item"]')
      expect(
        afterMark.find((item) => item.text().includes('Caching')),
      ).toBeUndefined()

      // The undo affordance stays where the mark was made.
      const cachingChip = wrapper
        .findAll('[data-testid="recently-marked-list"] li')
        .find((li) => li.text().includes('Caching'))
      expect(cachingChip).toBeDefined()
      expect(cachingChip!.text()).toContain(
        'You said you can already work on "Caching".',
      )
      expect(
        cachingChip!
          .findAll('button')
          .find((button) => button.text().includes('Undo mark')),
      ).toBeDefined()

      // The roadmap node the set covers reacts without a reload.
      const node = roadmapNode(wrapper, 'Caching')
      expect(node.text()).toContain('You said you can already work on this')
      expect(node.text()).not.toContain('Priority')
    })

    it('restores the suggestion and the Priority tag when the mark is undone', async () => {
      isSignedIn.value = true
      markHeldTopicMock.mockResolvedValue(markedState())
      unmarkHeldTopicMock.mockResolvedValue(clonedSkillState())

      const wrapper = await mountSuspended(RoadmapsPage)
      await openFullRoadmap(wrapper)

      const cachingCard = wrapper
        .findAll('[data-testid="next-topic-item"]')
        .find((item) => item.text().includes('Caching'))
      await cachingCard!
        .findAll('button')
        .find((button) => button.text().includes('I already know this'))!
        .trigger('click')
      await flushPromises()

      await wrapper
        .findAll('[data-testid="recently-marked-list"] li')
        .find((li) => li.text().includes('Caching'))!
        .findAll('button')
        .find((button) => button.text().includes('Undo mark'))!
        .trigger('click')
      await flushPromises()

      expect(unmarkHeldTopicMock).toHaveBeenCalledWith('session-1', CACHING)
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
      const node = roadmapNode(wrapper, 'Caching')
      expect(node.text()).toContain('Priority')
      expect(node.text()).not.toContain('You said you can already work on this')
    })

    it('tells a signed-out respondent plainly that marking requires an account', async () => {
      const wrapper = await mountSuspended(RoadmapsPage)

      expect(
        wrapper.get('[data-testid="mark-requires-account"]').text(),
      ).toContain('Marking a topic as already held requires an account.')
      expect(
        wrapper
          .findAll('button')
          .some((button) => button.text().includes('I already know this')),
      ).toBe(false)
    })

    it('drops a credential the API rejects and falls back to the notice', async () => {
      isSignedIn.value = true
      markHeldTopicMock.mockRejectedValue({ statusCode: 401, data: {} })

      const wrapper = await mountSuspended(RoadmapsPage)
      const markButton = wrapper
        .findAll('button')
        .find((button) => button.text().includes('I already know this'))
      await markButton!.trigger('click')
      await flushPromises()

      expect(forgetMock).toHaveBeenCalled()
      expect(toastAddMock).not.toHaveBeenCalled()
    })
  })
})
