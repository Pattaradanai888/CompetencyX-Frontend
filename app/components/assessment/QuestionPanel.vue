<script setup lang="ts">
import { motion } from 'motion-v'
import { getQuestionStageLabel, getQuestionTypeLabel } from '~/utils/assessment'
import type {
  AssessmentSession,
  LikertScaleValue,
  QuestionOption,
  ResponseScaleOption,
} from '~~/shared/types/assessment'

type AnswerSelection =
  | { kind: 'option'; option: QuestionOption }
  | { kind: 'scale'; scaleValue: LikertScaleValue; option: ResponseScaleOption }

const props = defineProps<{
  isSubmitting?: boolean
  responseError?: string | null
  session: AssessmentSession
}>()

const emit = defineEmits<{
  select: [answer: AnswerSelection]
}>()

const currentQuestion = computed(() => props.session.current_question)

const {
  localizedPrompt,
  localizedHelpText,
  localizedOptions,
  localizedResponseScale,
} = useQuestionI18n(() => currentQuestion.value)

const selectedScaleValue = ref<LikertScaleValue | null>(null)
const selectedOptionId = ref<number | null>(null)
const prefersReduced = useReducedMotion()

watch(
  () => currentQuestion.value?.id,
  () => {
    selectedScaleValue.value = null
    selectedOptionId.value = null
  },
  { immediate: true },
)

const isLikertQuestion = computed(
  () => currentQuestion.value?.question_type === 'likert_5',
)

const orderedScaleOptions = computed(() => {
  return [...(localizedResponseScale.value || [])].sort(
    (left, right) => left.value - right.value,
  )
})

const isTrueFalseMaybeChoice = computed(() => {
  const labels = (currentQuestion.value?.options || []).map(
    (option: QuestionOption) => option.key.trim().toLowerCase(),
  )

  return (
    labels.length === 3 &&
    ['true', 'false', 'maybe'].every((label) => labels.includes(label))
  )
})

const activeScaleIndex = computed(() => {
  if (selectedScaleValue.value === null) return -1
  return orderedScaleOptions.value.findIndex(
    (option) => option.value === selectedScaleValue.value,
  )
})

const isThai = computed(() => props.session.language === 'th')

const questionModeCopy = computed(() => {
  if (isThai.value) {
    if (isLikertQuestion.value) {
      return 'โปรดเลือกความเห็นของคุณบนสเกลและตอบเพื่อไปต่อ'
    }
    if (currentQuestion.value?.question_type === 'ranked_choice') {
      return 'เลือกตัวเลือกที่คุณให้ความสำคัญมากที่สุดเพื่อประกอบการคำนวณ'
    }
    return 'เลือกคำตอบที่เหมาะสมที่สุดแล้วตอบคำถามเพื่อไปต่อ'
  }

  if (isLikertQuestion.value) {
    return 'Place the statement on the agreement scale and continue.'
  }

  if (currentQuestion.value?.question_type === 'ranked_choice') {
    return 'Pick the option that should carry the most weight in the next recommendation step.'
  }

  return 'Select the answer that fits best and move to the next prompt.'
})

function handleScaleSelect(option: ResponseScaleOption) {
  selectedScaleValue.value = option.value
  emit('select', {
    kind: 'scale',
    scaleValue: option.value,
    option,
  })
}

function handleOptionSelect(option: QuestionOption) {
  selectedOptionId.value = option.id
  emit('select', {
    kind: 'option',
    option,
  })
}
</script>

