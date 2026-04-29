<script setup lang="ts">
import { motion } from 'motion-v'
import QuestionPanel from '~/components/assessment/QuestionPanel.vue'
import SessionOverview from '~/components/assessment/SessionOverview.vue'
import { getErrorMessage } from '~/utils/api'
import { isSessionComplete } from '~/utils/assessment'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type { ApiError, QuestionOption } from '~/shared/types/assessment'

const route = useRoute('/assessment/[sessionId]')
const { getSession, session, submitAnswer, isSubmitting } = useAssessmentSession()

const pageError = ref<ApiError | null>(null)
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
  }
}

async function handleSelect(option: QuestionOption) {
  if (!session.value?.current_question) {
    return
  }

  pageError.value = null

  try {
    const nextSession = await submitAnswer(route.params.sessionId, {
      question_id: session.value.current_question.id,
      option_id: option.id,
      response_time_ms: Math.max(Date.now() - questionShownAt.value, 0),
    })

    if (!nextSession) {
      return
    }

    if (isSessionComplete(nextSession)) {
      await navigateTo(`/results/${nextSession.id}`)
    }
  } catch (error) {
    pageError.value = error as ApiError

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
      <span class="data-value text-sm text-[var(--cx-ink-soft)]">Session {{ route.params.sessionId }}</span>
    </div>

    <div
      v-if="session"
      class="assessment-stagebar mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-black/6 bg-white/60 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <span class="eyebrow mb-0">Active assessment</span>
        <span class="rounded-full border border-black/6 bg-[var(--cx-paper-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cx-ink-soft)]">
          {{ session.current_question?.stage === 'skill' ? 'Skill signal' : 'Role signal' }}
        </span>
        <span class="rounded-full border border-[var(--cx-accent-soft)] bg-emerald-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cx-accent)]">
          {{ isAwaitingResolution ? 'Awaiting resolution' : 'Decision ready' }}
        </span>
      </div>
      <p class="text-sm text-[var(--cx-ink-soft)]">
        {{
          session.current_question
            ? 'One prompt on screen at a time.'
            : 'Waiting for the next assessment state.'
        }}
      </p>
    </div>

    <div v-if="session" class="mt-6 grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
      <motion.div
        class="lg:sticky lg:top-6"
        :initial="{ opacity: 0, x: -16 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.3 }"
      >
        <SessionOverview :session="session" />
      </motion.div>

      <motion.div
        :initial="{ opacity: 0, x: 16 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.34 }"
      >
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
          <UButton
            color="neutral"
            variant="soft"
            :loading="isSubmitting"
            @click="loadSession"
          >
            Refresh session state
          </UButton>
        </div>
      </motion.div>
    </div>

    <section
      v-else
      class="glass-panel mt-6 rounded-[2rem] p-8 text-center"
    >
      <p class="font-display text-3xl text-[var(--cx-ink)]">Session unavailable</p>
      <p class="mt-4 text-sm leading-7 text-[var(--cx-ink-soft)]">
        {{ responseErrorMessage || 'This assessment could not be opened. Return to onboarding to begin a new session.' }}
      </p>
      <NuxtLink
        to="/assessment/start"
        class="mt-6 inline-flex rounded-full bg-[var(--cx-accent)] px-5 py-3 text-sm font-semibold text-white"
      >
        Return to start
      </NuxtLink>
    </section>
  </main>
</template>
