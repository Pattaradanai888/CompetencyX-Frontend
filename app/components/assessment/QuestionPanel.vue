<script setup lang="ts">
import { motion } from 'motion-v'
import { getQuestionStageLabel, getQuestionTypeLabel } from '~/utils/assessment'
import type {
  AssessmentSession,
  LikertScaleValue,
  QuestionOption,
  ResponseScaleOption,
} from '~/shared/types/assessment'

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

const isLikertQuestion = computed(() => currentQuestion.value?.question_type === 'likert_5')

const orderedScaleOptions = computed(() => {
  return [...(currentQuestion.value?.response_scale || [])].sort((left, right) => left.value - right.value)
})

const activeScaleIndex = computed(() => {
  if (selectedScaleValue.value === null) return -1
  return orderedScaleOptions.value.findIndex(option => option.value === selectedScaleValue.value)
})

const questionModeCopy = computed(() => {
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
  <section class="glass-panel rounded-[2.2rem] p-6 md:p-8" aria-live="polite">
    <div class="flex flex-wrap items-center gap-3">
      <span class="eyebrow">{{ getQuestionStageLabel(session.current_question?.stage || 'role') }}</span>
      <span class="rounded-full border border-black/6 bg-white/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-ink-soft)">
        {{ getQuestionTypeLabel(session.current_question?.question_type || 'single_choice') }}
      </span>
    </div>

    <div class="mt-5 rounded-[1.7rem] border border-black/6 bg-white/58 p-5 md:p-6">
      <p
        v-if="session.current_question"
        class="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-(--cx-ink-soft)"
      >
        {{ questionModeCopy }}
      </p>
      <h1 class="font-display text-3xl leading-tight text-(--cx-ink) md:text-5xl">
        {{ session.current_question?.prompt || 'We are resolving your role signal.' }}
      </h1>
      <p
        v-if="session.current_question?.help_text"
        class="mt-4 max-w-2xl wrap-break-word text-sm leading-7 text-(--cx-ink-soft)"
      >
        {{ session.current_question.help_text }}
      </p>
      <p
        v-else-if="!session.current_question"
        class="mt-4 max-w-2xl text-sm leading-7 text-(--cx-ink-soft)"
      >
        {{ session.guidance_summary }}
      </p>
    </div>

    <div v-if="responseError" aria-live="polite" class="mt-6 rounded-[1.5rem] border border-rose-300/50 bg-rose-50/90 p-4 text-sm text-rose-900">
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
          Agreement scale from strongly disagree to strongly agree
        </legend>

        <div class="likert-spectrum__labels" aria-hidden="true">
          <span>Strongly disagree</span>
          <span class="hidden sm:inline-flex">Neutral</span>
          <span>Strongly agree</span>
        </div>

        <div class="likert-spectrum__track">
          <div class="likert-spectrum__fill" :style="{ '--active-index': activeScaleIndex }" />

          <label
            v-for="(option, index) in orderedScaleOptions"
            :key="option.key"
            class="likert-spectrum__node"
            :class="{
              'likert-spectrum__node--active': selectedScaleValue === option.value,
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
            >

            <span class="likert-spectrum__orb" aria-hidden="true">
              <span class="likert-spectrum__orb-ring" />
              <span class="likert-spectrum__orb-core" />
              <span class="likert-spectrum__orb-pulse" />
            </span>
          </label>
        </div>
      </fieldset>

      <template v-else>
        <motion.button
          v-for="(option, index) in session.current_question?.options || []"
          :key="option.id"
          type="button"
          class="answer-option answer-option--choice rounded-[1.65rem] p-4 text-left md:p-5"
          :disabled="isSubmitting"
          :aria-label="option.label"
          :class="selectedOptionId === option.id ? 'is-selected' : ''"
          :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="prefersReduced ? { duration: 0 } : { delay: index * 0.05, duration: 0.24 }"
          :while-hover="prefersReduced ? {} : { x: 5 }"
          :while-press="prefersReduced ? {} : { scale: 0.985 }"
          @click="handleOptionSelect(option)"
        >
          <div class="flex items-start gap-4">
            <div class="answer-option__number flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] text-sm font-semibold">
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="wrap-break-word text-base font-semibold leading-7 text-(--cx-ink) md:text-[1.05rem]">{{ option.label }}</p>
              <p class="mt-1 text-sm leading-6 text-(--cx-ink-soft)">
                Tap to lock this answer and continue.
              </p>
            </div>
            <span class="answer-option__chevron hidden sm:inline-flex" aria-hidden="true">
              <span class="answer-option__chevron-arrow">&rarr;</span>
            </span>
          </div>
        </motion.button>
      </template>
    </div>

    <div v-if="session.current_question" class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-5">
      <p class="status-copy">
        {{
          isSubmitting
            ? 'Saving your answer...'
            : isLikertQuestion
              ? 'Agreement response. Immediate next step.'
              : 'Single decision. Immediate next step.'
        }}
      </p>
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-ink-soft)">
        <span class="inline-flex h-2 w-2 rounded-full bg-(--cx-accent)" />
        {{
          isLikertQuestion
            ? 'Agreement scale'
            : session.current_question.question_type === 'ranked_choice'
              ? 'Priority response'
              : 'Tap to continue'
        }}
      </div>
    </div>

    <div
      v-else
      class="mt-8 rounded-[1.6rem] border border-black/6 bg-white/75 p-5 text-sm leading-7 text-(--cx-ink-soft)"
    >
      This session does not have an answerable question right now. Refresh the page to check whether the next step has
      resolved.
    </div>
  </section>
</template>
