<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useLocale } from '~/composables/useLocale'
import type { ApiError, AssessmentSession, RoadmapTopic, Role } from '~~/shared/types/assessment'

interface RoleExplorerMeta {
  domain: string
  careerAreas: string[]
  workStyle: string[]
  environment: string[]
  experience: string[]
  skills: string[]
  interests: string[]
  responsibilities: string[]
  careerInfo: string
}

const route = useRoute('/assessment/start')
const { listRoleTopics, listRoles } = useCatalogApi()
const { createSession, getSession, isSubmitting, lastSessionId } =
  useAssessmentSession()
const { currentLanguage, isThai } = useLocale()

const PREFERRED_ROLE_KEY = 'competencyx:preferred-role'
const lastSessionSnapshot = ref<AssessmentSession | null>(null)

const preferredRoleSlug = ref<string | null>(null)
const pageError = ref<ApiError | null>(null)
const toast = useToast()
const router = useRouter()

const ROLE_META: Record<string, RoleExplorerMeta> = {
  'frontend-engineer': {
    domain: 'Technology',
    careerAreas: ['Front-end'],
    workStyle: ['Creative', 'Technical'],
    environment: ['Remote-friendly', 'Team-oriented'],
    experience: ['Entry Level', 'Junior', 'Mid Level'],
    skills: ['Programming', 'Design'],
    interests: ['Creativity', 'Technology', 'Helping People'],
    responsibilities: [
      'Build responsive product interfaces',
      'Translate design systems into reusable components',
      'Improve accessibility, performance, and user interaction quality',
    ],
    careerInfo:
      'Strong fit for students who enjoy visual problem solving, product polish, and fast feedback from users.',
  },
  'backend-engineer': {
    domain: 'Technology',
    careerAreas: ['Back-end'],
    workStyle: ['Analytical', 'Technical'],
    environment: ['Remote-friendly', 'Independent'],
    experience: ['Junior', 'Mid Level', 'Senior'],
    skills: ['Programming', 'Research'],
    interests: ['Problem Solving', 'Technology', 'Innovation'],
    responsibilities: [
      'Design APIs and service boundaries',
      'Model data and protect system reliability',
      'Debug performance, security, and integration issues',
    ],
    careerInfo:
      'A durable engineering path for builders who like logic, systems thinking, and reliable infrastructure.',
  },
  'full-stack-engineer': {
    domain: 'Technology',
    careerAreas: ['Full-stack'],
    workStyle: ['Technical', 'Strategic'],
    environment: ['Hybrid', 'Team-oriented'],
    experience: ['Junior', 'Mid Level', 'Senior'],
    skills: ['Programming', 'Project Management'],
    interests: ['Problem Solving', 'Business Growth', 'Technology'],
    responsibilities: [
      'Deliver product features across frontend and backend',
      'Balance user needs with technical constraints',
      'Coordinate data, UI, and deployment decisions',
    ],
    careerInfo:
      'Useful for product-minded engineers who want broad ownership and enjoy connecting multiple layers of an application.',
  },
  'mobile-engineer': {
    domain: 'Technology',
    careerAreas: ['Mobile'],
    workStyle: ['Creative', 'Technical'],
    environment: ['Remote-friendly', 'Team-oriented'],
    experience: ['Junior', 'Mid Level'],
    skills: ['Programming', 'Design'],
    interests: ['Technology', 'Creativity', 'Innovation'],
    responsibilities: [
      'Build mobile-first user experiences',
      'Integrate device capabilities and platform APIs',
      'Tune performance for real-world mobile conditions',
    ],
    careerInfo:
      'Best for students interested in touch interfaces, app ecosystems, and polished consumer or workforce tools.',
  },
  'devops-engineer': {
    domain: 'Technology',
    careerAreas: ['DevOps', 'Cloud'],
    workStyle: ['Analytical', 'Technical'],
    environment: ['Remote-friendly', 'Team-oriented'],
    experience: ['Mid Level', 'Senior'],
    skills: ['Programming', 'Project Management'],
    interests: ['Problem Solving', 'Technology', 'Innovation'],
    responsibilities: [
      'Automate delivery pipelines',
      'Operate cloud infrastructure and observability',
      'Improve system resilience and deployment safety',
    ],
    careerInfo:
      'A strong path for students who like automation, reliability, and making teams ship with confidence.',
  },
  'data-engineer': {
    domain: 'Data',
    careerAreas: ['Data Engineer'],
    workStyle: ['Analytical', 'Technical'],
    environment: ['Hybrid', 'Independent'],
    experience: ['Junior', 'Mid Level', 'Senior'],
    skills: ['Programming', 'Data Analysis'],
    interests: ['Problem Solving', 'Technology', 'Business Growth'],
    responsibilities: [
      'Create data pipelines and transformation workflows',
      'Improve data quality, access, and reliability',
      'Support analytics, reporting, and machine learning teams',
    ],
    careerInfo:
      'Ideal for students who enjoy databases, automation, and turning messy information into usable assets.',
  },
  'data-scientist': {
    domain: 'Data',
    careerAreas: ['Data Scientist', 'Machine Learning'],
    workStyle: ['Analytical', 'Research'],
    environment: ['Hybrid', 'Independent'],
    experience: ['Mid Level', 'Senior'],
    skills: ['Data Analysis', 'Research', 'Programming'],
    interests: ['Problem Solving', 'Innovation', 'Business Growth'],
    responsibilities: [
      'Explore patterns and build predictive models',
      'Validate assumptions with experiments and statistics',
      'Communicate findings that guide product or business decisions',
    ],
    careerInfo:
      'A research-heavy path for students who like statistics, modeling, and explaining what data means.',
  },
  'data-analyst': {
    domain: 'Data',
    careerAreas: ['Data Analyst'],
    workStyle: ['Analytical', 'Communication-focused'],
    environment: ['Hybrid', 'Team-oriented'],
    experience: ['Entry Level', 'Junior', 'Mid Level'],
    skills: ['Data Analysis', 'Communication'],
    interests: ['Business Growth', 'Helping People', 'Problem Solving'],
    responsibilities: [
      'Build dashboards and reports',
      'Translate stakeholder questions into metrics',
      'Explain trends, risks, and opportunities from data',
    ],
    careerInfo:
      'A practical entry point for students who like business questions, evidence, and clear communication.',
  },
  'ux-ui-designer': {
    domain: 'Design',
    careerAreas: ['UI Design', 'UX Design', 'Product Design'],
    workStyle: ['Creative', 'Communication-focused'],
    environment: ['Remote-friendly', 'Team-oriented'],
    experience: ['Entry Level', 'Junior', 'Mid Level'],
    skills: ['Design', 'Research', 'Communication'],
    interests: ['Creativity', 'Helping People', 'Innovation'],
    responsibilities: [
      'Research user needs and map product flows',
      'Design interfaces, prototypes, and design-system patterns',
      'Collaborate with engineering to refine usable experiences',
    ],
    careerInfo:
      'Good for students who care about clarity, behavior, visual systems, and making technology easier to use.',
  },
  'product-manager': {
    domain: 'Business',
    careerAreas: ['Product Manager'],
    workStyle: ['Strategic', 'Leadership-focused'],
    environment: ['Hybrid', 'Team-oriented'],
    experience: ['Mid Level', 'Senior'],
    skills: ['Project Management', 'Communication', 'Research'],
    interests: ['Business Growth', 'Helping People', 'Innovation'],
    responsibilities: [
      'Define product goals and prioritize opportunities',
      'Coordinate design, engineering, and stakeholder decisions',
      'Measure outcomes and refine product direction',
    ],
    careerInfo:
      'A cross-functional path for students who enjoy decisions, tradeoffs, user value, and business outcomes.',
  },
  'business-analyst': {
    domain: 'Business',
    careerAreas: ['Business Analyst'],
    workStyle: ['Analytical', 'Communication-focused'],
    environment: ['Hybrid', 'Team-oriented'],
    experience: ['Entry Level', 'Junior', 'Mid Level'],
    skills: ['Research', 'Communication', 'Data Analysis'],
    interests: ['Business Growth', 'Helping People', 'Problem Solving'],
    responsibilities: [
      'Clarify requirements and business processes',
      'Bridge users, stakeholders, and technical teams',
      'Document workflows, risks, and acceptance criteria',
    ],
    careerInfo:
      'A strong bridge role for students who like structured thinking, communication, and operational improvement.',
  },
  'project-manager': {
    domain: 'Operations',
    careerAreas: ['Project Manager', 'Scrum Master'],
    workStyle: ['Leadership-focused', 'Strategic'],
    environment: ['Hybrid', 'Team-oriented'],
    experience: ['Junior', 'Mid Level', 'Senior'],
    skills: ['Project Management', 'Communication'],
    interests: ['Helping People', 'Business Growth', 'Problem Solving'],
    responsibilities: [
      'Plan delivery milestones and manage dependencies',
      'Keep teams aligned on scope, risk, and timing',
      'Communicate progress and unblock execution',
    ],
    careerInfo:
      'Useful for students who like organizing work, reducing ambiguity, and helping teams deliver consistently.',
  },
  'qa-test-engineer': {
    domain: 'Technology',
    careerAreas: ['QA Engineer', 'Software Tester', 'Test Automation'],
    workStyle: ['Analytical', 'Technical'],
    environment: ['Hybrid', 'Independent'],
    experience: ['Entry Level', 'Junior', 'Mid Level'],
    skills: ['Programming', 'Research'],
    interests: ['Problem Solving', 'Helping People', 'Technology'],
    responsibilities: [
      'Design test strategies and automation coverage',
      'Find defects before they reach users',
      'Improve release confidence and product quality signals',
    ],
    careerInfo:
      'A detail-oriented engineering path for students who enjoy quality, systems, and preventing user pain.',
  },
}

