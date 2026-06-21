<script setup lang="ts">
import { motion } from 'motion-v'
import { sortRankedRolesDescending } from '~/utils/assessment'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  RankedRoleInsight,
  Role,
} from '~~/shared/types/assessment'

const route = useRoute('/results/[sessionId]')
const sessionId = computed(() => route.params.sessionId as string)
const { getResults } = useAssessmentResults()
const { createSession, getSession } = useAssessmentSession()
const toast = useToast()

const { data: _fetchData, error: fetchError } = await useAsyncData(
  `results-${sessionId.value}`,
  async () => {
    const [sessionSnapshot, resultsAttempt] = await Promise.all([
      getSession(sessionId.value),
      getResults(sessionId.value).catch((error) => {
        const apiError = error as ApiError
        if (apiError.statusCode === 404) return null
        throw error
      }),
    ])
    return { sessionSnapshot, resultsAttempt }
  },
)

const sessionSnapshot = _fetchData.value?.sessionSnapshot
const { isThai: globalIsThai } = useLocale()
const isThai = computed(() => sessionSnapshot?.language === 'th' || globalIsThai.value)

const t = computed(() => {
  if (isThai.value) {
    return {
      loadError: 'ไม่สามารถโหลดผลลัพธ์ได้',
      startPhase2Error: 'ไม่สามารถเริ่มเฟส 2 ได้',
      backLink: 'กลับไปหน้าหลัก',
      phaseComplete: 'จบเฟส 1 แล้ว',
      titleSuffix: 'คือทิศทางบทบาทที่เหมาะกับคุณที่สุด',
      primaryRole: 'บทบาทหลัก',
      closeFit: 'ตัวเลือกใกล้เคียง',
      defaultSelection: 'ตัวเลือกเริ่มต้น',
      selected: 'เลือกแล้ว',
      phase2WillStartWith: 'เฟส 2 จะเริ่มด้วย',
      selectPrimaryRole: 'เลือกบทบาทหลัก',
      useThisRole: 'ใช้บทบาทนี้แทน',
      assignment2: 'แบบประเมินที่ 2',
      continueWith: 'ทำต่อด้วย',
      defaultPath:
        'บทบาทที่ระบบแนะนำถูกเตรียมไว้เป็นเส้นทางเริ่มต้นสำหรับแบบประเมินถัดไปแล้ว',
      alternativePath:
        'คุณเลือกบทบาทซอฟต์แวร์ทางเลือกสำหรับการประเมินทักษะแล้ว',
      selectedRole: 'บทบาทที่เลือก',
      preparing: 'กำลังเตรียมแบบประเมินที่ 2...',
      continue: 'ไปต่อแบบประเมินที่ 2',
      fallbackRole: 'บทบาทซอฟต์แวร์ที่แนะนำ',
      fallbackDescription:
        'คำตอบของคุณชี้ว่าบทบาทนี้เป็นทิศทางถัดไปที่ชัดเจนที่สุด',
      strongestSignals: 'สัญญาณที่เด่นที่สุด',
      closeFitDescription:
        'เป็นบทบาทที่ใกล้เคียงจากรูปแบบการทำงานและความชอบของคุณ',
    }
  }

  return {
    loadError: 'Could not load results',
    startPhase2Error: 'Could not start Phase 2',
    backLink: 'Back to landing page',
    phaseComplete: 'Phase 1 complete',
    titleSuffix: 'looks like your strongest role direction.',
    primaryRole: 'Primary role',
    closeFit: 'Close fit',
    defaultSelection: 'Default selection',
    selected: 'Selected',
    phase2WillStartWith: 'Phase 2 will start with',
    selectPrimaryRole: 'Select primary role',
    useThisRole: 'Use this role instead',
    assignment2: 'Assignment 2',
    continueWith: 'Continue with',
    defaultPath:
      'Your recommended role is already prepared as the default path for the next assignment.',
    alternativePath:
      'You have selected an alternative software role for your skill assessment.',
    selectedRole: 'Selected role',
    preparing: 'Preparing Assignment 2...',
    continue: 'Continue to Assignment 2',
    fallbackRole: 'Recommended software role',
    fallbackDescription:
      'Your answers point toward this path as the clearest next direction.',
    strongestSignals: 'Strongest signals',
    closeFitDescription:
      'A close fit based on your work-style and preference pattern.',
  }
})

