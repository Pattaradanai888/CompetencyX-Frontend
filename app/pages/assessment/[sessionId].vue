<script setup lang="ts">
import QuestionPanel from '~/components/assessment/QuestionPanel.vue'
import SessionOverview from '~/components/assessment/SessionOverview.vue'
import { getErrorMessage } from '~/utils/api'
import { isSessionComplete } from '~/utils/assessment'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type {
  AnswerSubmitPayload,
  ApiError,
  LikertScaleValue,
  QuestionOption,
} from '~/shared/types/assessment'

const route = useRoute('/assessment/[sessionId]')
const { getSession, session, submitAnswer, isSubmitting } =
  useAssessmentSession()

const pageError = ref<ApiError | null>(null)
const toast = useToast()
const questionShownAt = ref(Date.now())

await useAsyncData(`assessment-session-${route.params.sessionId}`, loadSession)

watch(
  () => session.value?.current_question?.id,
  () => {
    questionShownAt.value = Date.now()
  },
  { immediate: true },
)

async function loadSession() {
  pageError.value = null

  try {
    const nextSession = await getSession(route.params.sessionId)

    if (isSessionComplete(nextSession)) {
      await navigateTo(`/results/${nextSession.id}`)
    }
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: 'Could not load session',
      description: getErrorMessage(error as ApiError),
      color: 'error',
    })
  }
}

type QuestionAnswerSelection =
  | { kind: 'option'; option: QuestionOption }
  | { kind: 'scale'; scaleValue: LikertScaleValue }

function buildAnswerPayload(
  answer: QuestionAnswerSelection,
): AnswerSubmitPayload {
  const basePayload = {
    question_id: session.value!.current_question!.id,
    response_time_ms: Math.max(Date.now() - questionShownAt.value, 0),
  }

  if (answer.kind === 'option') {
    return {
      ...basePayload,
      option_id: answer.option.id,
    }
  }

  return {
    ...basePayload,
    scale_value: answer.scaleValue,
  }
}

async function handleSelect(answer: QuestionAnswerSelection) {
  if (!session.value?.current_question) {
    return
  }

  pageError.value = null

  try {
    const nextSession = await submitAnswer(
      route.params.sessionId,
      buildAnswerPayload(answer),
    )

    if (!nextSession) {
      return
    }

    if (isSessionComplete(nextSession)) {
      await navigateTo(`/results/${nextSession.id}`)
    }
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({ title: 'Could not save answer', color: 'error' })

    if ((error as ApiError).statusCode === 400) {
      await loadSession()
    }
  }
}

const responseErrorMessage = computed(() => getErrorMessage(pageError.value))
const isAwaitingResolution = computed(() => {
  return Boolean(
    session.value &&
    !session.value.current_question &&
    !isSessionComplete(session.value),
  )
})

const answeredCount = computed(() => {
  if (!session.value) return 0
  return (
    session.value.milestones.answered_role_questions +
    session.value.milestones.answered_skill_questions
  )
})

const progressPercent = computed(() => {
  if (!session.value) return 0
  if (isSessionComplete(session.value)) return 100
  return Math.min(92, Math.max(12, answeredCount.value * 12 + 12))
})

const phaseLabel = computed(() => {
  if (session.value?.current_question?.stage === 'skill') {
    return 'Phase 2: skill assessment'
  }
  return 'Phase 1: role discovery'
})

const estimatedMinutesRemaining = computed(() => {
  if (!session.value || isSessionComplete(session.value)) return 0
  return Math.max(1, Math.ceil((8 - answeredCount.value) * 0.45))
})

const phaseTimeline = computed(() => [
  {
    label: 'Role discovery',
    detail: `${session.value?.milestones.answered_role_questions ?? 0} saved`,
    state:
      session.value?.current_question?.stage === 'role'
        ? 'active'
        : (session.value?.milestones.answered_role_questions ?? 0) > 0
          ? 'complete'
          : 'pending',
  },
  {
    label: 'Skill calibration',
    detail: `${session.value?.milestones.answered_skill_questions ?? 0} saved`,
    state:
      session.value?.current_question?.stage === 'skill'
        ? 'active'
        : (session.value?.milestones.answered_skill_questions ?? 0) > 0
          ? 'complete'
          : 'pending',
  },
  {
    label: 'Recommendation',
    detail:
      session.value && isSessionComplete(session.value) ? 'Ready' : 'Locked',
    state:
      session.value && isSessionComplete(session.value)
        ? 'complete'
        : 'pending',
  },
])

