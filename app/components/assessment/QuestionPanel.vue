<script setup lang="ts">
import { motion } from 'motion-v'
import { getQuestionStageLabel, getQuestionTypeLabel } from '~/utils/assessment'
import type { QuestionOption, AssessmentSession } from '~/shared/types/assessment'

const props = defineProps<{
  isSubmitting?: boolean
  responseError?: string | null
  session: AssessmentSession
}>()

const emit = defineEmits<{
  select: [option: QuestionOption]
}>()

const questionModeCopy = computed(() => {
  if (props.session.current_question?.question_type === 'ranked_choice') {
    return 'Pick the option that should carry the most weight in the next recommendation step.'
  }

  return 'Select the answer that fits best and move to the next prompt.'
})
</script>

<template>
  <section class="glass-panel rounded-[2.2rem] p-6 md:p-8">
    <div class="flex flex-wrap items-center gap-3">
      <span class="eyebrow">{{ getQuestionStageLabel(session.current_question?.stage || 'role') }}</span>
      <span class="rounded-full border border-black/6 bg-white/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cx-ink-soft)]">
        {{ getQuestionTypeLabel(session.current_question?.question_type || 'single_choice') }}
      </span>
    </div>

    <div class="mt-5 rounded-[1.7rem] border border-black/6 bg-white/58 p-5 md:p-6">
      <p
        v-if="session.current_question"
        class="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--cx-ink-soft)]"
      >
        {{ questionModeCopy }}
      </p>
      <h1 class="font-display text-3xl leading-tight text-[var(--cx-ink)] md:text-5xl">
        {{ session.current_question?.prompt || 'We are resolving your role signal.' }}
      </h1>
      <p
        v-if="session.current_question?.help_text"
        class="mt-4 max-w-2xl break-words text-sm leading-7 text-[var(--cx-ink-soft)]"
      >
        {{ session.current_question.help_text }}
      </p>
      <p
        v-else-if="!session.current_question"
        class="mt-4 max-w-2xl text-sm leading-7 text-[var(--cx-ink-soft)]"
      >
        {{ session.guidance_summary }}
      </p>
    </div>

    <div v-if="responseError" aria-live="polite" class="mt-6 rounded-[1.5rem] border border-rose-300/50 bg-rose-50/90 p-4 text-sm text-rose-900">
      {{ responseError }}
    </div>

    <div v-if="session.current_question" class="mt-8 grid gap-3 md:gap-4">
      <motion.button
        v-for="(option, index) in session.current_question?.options || []"
        :key="option.id"
        type="button"
        class="option-card option-card-answer rounded-[1.75rem] p-5 text-left md:p-6"
        :disabled="isSubmitting"
        :aria-label="option.label"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: index * 0.05, duration: 0.24 }"
        :while-hover="{ x: 6 }"
        :while-press="{ scale: 0.99 }"
        @click="emit('select', option)"
      >
        <div class="flex items-center gap-4">
          <span class="option-index flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {{ index + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="break-words text-base font-semibold leading-7 text-[var(--cx-ink)] md:text-lg">{{ option.label }}</p>
          </div>
          <span class="option-arrow hidden text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cx-accent)] sm:inline-flex">
            Select
            <span aria-hidden="true" class="ml-2 text-base leading-none">-&gt;</span>
          </span>
          <span class="option-arrow sm:hidden" aria-hidden="true">-&gt;</span>
        </div>
      </motion.button>
    </div>

    <div v-if="session.current_question" class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-5">
      <p class="status-copy">
        {{
          isSubmitting
            ? 'Saving your answer...'
            : 'Single decision. Immediate next step.'
        }}
      </p>
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cx-ink-soft)]">
        <span class="inline-flex h-2 w-2 rounded-full bg-[var(--cx-accent)]" />
        {{
          session.current_question.question_type === 'ranked_choice'
            ? 'Priority response'
            : 'Tap to continue'
        }}
      </div>
    </div>

    <div
      v-else
      class="mt-8 rounded-[1.6rem] border border-black/6 bg-white/75 p-5 text-sm leading-7 text-[var(--cx-ink-soft)]"
    >
      This session does not have an answerable question right now. Refresh the page to check whether the backend has
      resolved the next step.
    </div>
  </section>
</template>