if (fetchError.value) {
  toast.add({
    title: t.value.loadError,
    description: getErrorMessage(fetchError.value as ApiError) ?? undefined,
    color: 'error',
  })
}

if (
  sessionSnapshot?.current_question ||
  sessionSnapshot?.status !== 'completed'
) {
  await navigateTo(
    `/assessment/${sessionSnapshot?.id ?? route.params.sessionId}`,
  )
}

const results = ref(_fetchData.value?.resultsAttempt ?? null)
const continueButton = ref<HTMLButtonElement | null>(null)
const isContinuing = ref(false)

const rankedRoles = computed(() =>
  sortRankedRolesDescending(results.value?.ranked_roles ?? []),
)

const primaryRankedRole = computed(() => rankedRoles.value[0] ?? null)
const alternativeRoles = computed(() => rankedRoles.value.slice(1, 3))
const primaryRole = computed(
  () =>
    results.value?.best_fit_role ??
    results.value?.preferred_role ??
    ({
      id: 0,
      slug: primaryRankedRole.value?.slug ?? 'recommended-role',
      name: primaryRankedRole.value?.name ?? t.value.fallbackRole,
    } satisfies Role),
)

const selectedRole = ref<RankedRoleInsight | Role | null>(null)

watch(
  primaryRole,
  (newVal) => {
    if (newVal && !selectedRole.value) {
      selectedRole.value = newVal
    }
  },
  { immediate: true },
)

const selectedRoleName = computed(
  () =>
    selectedRole.value?.name ?? primaryRole.value?.name ?? t.value.selectedRole,
)

function getRoleDescription(role: RankedRoleInsight | Role | null): string {
  if (!role) {
    return t.value.fallbackDescription
  }

  if ('description' in role && role.description) {
    return role.description
  }

  if ('top_supporting_pillars' in role && role.top_supporting_pillars.length) {
    return `${t.value.strongestSignals}: ${role.top_supporting_pillars.join(', ')}.`
  }

  return t.value.closeFitDescription
}

