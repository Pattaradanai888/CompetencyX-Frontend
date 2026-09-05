<script setup lang="ts">
import { motion } from 'motion-v'
import {
  getRoleDisplayDescription,
  getRoleDisplayName,
  getSupportingPillars,
  sortRankedRolesDescending,
} from '~/utils/assessment'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import { useSessionCreate } from '~/composables/useSessionCreate'
import { getErrorMessage } from '~/utils/api'
import type {
  ApiError,
  RankedRoleInsight,
  Role,
} from '~~/shared/types/assessment'

const route = useRoute('/results/[sessionId]')
const sessionId = computed(() => route.params.sessionId as string)
const { getResults } = useAssessmentResults()
const { getSession } = useAssessmentSession()
const { createAndNavigate } = useSessionCreate()
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
const { isThai: globalIsThai, localeInitialized } = useLocale()
const isThai = computed(() => {
  if (localeInitialized.value) return globalIsThai.value
  return sessionSnapshot?.language === 'th'
})

const t = usePageI18n('results', isThai)

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
      name_th: primaryRankedRole.value?.name_th,
    } satisfies Role),
)

const primaryRoleName = computed(
  () =>
    getRoleDisplayName(primaryRole.value, isThai.value) || t.value.fallbackRole,
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
    getRoleDisplayName(selectedRole.value ?? primaryRole.value, isThai.value) ||
    t.value.selectedRole,
)

function getRoleDescription(role: RankedRoleInsight | Role | null): string {
  if (!role) {
    return t.value.fallbackDescription
  }

  if ('description' in role) {
    const description = getRoleDisplayDescription(role, isThai.value)
    if (description) return description
  }

  if ('top_supporting_pillars' in role) {
    const pillars = getSupportingPillars(role, isThai.value)
    if (pillars.length) {
      return `${t.value.strongestSignals}: ${pillars.join(', ')}.`
    }
  }

  return t.value.closeFitDescription
}

// The primary role's own description comes first; the ranked insight only
// carries the strongest-signal pillars, which are the fallback.
const primaryRoleDescription = computed(
  () =>
    getRoleDisplayDescription(primaryRole.value, isThai.value) ||
    getRoleDescription(primaryRankedRole.value ?? primaryRole.value),
)

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
    await createAndNavigate({
      preferred_role_slug: role.slug,
      language: sessionSnapshot?.language,
    })
  } catch (error) {
    toast.add({
      title: t.value.startSkillAssessmentError,
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  } finally {
    isContinuing.value = false
  }
}

useSeoMeta({
  title: computed(() =>
    isThai.value ? 'ผลแนะนำบทบาท' : 'Role recommendation',
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
  <NuxtErrorBoundary>
    <main v-if="results" id="main-content" class="page-wrap pb-16">
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
            {{ primaryRoleName }} {{ t.titleSuffix }}
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">
            {{ primaryRoleDescription }}
          </p>
        </div>

        <section class="mt-10 grid gap-4 text-left md:grid-cols-3">
          <!-- Primary role card -->
          <article
            :class="[
              'result-role-card result-role-card--selectable relative flex flex-col justify-between p-5 md:p-6',
              selectedRole?.slug === primaryRole.slug ? 'is-selected' : '',
              isContinuing ? 'is-busy' : '',
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
              <h2 class="mt-3 text-2xl font-bold text-ink">
                {{ primaryRoleName }}
              </h2>
              <p class="mt-3 text-sm leading-7 text-ink-soft">
                {{ primaryRoleDescription }}
              </p>
            </div>
            <div class="mt-6">
              <div
                v-if="selectedRole?.slug === primaryRole.slug"
                class="rounded-xl border border-accent/20 bg-accent/8 px-4 py-3"
              >
                <p
                  class="text-xs font-bold uppercase tracking-[0.08em] text-accent"
                >
                  {{ t.defaultSelection }}
                </p>
                <p class="mt-2 text-sm leading-6 text-ink-soft">
                  {{ t.skillAssessmentWillStartWith }}
                  <span class="font-semibold text-ink">{{
                    primaryRoleName
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
              'result-role-card result-role-card--selectable relative flex flex-col justify-between p-5 md:p-6',
              selectedRole?.slug === role.slug ? 'is-selected' : '',
              isContinuing ? 'is-busy' : '',
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
              <h2 class="mt-3 text-2xl font-bold text-ink">
                {{ getRoleDisplayName(role, isThai) }}
              </h2>
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
                  class="text-xs font-bold uppercase tracking-[0.08em] text-accent"
                >
                  {{ t.selected }}
                </p>
                <p class="mt-2 text-sm leading-6 text-ink-soft">
                  {{ t.skillAssessmentWillStartWith }}
                  <span class="font-semibold text-ink">{{
                    getRoleDisplayName(role, isThai)
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
              <p class="eyebrow">{{ t.skillAssessment }}</p>
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
                class="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"
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
    <template #error="{ error, clearError }">
      <ErrorBoundaryFallback :error="error" @clear-error="clearError" />
    </template>
  </NuxtErrorBoundary>
</template>