const DEFAULT_META: RoleExplorerMeta = {
  domain: 'Technology',
  careerAreas: ['Full-stack'],
  workStyle: ['Technical', 'Analytical'],
  environment: ['Hybrid', 'Team-oriented'],
  experience: ['Junior', 'Mid Level'],
  skills: ['Programming', 'Communication'],
  interests: ['Technology', 'Problem Solving'],
  responsibilities: [
    'Clarify user and business requirements',
    'Apply role-specific tools and technical practices',
    'Collaborate with teams to deliver useful outcomes',
  ],
  careerInfo: '',
}

function getRoleMeta(role: Role | null | undefined): RoleExplorerMeta {
  if (!role) {
    return DEFAULT_META
  }
  return ROLE_META[role.slug] ?? DEFAULT_META
}

if (typeof route.query.role === 'string') {
  preferredRoleSlug.value = route.query.role
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, route.query.role)
  }
}

onMounted(() => {
  const stored = localStorage.getItem(PREFERRED_ROLE_KEY)
  if (stored && !preferredRoleSlug.value) {
    preferredRoleSlug.value = stored
  }
})

const t = computed(() => {
  if (isThai.value) {
    return {
      backLink: 'ย้อนกลับไปหน้าภาพรวม',
      resumeBtn: 'กลับไปทำเซสชันล่าสุด',
      title: 'เลือกตำแหน่งงานเป้าหมาย',
      subtitle:
        'สำรวจรายละเอียดทักษะ และแผนการเรียนรู้ของแต่ละตำแหน่งเป้าหมายก่อนเริ่มทำการประเมิน',
      searchPlaceholder: 'ค้นหาตำแหน่งงาน ทักษะ หรือความสนใจ...',
      clearFilters: 'ล้างการค้นหา',
      emptyCatalog: 'ไม่พบตำแหน่งงานในระบบ',
      noRolesMatch: 'ไม่พบตำแหน่งงานที่ตรงกับคำค้นหา ลองล้างการค้นหาดู',
      preparingSession: 'กำลังเตรียมแบบประเมิน...',
      startPhase2: 'เลือกตำแหน่งนี้และเริ่มประเมิน',
      chooseRoleToContinue: 'เลือกตำแหน่งเพื่อไปต่อ',
      settingUpQuestion: 'กำลังจัดเตรียมคำถามแรกของคุณ...',
      previewEyebrow: 'พรีวิวแผนการเรียนรู้',
      previewDefaultTitle: 'เลือกตำแหน่งเพื่อดูทิศทางการเรียนรู้',
      previewDefaultSub:
        'เลือกตำแหน่งงานเป้าหมายเพื่อดูพรีวิวหัวข้อแรกและทิศทางโดยรวมของการประเมินทักษะ',
      previewSelectedSub:
        'ทบทวนหัวข้อสำคัญที่วิถีการพัฒนานี้เน้นย้ำและพรีวิวเนื้อหาก่อนที่คุณจะเริ่มทำแบบประเมิน',
      previewLoading: 'กำลังโหลดข้อมูลแผนการเรียนรู้...',
      previewNoRoadmap:
        'ยังไม่มีแผนพรีวิวสำหรับบทบาทนี้ แต่คุณยังสามารถเริ่มประเมินได้',
      previewSelectHint: 'เลือกตำแหน่งเป้าหมายเพื่อแสดงพรีวิวหัวข้อ',
      selectedRole: 'ตำแหน่งที่เลือก',
      choosePrompt: 'เลือกตำแหน่งจากรายการด้านซ้ายเพื่อดูรายละเอียด',
      skills: 'ทักษะที่เกี่ยวข้อง',
      responsibilities: 'ความรับผิดชอบหลัก',
      careerInfo: 'ข้อมูลเส้นทางอาชีพ',
      roadmapPreview: 'พรีวิวหัวข้อการเรียนรู้ใน Roadmap',
      noTopics:
        'ยังไม่มีหัวข้อพรีวิวสำหรับบทบาทนี้ แต่คุณยังสามารถเริ่มประเมินได้',
      expandDetails: 'แสดงรายละเอียดเพิ่มเติม',
      collapseDetails: 'ย่อรายละเอียด',
      workStyle: 'สไตล์การทำงาน',
      interests: 'ความสนใจที่เกี่ยวข้อง',
      careerAreas: 'กลุ่มสายงานอาชีพ',
      environment: 'สภาพแวดล้อมการทำงาน',
    }
  }

  return {
    backLink: 'Back to overview',
    resumeBtn: 'Resume previous session',
    title: 'Choose your preferred role',
    subtitle: 'Search and select a target role to begin the skill assessment.',
    searchPlaceholder: 'Search roles, skills, or interests...',
    clearFilters: 'Clear search',
    emptyCatalog: 'Role catalog is empty.',
    noRolesMatch:
      'No roles match the current search. Reset search or try a broader term.',
    preparingSession: 'Preparing your assessment...',
    startPhase2: 'Select this role and start assessment',
    chooseRoleToContinue: 'Choose a role to continue',
    settingUpQuestion: 'Setting up your first question...',
    previewEyebrow: 'Roadmap preview',
    previewDefaultTitle: 'Choose a path to preview its learning arc',
    previewDefaultSub:
      'Select a preferred role to preview the first topics and the overall direction of the assessment.',
    previewSelectedSub:
      'Review the first topics this path emphasizes before you begin.',
    previewLoading: 'Loading roadmap preview…',
    previewNoRoadmap: 'No roadmap preview is available for this role.',
    previewSelectHint: 'Select a role to preview roadmap topics.',
    selectedRole: 'Selected role',
    choosePrompt: 'Select a role from the left panel to inspect details.',
    skills: 'Relevant skills',
    responsibilities: 'Core responsibilities',
    careerInfo: 'Career information',
    roadmapPreview: 'Roadmap topic preview',
    noTopics: 'No roadmap preview is available for this role yet.',
    expandDetails: 'Expand Details',
    collapseDetails: 'Collapse Details',
    workStyle: 'Work style',
    interests: 'Relevant interests',
    careerAreas: 'Career areas',
    environment: 'Work environment',
  }
})

