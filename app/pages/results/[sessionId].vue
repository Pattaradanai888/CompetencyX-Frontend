<script setup lang="ts">
import { getRoleFamily } from '~/data/roleFamilies'
import type { RoleFamily } from '~/data/roleFamilies'
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
import { CELEBRATED_RESULT_KEY_PREFIX } from '~/utils/constants'
import type { ApiError, Role } from '~~/shared/types/assessment'

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
const isContinuing = ref(false)

const rankedRoles = computed(() =>
  sortRankedRolesDescending(results.value?.ranked_roles ?? []),
)

const primaryRole = computed<Role>(
  () =>
    results.value?.best_fit_role ??
    results.value?.preferred_role ?? {
      id: 0,
      slug: rankedRoles.value[0]?.slug ?? 'recommended-role',
      name: rankedRoles.value[0]?.name ?? t.value.fallbackRole,
      name_th: rankedRoles.value[0]?.name_th,
    },
)

const primaryRankedRole = computed(
  () =>
    rankedRoles.value.find((role) => role.slug === primaryRole.value.slug) ??
    null,
)

const primaryRoleName = computed(
  () =>
    getRoleDisplayName(primaryRole.value, isThai.value) || t.value.fallbackRole,
)

const primaryRoleDescription = computed(
  () =>
    getRoleDisplayDescription(primaryRole.value, isThai.value) ||
    t.value.fallbackDescription,
)

const primaryFamily = computed(() => getRoleFamily(primaryRole.value.slug))

const primaryPillars = computed(() =>
  primaryRankedRole.value
    ? getSupportingPillars(primaryRankedRole.value, isThai.value)
    : [],
)

interface RoleChoice {
  slug: string
  name: string
  family: RoleFamily
  pillars: string[]
}

/** fit_score has no fixed scale, so the result is told by rank, never as a percent. */
const bestMatchLabel = computed(() =>
  rankedRoles.value.length > 1
    ? t.value.bestMatchOf.replace('{n}', String(rankedRoles.value.length))
    : t.value.bestMatch,
)

/** The best match first, then the next closest, three in all. */
const choices = computed<RoleChoice[]>(() => {
  const primary: RoleChoice = {
    slug: primaryRole.value.slug,
    name: primaryRoleName.value,
    family: primaryFamily.value,
    pillars: primaryPillars.value,
  }
  const others = rankedRoles.value
    .filter((role) => role.slug !== primary.slug)
    .map((role) => ({
      slug: role.slug,
      name: getRoleDisplayName(role, isThai.value),
      family: getRoleFamily(role.slug),
      pillars: getSupportingPillars(role, isThai.value),
    }))
  return [primary, ...others].slice(0, 3)
})

const selectedSlug = ref(primaryRole.value.slug)

const selectedChoice = computed(
  () =>
    choices.value.find((choice) => choice.slug === selectedSlug.value) ??
    choices.value[0],
)

const continueLabel = computed(() =>
  t.value.continueWith.replace(
    '{role}',
    selectedChoice.value?.name ?? primaryRoleName.value,
  ),
)

async function handleContinue() {
  const slug = selectedChoice.value?.slug
  if (!slug || isContinuing.value) {
    return
  }

  if (slug === primaryRole.value.slug) {
    await navigateTo(`/roadmaps/${route.params.sessionId}`)
    return
  }

  isContinuing.value = true
  try {
    await createAndNavigate({
      preferred_role_slug: slug,
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

const BURST_PIECES = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2 + (index % 2 ? 0.2 : -0.1)
  const distance = 70 + (index % 3) * 28
  return {
    '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
    '--dy': `${Math.round(Math.sin(angle) * distance)}px`,
    '--turn': `${(index % 2 ? 1 : -1) * (90 + index * 15)}deg`,
  }
})

const isCelebrating = ref(false)
const prefersReduced = useReducedMotion()

onMounted(() => {
  const key = `${CELEBRATED_RESULT_KEY_PREFIX}${sessionId.value}`
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {
    return
  }
  isCelebrating.value = !prefersReduced.value
})

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
</script>

<template>
  <NuxtErrorBoundary>
    <main v-if="results" id="main-content" class="page-wrap">
      <div class="results">
        <p class="eyebrow">{{ t.eyebrow }}</p>

        <section
          class="result-reveal mt-4"
          :class="[
            `family-${primaryFamily}`,
            { 'is-celebrating': isCelebrating },
          ]"
          aria-labelledby="results-title"
        >
          <p class="result-reveal__badge">
            {{ bestMatchLabel }}
            <span v-if="isCelebrating" class="result-burst" aria-hidden="true">
              <span
                v-for="(piece, index) in BURST_PIECES"
                :key="index"
                :style="piece"
              />
            </span>
          </p>
          <p class="result-reveal__family mt-5">
            {{ t.families[primaryFamily] }}
          </p>
          <h1 id="results-title" class="result-reveal__name">
            {{ primaryRoleName }}
          </h1>
          <p class="result-reveal__copy">{{ primaryRoleDescription }}</p>
          <div v-if="primaryPillars.length" class="mt-5">
            <p class="text-sm font-bold">{{ t.strongestPillars }}</p>
            <ul class="result-reveal__pillars mt-2">
              <li
                v-for="pillar in primaryPillars"
                :key="pillar"
                class="result-reveal__pillar"
              >
                {{ pillar }}
              </li>
            </ul>
          </div>
        </section>

        <section class="mt-12" aria-labelledby="choose-title">
          <h2
            id="choose-title"
            class="text-2xl font-extrabold leading-snug text-ink"
          >
            {{ t.chooseTitle }}
          </h2>
          <p class="mt-2 text-ink-soft">{{ t.chooseIntro }}</p>

          <fieldset class="mt-6">
            <legend class="sr-only">{{ t.chooseTitle }}</legend>
            <div class="role-choice-list">
              <label
                v-for="(choice, index) in choices"
                :key="choice.slug"
                class="role-choice"
                :class="`family-${choice.family}`"
              >
                <input
                  v-model="selectedSlug"
                  type="radio"
                  name="role-choice"
                  class="role-choice__input"
                  :value="choice.slug"
                  :aria-labelledby="`choice-${choice.slug}-name`"
                  :aria-describedby="`choice-${choice.slug}-meta`"
                  :disabled="isContinuing"
                />
                <span class="role-choice__rank" aria-hidden="true">
                  {{ index + 1 }}
                </span>
                <span class="min-w-0">
                  <span
                    :id="`choice-${choice.slug}-name`"
                    class="role-choice__name block"
                  >
                    {{ choice.name }}
                  </span>
                  <span
                    :id="`choice-${choice.slug}-meta`"
                    class="role-choice__meta block"
                  >
                    {{ t.families[choice.family] }}
                    <template v-if="choice.pillars.length">
                      · {{ choice.pillars.join(' · ') }}
                    </template>
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <button
            type="button"
            class="cx-button-primary mt-8 w-full"
            :disabled="isContinuing"
            :aria-busy="isContinuing ? 'true' : undefined"
            @click="handleContinue"
          >
            {{ isContinuing ? t.preparing : continueLabel }}
          </button>
        </section>
      </div>
    </main>
    <template #error="{ error, clearError }">
      <ErrorBoundaryFallback :error="error" @clear-error="clearError" />
    </template>
  </NuxtErrorBoundary>
</template>
