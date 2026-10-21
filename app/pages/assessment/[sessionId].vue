<script setup lang="ts">
import QuestionPanel from '~/components/assessment/QuestionPanel.vue'
import { getErrorMessage } from '~/utils/api'
import { isSessionComplete } from '~/utils/assessment'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
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

const { error: sessionError, refresh } = await useAsyncData(
  () => `assessment-session-${sessionId.value}`,
  async () => {
    const nextSession = await getSession(sessionId.value)

    if (isSessionComplete(nextSession)) {
      await navigateTo(`/results/${nextSession.id}`)
    }

    return nextSession
  },
)

// Declared ahead of the immediate watch below, which reads it on first run.
const { isThai: globalIsThai, localeInitialized } = useLocale()
const isThai = computed(() => {
  if (localeInitialized.value) return globalIsThai.value
  return session.value?.language === 'th'
})

watch(
  sessionError,
  (error) => {
    if (!error) {
      pageError.value = null
      return
    }

    pageError.value = error as unknown as ApiError

    if (import.meta.client) {
      toast.add({
        title: isThai.value ? 'โหลดเซสชันไม่สำเร็จ' : 'Could not load session',
        description: getErrorMessage(pageError.value) ?? undefined,
        color: 'error',
      })
    }
  },
  { immediate: true },
)

watch(
  () => session.value?.current_question?.id,
  () => {
    questionShownAt.value = Date.now()
  },
  { immediate: true },
)

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
    toast.add({
      title: isThai.value ? 'บันทึกคำตอบไม่สำเร็จ' : 'Could not save answer',
      color: 'error',
    })

    if ((error as ApiError).statusCode === 400) {
      await refresh()
    }
  }
}

const isConfirmingReset = ref(false)
let resetConfirmTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
})

// Resetting throws away every answer in the session, so the first click only
// arms the button; a second click within a few seconds confirms.
async function handleResetSession() {
  if (!isConfirmingReset.value) {
    isConfirmingReset.value = true
    resetConfirmTimer = setTimeout(() => {
      isConfirmingReset.value = false
    }, 4000)
    return
  }

  if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
  isConfirmingReset.value = false
  clearSession()
  await navigateTo('/assessment/preferred-role')
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
  title: computed(() =>
    isThai.value ? 'แบบประเมินค้นหาบทบาท' : 'Role discovery',
  ),
  description: computed(() =>
    isThai.value
      ? 'ตอบคำถามทีละข้อเพื่อหาบทบาทงานซอฟต์แวร์ที่เข้ากับคุณ'
      : 'Answer one question at a time to find the software role that fits you.',
  ),
})
</script>

<template>
  <NuxtErrorBoundary>
    <main id="main-content" class="page-wrap">
      <QuestionPanel
        v-if="session"
        :session="session"
        :is-submitting="isSubmitting"
        :response-error="responseErrorMessage"
        @select="handleSelect"
      >
        <template v-if="isAwaitingResolution" #footer>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="cx-button-primary"
              :disabled="isSubmitting"
              @click="refresh()"
            >
              {{ isThai ? 'รีเฟรช' : 'Refresh' }}
            </button>
            <button
              type="button"
              class="cx-button-secondary"
              :class="isConfirmingReset ? 'text-error' : ''"
              @click="handleResetSession"
            >
              {{
                isConfirmingReset
                  ? isThai
                    ? 'กดอีกครั้งเพื่อเริ่มใหม่'
                    : 'Click again to start over'
                  : isThai
                    ? 'เริ่มใหม่'
                    : 'Start over'
              }}
            </button>
          </div>
        </template>
      </QuestionPanel>

      <section v-else-if="pageError" class="quiz pt-10">
        <h1 class="text-2xl font-extrabold text-ink">
          {{
            isThai
              ? 'เปิดแบบประเมินนี้ไม่ได้'
              : 'This assessment could not be opened'
          }}
        </h1>
        <p class="mt-3 text-ink-soft">
          {{
            responseErrorMessage ||
            (isThai
              ? 'ลองเริ่มแบบประเมินใหม่อีกครั้ง'
              : 'Try starting a new assessment.')
          }}
        </p>
        <NuxtLink
          to="/assessment/preferred-role"
          class="cx-button-primary mt-8"
        >
          {{ isThai ? 'เริ่มใหม่' : 'Start again' }}
        </NuxtLink>
      </section>

      <div
        v-else
        class="quiz"
        aria-busy="true"
        :aria-label="isThai ? 'กำลังโหลดแบบประเมิน' : 'Loading the assessment'"
      >
        <div class="skeleton h-10 rounded-xl" />
        <div class="skeleton mt-10 h-10 w-4/5 rounded-xl" />
        <div class="mt-8 grid gap-3">
          <div
            v-for="index in 5"
            :key="index"
            class="skeleton h-15 rounded-xl"
          />
        </div>
      </div>
    </main>
    <template #error="{ error, clearError }">
      <ErrorBoundaryFallback :error="error" @clear-error="clearError" />
    </template>
  </NuxtErrorBoundary>
</template>
