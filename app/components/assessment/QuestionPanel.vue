<script setup lang="ts">
import QuizAnswerList, {
  type QuizAnswerOption,
} from '~/components/quiz/QuizAnswerList.vue'
import QuizShell from '~/components/quiz/QuizShell.vue'
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

const selectedKey = ref<string | number | null>(null)

watch(
  () => currentQuestion.value?.id,
  () => {
    selectedKey.value = null
  },
  { immediate: true },
)

const isThai = computed(() => props.session.language === 'th')

const isLikertQuestion = computed(
  () => currentQuestion.value?.question_type === 'likert_5',
)

const orderedScaleOptions = computed(() =>
  [...(localizedResponseScale.value || [])].sort(
    (left, right) => left.value - right.value,
  ),
)

const isTrueFalseMaybeChoice = computed(() => {
  const labels = (currentQuestion.value?.options || []).map(
    (option: QuestionOption) => option.key.trim().toLowerCase(),
  )

  return (
    labels.length === 3 &&
    ['true', 'false', 'maybe'].every((label) => labels.includes(label))
  )
})

const answerOptions = computed<QuizAnswerOption[]>(() =>
  isLikertQuestion.value
    ? orderedScaleOptions.value.map((option) => ({
        key: option.key,
        label: option.label,
      }))
    : (localizedOptions.value || []).map((option: QuestionOption) => ({
        key: option.id,
        label: option.label,
      })),
)

const questionCeiling = computed(
  () => props.session.milestones.max_role_questions ?? null,
)

const questionNumber = computed(
  () => props.session.milestones.answered_role_questions + 1,
)

function handleSelect(answer: QuizAnswerOption) {
  selectedKey.value = answer.key

  if (isLikertQuestion.value) {
    const option = orderedScaleOptions.value.find(
      (scaleOption) => scaleOption.key === answer.key,
    )
    if (option) {
      emit('select', { kind: 'scale', scaleValue: option.value, option })
    }
    return
  }

  const option = (localizedOptions.value || []).find(
    (choice: QuestionOption) => choice.id === answer.key,
  )
  if (option) {
    emit('select', { kind: 'option', option })
  }
}
</script>

<template>
  <QuizShell
    :question-key="currentQuestion?.id ?? 'resolving'"
    :prompt="
      currentQuestion
        ? localizedPrompt
        : isThai
          ? 'กำลังสรุปผลจากคำตอบของคุณ'
          : 'Working out your result'
    "
    :help="
      currentQuestion
        ? localizedHelpText
        : isThai
          ? 'ถ้าหน้านี้ไม่เปลี่ยนภายในไม่กี่วินาที ให้กดรีเฟรช'
          : 'If this does not change in a few seconds, refresh.'
    "
    exit-to="/"
    :exit-label="isThai ? 'ออกจากแบบประเมิน' : 'Leave the assessment'"
    :count="
      currentQuestion
        ? isThai
          ? questionCeiling
            ? `ข้อ ${questionNumber} · ไม่เกิน ${questionCeiling} ข้อ`
            : `ข้อ ${questionNumber}`
          : questionCeiling
            ? `Question ${questionNumber} · up to ${questionCeiling}`
            : `Question ${questionNumber}`
        : ''
    "
  >
    <template v-if="currentQuestion">
      <QuizAnswerList
        :options="answerOptions"
        :label="
          isLikertQuestion
            ? isThai
              ? 'ระดับความเห็น จากไม่เห็นด้วยอย่างยิ่งถึงเห็นด้วยอย่างยิ่ง'
              : 'Agreement, from strongly disagree to strongly agree'
            : isThai
              ? 'ตัวเลือกคำตอบ'
              : 'Answer options'
        "
        :selected-key="selectedKey"
        :disabled="isSubmitting"
        :layout="isTrueFalseMaybeChoice ? 'row' : 'stack'"
        @select="handleSelect"
      />
      <p
        v-if="responseError"
        role="alert"
        class="cx-error-panel mt-6 p-4 text-sm"
      >
        {{ responseError }}
      </p>
    </template>

    <template #footer>
      <slot name="footer" />
      <p class="quiz-status ml-auto" aria-live="polite">
        {{
          isSubmitting ? (isThai ? 'กำลังบันทึกคำตอบ…' : 'Saving answer…') : ''
        }}
      </p>
    </template>
  </QuizShell>
</template>