<template>
  <section class="glass-panel p-6 md:p-8" aria-live="polite">
    <div class="flex flex-wrap items-center gap-3">
      <span class="eyebrow">{{
        getQuestionStageLabel(
          session.current_question?.stage || 'role',
          session.language,
        )
      }}</span>
      <span
        class="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-soft"
      >
        {{
          getQuestionTypeLabel(
            session.current_question?.question_type || 'single_choice',
            session.language,
          )
        }}
      </span>
    </div>

    <motion.div
      class="mt-5 rounded-lg border border-border-subtle bg-surface-muted p-5 md:p-6"
      :key="session.current_question?.id ?? 'resolving'"
      :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="prefersReduced ? { duration: 0 } : { duration: 0.24 }"
    >
      <p
        v-if="session.current_question"
        class="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
      >
        {{ questionModeCopy }}
      </p>
      <h1 class="font-display text-3xl leading-tight text-ink md:text-5xl">
        {{
          localizedPrompt ||
          (isThai
            ? 'ระบบกำลังวิเคราะห์ความถนัดตำแหน่งงานของคุณ'
            : 'We are resolving your role signal.')
        }}
      </h1>
      <p
        v-if="localizedHelpText"
        class="mt-4 max-w-2xl wrap-break-word text-sm leading-7 text-ink-soft"
      >
        {{ localizedHelpText }}
      </p>
      <p
        v-else-if="!session.current_question"
        class="mt-4 max-w-2xl text-sm leading-7 text-ink-soft"
      >
        {{ session.guidance_summary }}
      </p>
    </motion.div>

    <div
      v-if="responseError"
      aria-live="polite"
      class="cx-error-panel mt-6 p-4 text-sm"
    >
      {{ responseError }}
    </div>

    <div v-if="session.current_question" class="mt-8">
      <fieldset
        v-if="isLikertQuestion"
        :key="session.current_question?.id"
        class="likert-spectrum"
        :disabled="isSubmitting"
      >
        <legend class="sr-only">
          {{
            isThai
              ? 'สเกลความเห็นจากไม่เห็นด้วยอย่างยิ่งถึงเห็นด้วยอย่างยิ่ง'
              : 'Agreement scale from strongly disagree to strongly agree'
          }}
        </legend>

        <div class="likert-spectrum__labels" aria-hidden="true">
          <span>{{
            isThai ? 'ไม่เห็นด้วยอย่างยิ่ง' : 'Strongly disagree'
          }}</span>
          <span class="hidden sm:inline-flex">{{
            isThai ? 'เป็นกลาง' : 'Neutral'
          }}</span>
          <span>{{ isThai ? 'เห็นด้วยอย่างยิ่ง' : 'Strongly agree' }}</span>
        </div>

        <div class="likert-spectrum__track">
          <div
            class="likert-spectrum__fill"
            :style="{ '--active-index': activeScaleIndex }"
          />

          <label
            v-for="(option, index) in orderedScaleOptions"
            :key="option.key"
            class="likert-spectrum__node"
            :class="{
              'likert-spectrum__node--active':
                selectedScaleValue === option.value,
              [`likert-spectrum__node--intensity-${index}`]: true,
            }"
            :style="{ '--node-i': index }"
          >
            <input
              class="sr-only"
              type="radio"
              :name="`question-${session.current_question.id}`"
              :value="option.value"
              :checked="selectedScaleValue === option.value"
              :disabled="isSubmitting"
              @change="handleScaleSelect(option)"
            />

            <span class="likert-spectrum__orb" aria-hidden="true">
              <span class="likert-spectrum__orb-ring" />
              <span class="likert-spectrum__orb-core" />
              <span class="likert-spectrum__orb-pulse" />
            </span>
            <span class="likert-spectrum__option-label">
              {{ option.label }}
            </span>
          </label>
        </div>
      </fieldset>

      <div
        v-else
        :class="
          isTrueFalseMaybeChoice ? 'grid grid-cols-3 gap-3' : 'grid gap-3'
        "
      >
        <motion.button
          v-for="(option, index) in localizedOptions"
          :key="option.id"
          type="button"
          class="answer-option answer-option--choice rounded-md p-4 md:p-5"
          :disabled="isSubmitting"
          :aria-label="option.label"
          :class="[
            selectedOptionId === option.id ? 'is-selected' : '',
            isTrueFalseMaybeChoice ? 'text-center' : 'text-left',
          ]"
          :initial="
            prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
          "
          :animate="{ opacity: 1, y: 0 }"
          :transition="
            prefersReduced
              ? { duration: 0 }
              : { delay: Number(index) * 0.05, duration: 0.24 }
          "
          :while-hover="prefersReduced ? {} : { x: 5 }"
          :while-press="prefersReduced ? {} : { scale: 0.985 }"
          @click="handleOptionSelect(option)"
        >
          <div
            v-if="isTrueFalseMaybeChoice"
            class="flex min-h-16 flex-col items-center justify-center gap-2"
          >
            <div
              class="answer-option__number flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-semibold"
            >
              {{ Number(index) + 1 }}
            </div>
            <p class="text-base font-bold leading-tight text-ink">
              {{ option.label }}
            </p>
            <p v-if="selectedOptionId === option.id" class="sr-only">
              {{
                isThai
                  ? 'เลือกแล้ว กำลังบันทึกคำตอบ...'
                  : 'Selected. Saving your response...'
              }}
            </p>
          </div>

          <div v-else class="flex items-start gap-4">
            <div
              class="answer-option__number flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-sm font-semibold"
            >
              {{ Number(index) + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="wrap-break-word text-base font-semibold leading-7 text-ink md:text-[1.05rem]"
              >
                {{ option.label }}
              </p>
              <p class="mt-1 text-sm leading-6 text-ink-soft">
                {{
                  selectedOptionId === option.id
                    ? isThai
                      ? 'เลือกแล้ว กำลังบันทึกคำตอบ...'
                      : 'Selected. Saving your response...'
                    : isThai
                      ? 'คลิกเลือกคำตอบนี้เพื่อไปต่อ'
                      : 'Choose this response to continue.'
                }}
              </p>
            </div>
            <span
              class="answer-option__chevron hidden sm:inline-flex"
              aria-hidden="true"
            >
              <span v-if="selectedOptionId === option.id">✓</span>
              <span v-else class="answer-option__chevron-arrow">&rarr;</span>
            </span>
          </div>
        </motion.button>
      </div>
    </div>

    <div
      v-if="session.current_question"
      class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5"
    >
      <p class="status-copy">
        {{
          isSubmitting
            ? isThai
              ? 'กำลังบันทึกคำตอบ...'
              : 'Saving your answer...'
            : isLikertQuestion
              ? isThai
                ? 'ระดับความคิดเห็น ระบบจะบันทึกคำตอบทันที'
                : 'Agreement response. Immediate next step.'
              : isThai
                ? 'เลือกตอบข้อเดียว ระบบจะบันทึกคำตอบทันที'
                : 'Single decision. Immediate next step.'
        }}
      </p>
      <div
        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft"
      >
        <span class="inline-flex h-2 w-2 rounded-full bg-accent" />
        {{
          isLikertQuestion
            ? isThai
              ? 'สเกลความเห็น'
              : 'Agreement scale'
            : session.current_question.question_type === 'ranked_choice'
              ? isThai
                ? 'จัดอันดับความสำคัญ'
                : 'Priority response'
              : isThai
                ? 'คลิกเพื่อไปต่อ'
                : 'Tap to continue'
        }}
      </div>
    </div>

    <div
      v-else
      class="mt-8 rounded-lg border border-border-subtle bg-surface-card p-5 text-sm leading-7 text-ink-soft"
    >
      {{
        isThai
          ? 'เซสชันนี้ไม่มีคำถามให้ทำต่อในขณะนี้ โปรดรีเฟรชหน้าจอเพื่อตรวจสอบขั้นตอนความถนัดถัดไป'
          : 'This session does not have an answerable question right now. Refresh the page to check whether the next step has resolved.'
      }}
    </div>
  </section>
</template>