async function handleContinue() {
  const role = selectedRole.value
  if (!role?.slug || isContinuing.value) {
    return
  }

  if (role.slug === primaryRole.value?.slug) {
    await navigateTo(`/roadmaps/${route.params.sessionId}`)
    return
  }

  isContinuing.value = true

  try {
    const session = await createSession({
      preferred_role_slug: role.slug,
      language: sessionSnapshot?.language,
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
    toast.add({
      title: t.value.startPhase2Error,
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  } finally {
    isContinuing.value = false
  }
}

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | ผลแนะนำบทบาท'
      : 'CompetencyX | Role recommendation',
  ),
  description: computed(() =>
    isThai.value
      ? 'ทบทวนบทบาทซอฟต์แวร์ที่ระบบแนะนำและตัวเลือกใกล้เคียงก่อนทำแบบประเมินทักษะต่อ'
      : 'Review your primary recommended software role and top alternatives before continuing to skill assessment.',
  ),
})

onMounted(async () => {
  await nextTick()
  continueButton.value?.focus()
})
</script>

<template>
  <main v-if="results" id="main-content" class="page-wrap">
    <div class="mb-4">
      <NuxtLink to="/" class="editorial-link text-sm">
        {{ t.backLink }}
      </NuxtLink>
    </div>

    <motion.section
      class="result-spotlight mx-auto max-w-5xl p-6 text-center md:p-8 lg:p-10"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4 }"
      aria-labelledby="results-title"
    >
      <div class="mx-auto max-w-3xl">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          <span aria-hidden="true">✓</span>
          {{ t.phaseComplete }}
        </div>

        <h1
          id="results-title"
          class="mx-auto mt-8 max-w-4xl font-display text-4xl font-semibold leading-tight text-ink md:text-6xl"
        >
          {{ primaryRole.name }} {{ t.titleSuffix }}
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">
          {{ getRoleDescription(primaryRankedRole || primaryRole) }}
        </p>
      </div>

      <section class="mt-10 grid gap-4 text-left md:grid-cols-3">
        <!-- Primary role card -->
        <article
          :class="[
            'result-role-card p-5 md:p-6 transition-all duration-200 relative border cursor-pointer flex flex-col justify-between',
            selectedRole?.slug === primaryRole.slug
              ? 'border-accent ring-2 ring-accent/30 bg-accent/[0.02]'
              : 'border-border-subtle hover:border-ink-soft/40',
            isContinuing ? 'pointer-events-none opacity-80' : '',
          ]"
          @click="selectedRole = primaryRole"
        >
          <div>
            <div
              v-if="selectedRole?.slug === primaryRole.slug"
              class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold shadow-sm"
              aria-hidden="true"
            >
              ✓
            </div>
            <p class="eyebrow">{{ t.primaryRole }}</p>
            <h2 class="mt-3 text-2xl font-black text-ink">
              {{ primaryRole.name }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-ink-soft">
              {{ getRoleDescription(primaryRankedRole || primaryRole) }}
            </p>
          </div>
          <div class="mt-6">
            <div
              v-if="selectedRole?.slug === primaryRole.slug"
              class="rounded-xl border border-accent/20 bg-accent/8 px-4 py-3"
            >
              <p
                class="text-xs font-extrabold uppercase tracking-[0.08em] text-accent"
              >
                {{ t.defaultSelection }}
              </p>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                {{ t.phase2WillStartWith }}
                <span class="font-semibold text-ink">{{
                  primaryRole.name
                }}</span
                >.
              </p>
            </div>
            <button
              v-else
              type="button"
              class="cx-button-secondary w-full"
              :disabled="isContinuing"
            >
              {{ t.selectPrimaryRole }}
            </button>
          </div>
        </article>

        <!-- Alternative role cards -->
        <article
          v-for="(role, index) in alternativeRoles"
          :key="role.slug"
          :class="[
            'result-role-card p-5 md:p-6 transition-all duration-200 relative border cursor-pointer flex flex-col justify-between',
            selectedRole?.slug === role.slug
              ? 'border-accent ring-2 ring-accent/30 bg-accent/[0.02]'
              : 'border-border-subtle hover:border-ink-soft/40',
            isContinuing ? 'pointer-events-none opacity-80' : '',
          ]"
          @click="selectedRole = role"
        >
          <div>
            <div
              v-if="selectedRole?.slug === role.slug"
              class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold shadow-sm"
              aria-hidden="true"
            >
              ✓
            </div>
            <p class="eyebrow">{{ t.closeFit }} {{ index + 1 }}</p>
            <h2 class="mt-3 text-2xl font-black text-ink">{{ role.name }}</h2>
            <p class="mt-3 text-sm leading-7 text-ink-soft">
              {{ getRoleDescription(role) }}
            </p>
          </div>
          <div class="mt-6">
            <div
              v-if="selectedRole?.slug === role.slug"
              class="rounded-xl border border-accent/20 bg-accent/8 px-4 py-3"
            >
              <p
                class="text-xs font-extrabold uppercase tracking-[0.08em] text-accent"
              >
                {{ t.selected }}
              </p>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                {{ t.phase2WillStartWith }}
                <span class="font-semibold text-ink">{{ role.name }}</span
                >.
              </p>
            </div>
            <button
              v-else
              type="button"
              class="cx-button-secondary w-full"
              :disabled="isContinuing"
            >
              {{ t.useThisRole }}
            </button>
          </div>
        </article>
      </section>

      <section
        class="mt-8 rounded-xl border border-border-subtle bg-surface-elevated/90 p-5 text-left shadow-[0_18px_44px_rgba(74,54,35,0.08)] md:p-6"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="max-w-2xl">
            <p class="eyebrow">{{ t.assignment2 }}</p>
            <h2 class="mt-3 text-2xl font-bold text-ink">
              {{ t.continueWith }} {{ selectedRoleName }}
            </h2>
            <p class="mt-2 text-sm leading-7 text-ink-soft">
              {{
                selectedRole?.slug === primaryRole?.slug
                  ? t.defaultPath
                  : t.alternativePath
              }}
            </p>
          </div>
          <div
            class="rounded-full border border-border-subtle bg-paper-strong px-4 py-2"
          >
            <p
              class="text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft"
            >
              {{ t.selectedRole }}
            </p>
            <p class="mt-1 text-sm font-bold text-ink">
              {{ selectedRoleName }}
            </p>
          </div>
        </div>
      </section>

      <button
        ref="continueButton"
        type="button"
        class="cx-button-primary mt-10 inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isContinuing"
        @click="handleContinue"
      >
        {{ isContinuing ? t.preparing : t.continue }}
      </button>
    </motion.section>
  </main>
</template>