const { data: roles, pending: rolesPending } = await useAsyncData(
  'start-roles',
  listRoles,
  {
    default: () => [] as Role[],
  },
)

const { data: topics, pending: topicsPending } = await useAsyncData(
  'start-role-topics',
  async () => {
    if (!preferredRoleSlug.value) {
      return [] as RoadmapTopic[]
    }

    return await listRoleTopics(preferredRoleSlug.value)
  },
  {
    watch: [preferredRoleSlug],
    default: () => [] as RoadmapTopic[],
  },
)

const selectedRole = computed(
  () =>
    roles.value.find((role) => role.slug === preferredRoleSlug.value) ?? null,
)

const searchQuery = ref(
  typeof route.query.search === 'string' ? route.query.search : '',
)

watch(
  [searchQuery, preferredRoleSlug],
  ([search, role]) => {
    const query: Record<string, string> = {}
    if (role) query.role = role
    if (search) query.search = search
    router.replace({ path: '/assessment/start', query })
  },
  { flush: 'post' },
)

const filteredRoles = computed(() => {
  let result = roles.value

  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    result = result.filter((role) => {
      const meta = getRoleMeta(role)
      const searchable = [
        role.name,
        role.description ?? '',
        meta.domain,
        ...meta.careerAreas,
        ...meta.workStyle,
        ...meta.environment,
        ...meta.experience,
        ...meta.skills,
        ...meta.interests,
        ...meta.responsibilities,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }

  return result
})

const resultSummary = computed(() => {
  if (!roles.value.length) {
    return t.value.emptyCatalog
  }

  if (!filteredRoles.value.length) {
    return t.value.noRolesMatch
  }

  if (isThai.value) {
    return `กำลังแสดง ${filteredRoles.value.length} จากทั้งหมด ${roles.value.length} ตำแหน่งงาน`
  }
  return `Showing ${filteredRoles.value.length} of ${roles.value.length} roles.`
})

const selectedMeta = computed(() => getRoleMeta(selectedRole.value))
const selectedRoleTopics = computed(() => topics.value.slice(0, 6))
const selectedRoleName = computed(
  () => selectedRole.value?.name ?? t.value.choosePrompt,
)

const startButtonLabel = computed(() => {
  if (isSubmitting.value) return t.value.preparingSession
  return selectedRole.value ? t.value.startPhase2 : t.value.chooseRoleToContinue
})

const canStart = computed(
  () => !isSubmitting.value && Boolean(selectedRole.value),
)

function clearFilters() {
  searchQuery.value = ''
}

function selectPreferredRole(slug: string) {
  preferredRoleSlug.value = slug
  if (import.meta.client) {
    localStorage.setItem(PREFERRED_ROLE_KEY, slug)
  }
}

async function handleStart() {
  if (!canStart.value) {
    return
  }

  pageError.value = null

  try {
    const session = await createSession({
      preferred_role_slug: preferredRoleSlug.value ?? undefined,
      language: currentLanguage.value,
    })

    const maxAttempts = 4
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const hydratedSession = await getSession(session.id)
      if (hydratedSession.current_question?.stage === 'skill') {
        break
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }

    await navigateTo(`/roadmaps/${session.id}`)
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: isThai.value
        ? 'ไม่สามารถเริ่มต้นแบบประเมินได้'
        : 'Could not start assessment',
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  }
}

const isSurvey2Complete = computed(() => {
  const profile = lastSessionSnapshot.value?.profile
  if (!profile) return false
  const survey2 = (profile as Record<string, unknown>).survey2
  return (
    typeof survey2 === 'object' &&
    survey2 !== null &&
    (survey2 as Record<string, unknown>).completed === true
  )
})

const lastSessionRoute = computed(() => {
  if (!lastSessionId.value) return null
  const snap = lastSessionSnapshot.value
  if (!snap) return `/assessment/${lastSessionId.value}`

  if (isSurvey2Complete.value || snap.preferred_role)
    return `/roadmaps/${lastSessionId.value}`

  if (snap.status === 'completed')
    return `/results/${lastSessionId.value}`

  return `/assessment/${lastSessionId.value}`
})

const resumeLabel = computed(() => {
  if (!lastSessionSnapshot.value) return t.value.resumeBtn
  if (isSurvey2Complete.value) {
    return isThai.value
      ? 'ดูผลลัพธ์เซสชันล่าสุด'
      : 'View last session result'
  }
  if (lastSessionSnapshot.value.status === 'completed') {
    return isThai.value ? 'ดูผลการประเมินล่าสุด' : 'View last evaluation'
  }
  return t.value.resumeBtn
})

onMounted(async () => {
  if (!lastSessionId.value) return
  try {
    lastSessionSnapshot.value = await getSession(lastSessionId.value)
  } catch {
    lastSessionSnapshot.value = null
  }
})

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | เลือกตำแหน่งงาน'
      : 'CompetencyX | Choose role',
  ),
  description: computed(() =>
    isThai.value
      ? 'สำรวจและเลือกตำแหน่งเป้าหมายก่อนเริ่มการประเมินทักษะ'
      : 'Choose your preferred role before starting the skill assessment.',
  ),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <!-- Navigation back & resume -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/" class="editorial-link text-sm">
        {{ t.backLink }}
      </NuxtLink>
      <NuxtLink
        v-if="lastSessionId"
        :to="lastSessionRoute ?? `/assessment/${lastSessionId}`"
        class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
      >
        {{ resumeLabel }}
      </NuxtLink>
    </div>

    <!-- Onboarding Header -->
    <header class="mt-6 border-b border-border-subtle pb-6">
      <p class="eyebrow">Onboarding</p>
      <h1 class="mt-2 font-display text-4xl leading-tight text-ink md:text-5xl">
        {{ t.title }}
      </h1>
      <p class="mt-2 text-sm text-ink-soft">
        {{ t.subtitle }}
      </p>
    </header>

    <div class="role-selection-layout">
      <!-- Left Panel: Search & Cards grid -->
      <section class="role-selector-panel">
        <!-- Search bar -->
        <div class="relative block w-full">
          <svg
            aria-hidden="true"
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            id="role-search"
            v-model="searchQuery"
            name="role-search"
            type="text"
            autocomplete="off"
            :placeholder="t.searchPlaceholder"
            class="w-full rounded-full border border-border-subtle bg-surface-card py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-soft/50 transition focus-visible:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          />
        </div>

        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-ink-soft" aria-live="polite">
            {{ resultSummary }}
          </p>
          <button
            v-if="searchQuery.trim() !== ''"
            type="button"
            class="editorial-link text-xs font-semibold"
            @click="clearFilters"
          >
            {{ t.clearFilters }}
          </button>
        </div>

        <!-- Role List Grid with Inline Expansion for Mobile -->
        <div
          v-if="rolesPending"
          class="role-cards-grid"
          aria-busy="true"
          :aria-label="isThai ? 'กำลังโหลดตำแหน่งงาน' : 'Loading role catalog'"
        >
          <div
            v-for="index in 5"
            :key="index"
            class="skeleton h-20 rounded-lg"
          />
        </div>
        <div v-else-if="filteredRoles.length" class="role-cards-grid">
          <div
            v-for="role in filteredRoles"
            :key="role.id"
            class="role-card-container flex flex-col"
          >
            <!-- Card trigger button -->
            <button
              type="button"
              class="option-card role-card group flex w-full flex-col text-left rounded-md p-3"
              :class="
                role.slug === preferredRoleSlug
                  ? 'border-accent bg-accent-soft/20 shadow-[0_16px_34px_rgba(234,112,31,0.14)]'
                  : ''
              "
              :aria-label="`Select ${role.name}`"
              :aria-pressed="role.slug === preferredRoleSlug ? 'true' : 'false'"
              @click="selectPreferredRole(role.slug)"
            >
              <div class="flex items-start justify-between gap-2 w-full">
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-ink text-sm leading-tight">
                    {{ role.name }}
                  </p>
                  <p
                    class="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed"
                  >
                    {{ role.description || getRoleMeta(role).careerInfo }}
                  </p>
                </div>
                <span
                  v-if="role.slug === preferredRoleSlug"
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-white mt-0.5"
                >
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.5L5 9L9.5 4"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </button>

            <!-- Inline Mobile Details: Expanding inline on mobile -->
            <div
              v-if="role.slug === preferredRoleSlug"
              class="mobile-inline-details lg:hidden"
            >
              <div class="space-y-4">
                <div>
                  <h3 class="font-display text-lg font-bold text-ink">
                    {{ role.name }}
                  </h3>
                  <p class="mt-1.5 text-xs text-ink-soft leading-relaxed">
                    {{ role.description || '' }}
                  </p>
                </div>

                <div class="role-details-section">
                  <h4
                    class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                  >
                    {{ t.responsibilities }}
                  </h4>
                  <ul class="role-details-list mt-1.5">
                    <li
                      v-for="resp in getRoleMeta(role).responsibilities"
                      :key="resp"
                      class="role-details-list-item text-xs"
                    >
                      {{ resp }}
                    </li>
                  </ul>
                </div>

                <div class="role-details-section">
                  <h4
                    class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                  >
                    {{ t.skills }}
                  </h4>
                  <div class="role-details-tags mt-1.5">
                    <span
                      v-for="skill in getRoleMeta(role).skills"
                      :key="skill"
                      class="role-details-tag text-[0.7rem] px-2 py-0.5"
                    >
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div class="role-details-section">
                  <h4
                    class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                  >
                    {{ t.roadmapPreview }}
                  </h4>
                  <div
                    v-if="topicsPending"
                    class="role-details-loading-preview mt-1.5"
                  >
                    <span
                      v-for="index in 3"
                      :key="index"
                      class="skeleton h-8 rounded-md"
                    />
                  </div>
                  <div
                    v-else-if="selectedRoleTopics.length"
                    class="role-details-topics mt-1.5"
                  >
                    <div
                      v-for="topic in selectedRoleTopics"
                      :key="topic.id"
                      class="role-details-topic-item text-xs py-1.5 px-3"
                    >
                      {{ topic.title }}
                    </div>
                  </div>
                  <p v-else class="text-xs text-ink-soft mt-1">
                    {{ t.noTopics }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-2">
                  <div
                    v-if="
                      getRoleMeta(role).workStyle &&
                      getRoleMeta(role).workStyle.length
                    "
                  >
                    <h5
                      class="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-soft"
                    >
                      {{ t.workStyle }}
                    </h5>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="style in getRoleMeta(role).workStyle"
                        :key="style"
                        class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                      >
                        {{ style }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="
                      getRoleMeta(role).interests &&
                      getRoleMeta(role).interests.length
                    "
                  >
                    <h5
                      class="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-soft"
                    >
                      {{ t.interests }}
                    </h5>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="interest in getRoleMeta(role).interests"
                        :key="interest"
                        class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                      >
                        {{ interest }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="
                      getRoleMeta(role).careerAreas &&
                      getRoleMeta(role).careerAreas.length
                    "
                  >
                    <h5
                      class="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-soft"
                    >
                      {{ t.careerAreas }}
                    </h5>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="area in getRoleMeta(role).careerAreas"
                        :key="area"
                        class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                      >
                        {{ area }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="
                      getRoleMeta(role).environment &&
                      getRoleMeta(role).environment.length
                    "
                  >
                    <h5
                      class="text-[0.6rem] font-extrabold uppercase tracking-wider text-ink-soft"
                    >
                      {{ t.environment }}
                    </h5>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="env in getRoleMeta(role).environment"
                        :key="env"
                        class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                      >
                        {{ env }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-border-subtle/40">
                  <button
                    type="button"
                    class="cx-button-primary w-full text-xs min-h-[2.5rem] py-2 px-4"
                    :disabled="!canStart"
                    @click="handleStart"
                  >
                    <span
                      v-if="isSubmitting"
                      class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    {{ startButtonLabel }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="rounded-md border border-border-subtle bg-surface-card p-6 text-center text-sm text-ink-soft"
          aria-live="polite"
        >
          {{ t.noRolesMatch }}
        </div>
      </section>

      <!-- Desktop Right Panel: Selected Details Panel -->
      <aside
        class="role-details-panel hidden lg:block"
        aria-labelledby="selected-role-title"
      >
        <!-- Header -->
        <div class="role-details-header">
          <p class="eyebrow">{{ t.selectedRole }}</p>
          <h2 id="selected-role-title" class="role-details-header__title">
            {{ selectedRoleName }}
          </h2>
        </div>

        <!-- Scrollable Body content -->
        <div class="role-details-body">
          <p class="text-base leading-relaxed text-ink-soft/90">
            {{ selectedRole ? selectedRole.description || '' : t.choosePrompt }}
          </p>

          <div v-if="selectedRole" class="space-y-6">
            <!-- 1. Responsibilities (Always Visible) -->
            <div class="role-details-section">
              <h3 class="role-details-section__title">
                {{ t.responsibilities }}
              </h3>
              <ul class="role-details-list">
                <li
                  v-for="responsibility in selectedMeta.responsibilities"
                  :key="responsibility"
                  class="role-details-list-item"
                >
                  {{ responsibility }}
                </li>
              </ul>
            </div>

            <!-- 2. Required Skills (Always Visible) -->
            <div class="role-details-section">
              <h3 class="role-details-section__title">
                {{ t.skills }}
              </h3>
              <div class="role-details-tags">
                <span
                  v-for="skill in selectedMeta.skills"
                  :key="skill"
                  class="role-details-tag"
                >
                  {{ skill }}
                </span>
              </div>
            </div>

            <!-- 3. Roadmap Preview / Recommended Competencies (Always Visible) -->
            <div class="role-details-section">
              <h3 class="role-details-section__title">
                {{ t.roadmapPreview }}
              </h3>
              <div
                v-if="topicsPending"
                aria-live="polite"
                role="status"
                class="role-details-loading-preview"
              >
                <span
                  v-for="index in 3"
                  :key="index"
                  class="skeleton h-11 rounded-md"
                />
              </div>
              <div
                v-else-if="selectedRoleTopics.length"
                class="role-details-topics"
              >
                <div
                  v-for="topic in selectedRoleTopics"
                  :key="topic.id"
                  class="role-details-topic-item"
                >
                  {{ topic.title }}
                </div>
              </div>
              <p v-else class="text-sm text-ink-soft">{{ t.noTopics }}</p>
            </div>

            <!-- 5. Additional Metadata Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div
                v-if="selectedMeta.workStyle && selectedMeta.workStyle.length"
                class="role-details-section mb-0"
              >
                <h4
                  class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                >
                  {{ t.workStyle }}
                </h4>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="style in selectedMeta.workStyle"
                    :key="style"
                    class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
                  >
                    {{ style }}
                  </span>
                </div>
              </div>

              <div
                v-if="selectedMeta.interests && selectedMeta.interests.length"
                class="role-details-section mb-0"
              >
                <h4
                  class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                >
                  {{ t.interests }}
                </h4>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="interest in selectedMeta.interests"
                    :key="interest"
                    class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
                  >
                    {{ interest }}
                  </span>
                </div>
              </div>

              <div
                v-if="
                  selectedMeta.careerAreas && selectedMeta.careerAreas.length
                "
                class="role-details-section mb-0"
              >
                <h4
                  class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                >
                  {{ t.careerAreas }}
                </h4>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="area in selectedMeta.careerAreas"
                    :key="area"
                    class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
                  >
                    {{ area }}
                  </span>
                </div>
              </div>

              <div
                v-if="
                  selectedMeta.environment && selectedMeta.environment.length
                "
                class="role-details-section mb-0"
              >
                <h4
                  class="text-[0.65rem] font-extrabold uppercase tracking-wider text-ink"
                >
                  {{ t.environment }}
                </h4>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="env in selectedMeta.environment"
                    :key="env"
                    class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
                  >
                    {{ env }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="role-details-footer">
          <div
            v-if="pageError"
            aria-live="polite"
            role="alert"
            class="cx-error-panel mb-4 p-4 text-sm"
          >
            {{ getErrorMessage(pageError) }}
            {{
              isThai
                ? 'โปรดพยายามเริ่มต้นใหม่อีกครั้ง'
                : 'Please try starting again.'
            }}
          </div>

          <button
            type="button"
            class="cx-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canStart"
            @click="handleStart"
          >
            <span
              v-if="isSubmitting"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
            {{ startButtonLabel }}
          </button>
          <p
            v-if="isSubmitting"
            aria-live="polite"
            role="status"
            class="mt-2 text-center text-xs text-ink-soft"
          >
            {{ t.settingUpQuestion }}
          </p>
        </div>
      </aside>
    </div>
  </main>
</template>
