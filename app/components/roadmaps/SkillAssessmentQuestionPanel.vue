<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import QuizAnswerList, {
  type QuizAnswerOption,
} from '~/components/quiz/QuizAnswerList.vue'
import QuizShell from '~/components/quiz/QuizShell.vue'
import { getRoadmapScaleLabel } from '~/utils/roadmaps'
import type { SkillAssessmentScaleOption } from '~~/shared/types/assessment'

const props = defineProps<{
  question: { id: string; prompt: string } | null
  prompt: string
  context: string
  count: string
  progress: number
  status: string
  exitTo: RouteLocationRaw
  answerScale: SkillAssessmentScaleOption[]
  selectedValue: number | null
  isSaving: boolean
  isAutoAdvancing: boolean
  isFirstQuestion: boolean
  isThai: boolean
}>()

const emit = defineEmits<{
  select: [value: number]
  previous: []
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

const answerOptions = computed<QuizAnswerOption[]>(() =>
  props.answerScale.map((option) => ({
    key: option.value,
    label: getRoadmapScaleLabel(option, props.isThai),
  })),
)
</script>

<template>
  <QuizShell
    :question-key="question?.id ?? 'resolving'"
    :prompt="question ? prompt : t.resolvingQuestion"
    :help="question ? (isFirstQuestion ? t.rateToday : '') : t.refreshPrompt"
    :context="context"
    :count="count"
    :progress="progress"
    :progress-label="t.assessmentProgress"
    :exit-to="exitTo"
    :exit-label="t.leaveAssessment"
  >
    <QuizAnswerList
      v-if="question"
      :options="answerOptions"
      :label="t.scaleGroupLabel"
      :selected-key="selectedValue"
      :disabled="isSaving || isAutoAdvancing"
      @select="emit('select', Number($event.key))"
    />

    <template #footer>
      <button
        v-if="question"
        type="button"
        class="cx-button-secondary"
        :disabled="isFirstQuestion || isSaving || isAutoAdvancing"
        @click="emit('previous')"
      >
        {{ t.previous }}
      </button>
      <p class="quiz-status ml-auto" aria-live="polite">{{ status }}</p>
    </template>
  </QuizShell>
</template>
