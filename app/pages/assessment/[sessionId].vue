<script setup lang="ts">
import QuestionPanel from '~/components/assessment/QuestionPanel.vue'
import SessionOverview from '~/components/assessment/SessionOverview.vue'
import { getErrorMessage } from '~/utils/api'
import { isSessionComplete } from '~/utils/assessment'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type { AnswerSubmitPayload, ApiError, LikertScaleValue, QuestionOption } from '~/shared/types/assessment'

const route = useRoute('/assessment/[sessionId]')
const { getSession, session, submitAnswer, isSubmitting } = useAssessmentSession()

const pageError = ref<ApiError | null>(null)
const toast = useToast()
const questionShownAt = ref(Date.now())

await loadSession()

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
    toast.add({ title: 'Could not load session', description: getErrorMessage(error as ApiError), color: 'error' })
  }
}

type QuestionAnswerSelection =
  | { kind: 'option'; option: QuestionOption }
  | { kind: 'scale'; scaleValue: LikertScaleValue }

function buildAnswerPayload(answer: QuestionAnswerSelection): AnswerSubmitPayload {
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
    const nextSession = await submitAnswer(route.params.sessionId, buildAnswerPayload(answer))

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

useSeoMeta({
  title: 'CompetencyX | Active assessment',
  description: 'Answer the assessment questions one at a time and review your live guidance as the session progresses.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex items-center justify-between gap-4">
      <NuxtLink to="/assessment/start" class="editorial-link text-sm">
        Restart from onboarding
      </NuxtLink>
      <span class="data-value text-sm text-(--cx-ink-soft)">Session {{ route.params.sessionId }}</span>
    </div>

    <div
      v-if="session"
      class="assessment-stagebar mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-black/6 bg-white/60 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <span class="eyebrow mb-0">Active assessment</span>
        <span class="rounded-full border border-black/6 bg-(--cx-paper-strong) px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-ink-soft)">
          {{ session.current_question?.stage === 'skill' ? 'Skill signal' : 'Role signal' }}
        </span>
        <span class="rounded-full border border-(--cx-accent-soft) bg-emerald-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-accent)">
          {{ isAwaitingResolution ? 'Awaiting resolution' : 'Decision ready' }}
        </span>
      </div>
      <p class="text-sm text-(--cx-ink-soft)">
        {{
          session.current_question
            ? 'One prompt on screen at a time.'
            : 'Waiting for the next assessment state.'
        }}
      </p>
    </div>

    <div v-if="session" class="mt-6 grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
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
        <div
          v-if="isAwaitingResolution"
          class="mt-4 flex justify-end"
        >
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-(--cx-border) bg-white/80 px-4 py-2 text-sm font-semibold text-(--cx-ink) transition hover:-translate-y-0.5 hover:border-(--cx-accent)/35 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            @click="loadSession"
          >
            <span v-if="isSubmitting" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-(--cx-accent)" aria-hidden="true" />
            Refresh session state
          </button>
        </div>
      </div>
    </div>

    <section
      v-else-if="pageError"
      class="glass-panel mt-6 rounded-4xl p-8 text-center"
    >
      <p class="text-3xl font-bold text-(--cx-ink)">Session unavailable</p>
      <p class="mt-4 text-sm leading-7 text-(--cx-ink-soft)">
        {{ responseErrorMessage || 'This assessment could not be opened. Return to onboarding to begin a new session.' }}
      </p>
      <NuxtLink
        to="/assessment/start"
        class="mt-6 inline-flex items-center justify-center rounded-full bg-(--cx-accent) px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
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
        <div class="skeleton h-64 rounded-4xl" />
      </div>
      <div class="space-y-4">
        <div class="skeleton h-8 w-48 rounded-full" />
        <div class="skeleton h-48 rounded-[2.2rem]" />
        <div class="skeleton h-20 rounded-[1.65rem]" />
        <div class="skeleton h-20 rounded-[1.65rem]" />
      </div>
    </div>
  </main>
</template>
