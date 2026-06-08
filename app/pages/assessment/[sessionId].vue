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
} from '~~/shared/types/assessment'

const route = useRoute('/assessment/[sessionId]')
const sessionId = computed(() => route.params.sessionId as string)
const { clearSession, getSession, session, submitAnswer, isSubmitting } =
  useAssessmentSession()

const pageError = ref<ApiError | null>(null)
const toast = useToast()
const questionShownAt = ref(Date.now())

await useAsyncData(`assessment-session-${sessionId.value}`, loadSession)

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
    const nextSession = await getSession(sessionId.value)

    if (isSessionComplete(nextSession)) {
      await navigateTo(`/results/${nextSession.id}`)
    }
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: 'Could not load session',
      description: getErrorMessage(error as ApiError) ?? undefined,
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
      sessionId.value,
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

async function handleResetSession() {
  clearSession()
  await navigateTo('/assessment/start')
}

const responseErrorMessage = computed(() => getErrorMessage(pageError.value))
const isAwaitingResolution = computed(() => {
  return Boolean(
    session.value &&
    !session.value.current_question &&
    !isSessionComplete(session.value),
  )
})

const isThai = computed(() => session.value?.language === 'th')

useSeoMeta({
  title: computed(() => isThai.value ? 'CompetencyX | ทำแบบประเมินเชิงรุก' : 'CompetencyX | Active assessment'),
  description: computed(() => isThai.value
    ? 'ตอบคำถามการประเมินทีละข้อและทบทวนคำแนะนำสดใหม่เมื่อการประเมินดำเนินไป'
    : 'Answer the assessment questions one at a time and review your live guidance as the session progresses.'),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex items-center justify-between gap-4">
      <NuxtLink to="/assessment/start" class="editorial-link text-sm">
        {{ isThai ? 'เริ่มใหม่ตั้งแต่ต้น' : 'Restart from onboarding' }}
      </NuxtLink>
      <span class="data-value text-sm text-ink-soft"
        >{{ isThai ? 'เซสชัน' : 'Session' }} {{ route.params.sessionId }}</span
      >
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
        <div
          v-if="isAwaitingResolution"
          class="mt-4 flex flex-wrap justify-end gap-3"
        >
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-ink/12 bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent/35"
            @click="handleResetSession"
          >
            {{ isThai ? 'รีเซ็ตเซสชัน' : 'Reset session' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-shadow transition hover:-translate-y-0.5 hover:bg-accent-hover"
            @click="loadSession"
          >
            <span
              v-if="isSubmitting"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-accent"
              aria-hidden="true"
            />
            {{ isThai ? 'รีเฟรชสถานะเซสชัน' : 'Refresh session state' }}
          </button>
        </div>
      </div>
    </div>

    <section v-else-if="pageError" class="glass-panel mt-6 p-8 text-center">
      <p class="text-3xl font-bold text-ink">
        {{ isThai ? 'เซสชันไม่พร้อมใช้งาน' : 'Session unavailable' }}
      </p>
      <p class="mt-4 text-sm leading-7 text-ink-soft">
        {{
          responseErrorMessage ||
          (isThai
            ? 'ไม่สามารถเปิดแบบประเมินนี้ได้ โปรดย้อนกลับไปเริ่มทำเซสชันใหม่'
            : 'This assessment could not be opened. Return to onboarding to begin a new session.')
        }}
      </p>
      <NuxtLink
        to="/assessment/start"
        class="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-shadow transition hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        {{ isThai ? 'กลับไปหน้าเริ่มต้น' : 'Return to start' }}
      </NuxtLink>
    </section>

    <div
      v-else
      class="mt-6 grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start"
      aria-busy="true"
      :aria-label="isThai ? 'กำลังโหลดข้อมูลเซสชัน...' : 'Loading session'"
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