useSeoMeta({
  title: 'CompetencyX | Active assessment',
  description:
    'Answer the assessment questions one at a time and review your live guidance as the session progresses.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex items-center justify-between gap-4">
      <NuxtLink to="/assessment/start" class="editorial-link text-sm">
        Restart from onboarding
      </NuxtLink>
      <span class="data-value text-sm text-ink-soft"
        >Session {{ route.params.sessionId }}</span
      >
    </div>

    <div
      v-if="session"
      class="assessment-stagebar mt-6 border border-border-subtle bg-surface-muted px-4 py-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="eyebrow mb-0">Active assessment</span>
          <span
            class="rounded-sm border border-border-subtle bg-paper-strong px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-soft"
          >
            {{ phaseLabel }}
          </span>
          <span
            class="rounded-sm border border-accent-soft bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-accent"
          >
            {{
              isAwaitingResolution ? 'Awaiting resolution' : 'Decision ready'
            }}
          </span>
        </div>
        <p class="text-sm text-ink-soft">
          {{ answeredCount }} answer{{ answeredCount === 1 ? '' : 's' }} saved
          <span class="mx-2 opacity-35">/</span>
          ~{{ estimatedMinutesRemaining }} min left
        </p>
      </div>
      <div
        class="mt-4 h-2 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label="Assessment progress"
        :aria-valuenow="Math.round(progressPercent)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))] transition-all duration-500"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div
        class="phase-rail mt-4 sm:grid-cols-3"
        aria-label="Assessment phases"
      >
        <div
          v-for="(phase, index) in phaseTimeline"
          :key="phase.label"
          class="phase-rail__item"
          :class="{
            'is-active': phase.state === 'active',
            'is-complete': phase.state === 'complete',
          }"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-paper-strong text-xs font-black text-ink"
            >
              {{ index + 1 }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-extrabold text-ink">{{ phase.label }}</p>
              <p class="mt-1 text-xs font-semibold text-ink-soft">
                {{ phase.detail }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="session"
      class="mt-6 grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start"
    >
      <div class="lg:sticky lg:top-6 animate-fade-in-left">
        <SessionOverview :session="session" />
      </div>

      <div class="animate-fade-in-right">
        <QuestionPanel
          :session="session"
          :is-submitting="isSubmitting"
          :response-error="responseErrorMessage"
          @select="handleSelect"
        />
        <div v-if="isAwaitingResolution" class="mt-4 flex justify-end">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-ink/12 bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            @click="loadSession"
          >
            <span
              v-if="isSubmitting"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-accent"
              aria-hidden="true"
            />
            Refresh session state
          </button>
        </div>
      </div>
    </div>

    <section v-else-if="pageError" class="glass-panel mt-6 p-8 text-center">
      <p class="text-3xl font-bold text-ink">Session unavailable</p>
      <p class="mt-4 text-sm leading-7 text-ink-soft">
        {{
          responseErrorMessage ||
          'This assessment could not be opened. Return to onboarding to begin a new session.'
        }}
      </p>
      <NuxtLink
        to="/assessment/start"
        class="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-shadow transition hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        Return to start
      </NuxtLink>
    </section>

    <div
      v-else
      class="mt-6 grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start"
      aria-busy="true"
      aria-label="Loading session"
    >
      <div class="space-y-4">
        <div class="skeleton h-8 w-32 rounded-full" />
        <div class="skeleton h-48 rounded-xl" />
      </div>
      <div class="space-y-4">
        <div class="skeleton h-8 w-48 rounded-full" />
        <div class="skeleton h-48 rounded-xl" />
        <div class="skeleton h-16 rounded-md" />
        <div class="skeleton h-16 rounded-md" />
      </div>
    </div>
  </main>
</template>
