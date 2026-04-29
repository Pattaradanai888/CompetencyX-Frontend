<script setup lang="ts">
import { getAlignmentLabel, getQuestionStageLabel, getRoleResolutionLabel, getTotalAnswered } from '~/utils/assessment'
import type { AssessmentSession } from '~/shared/types/assessment'

defineProps<{
  session: AssessmentSession
}>()

const isExpanded = ref(false)
</script>

<template>
  <aside class="paper-panel assessment-sidebar rounded-[2rem] p-6 md:p-7">
    <!-- Always-visible header with toggle -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 text-left"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <div class="min-w-0">
        <p class="eyebrow">Live guidance</p>
        <h2 class="mt-2 font-display text-2xl text-[var(--cx-ink)]">
          {{ getQuestionStageLabel(session.current_question?.stage || 'role') }}
        </h2>
      </div>
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/6 bg-white/80 text-[var(--cx-ink-soft)] transition-transform duration-300"
        :class="isExpanded ? 'rotate-180' : ''"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <!-- Compact one-liner always visible -->
    <p class="mt-3 text-sm text-[var(--cx-ink-soft)]">
      Q{{ getTotalAnswered(session.milestones) }} answered
      <span class="mx-1.5 opacity-40">&middot;</span>
      {{ getAlignmentLabel(session.role_alignment_status) }}
      <span class="mx-1.5 opacity-40">&middot;</span>
      {{ getRoleResolutionLabel(session.role_resolution_status) }}
    </p>

    <!-- Expandable detail panel -->
    <div
      class="grid transition-all duration-300 ease-in-out"
      :class="isExpanded ? 'mt-6 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'"
    >
      <div class="min-h-0 overflow-hidden">
        <p class="text-sm leading-7 text-[var(--cx-ink-soft)]">
          {{ session.guidance_summary }}
        </p>

        <div class="my-6 metric-rule" />

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div class="assessment-stat rounded-[1.35rem] border border-black/6 bg-white/72 p-4">
            <p class="eyebrow">Alignment</p>
            <p class="mt-2 text-lg font-semibold text-[var(--cx-ink)]">
              {{ getAlignmentLabel(session.role_alignment_status) }}
            </p>
          </div>
          <div class="assessment-stat rounded-[1.35rem] border border-black/6 bg-white/72 p-4">
            <p class="eyebrow">Resolution</p>
            <p class="mt-2 text-lg font-semibold text-[var(--cx-ink)]">
              {{ getRoleResolutionLabel(session.role_resolution_status) }}
            </p>
          </div>
          <div class="assessment-stat rounded-[1.35rem] border border-black/6 bg-white/72 p-4">
            <p class="eyebrow">Role answers</p>
            <p class="mt-2 text-lg font-semibold text-[var(--cx-ink)]">
              <span class="data-value">{{ session.milestones.answered_role_questions }}</span>
            </p>
          </div>
          <div class="assessment-stat rounded-[1.35rem] border border-black/6 bg-white/72 p-4">
            <p class="eyebrow">Questions answered</p>
            <p class="mt-2 text-lg font-semibold text-[var(--cx-ink)]">
              <span class="data-value">{{ getTotalAnswered(session.milestones) }}</span>
            </p>
          </div>
        </div>

        <div class="mt-6 rounded-[1.5rem] border border-black/6 bg-white/78 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cx-warm)]">
            Current read
          </p>
          <p class="mt-3 text-sm text-[var(--cx-ink-soft)]">
            Preferred role:
            <span class="font-semibold text-[var(--cx-ink)]">
              {{ session.preferred_role?.name || 'Undeclared' }}
            </span>
          </p>
          <p class="mt-2 text-sm text-[var(--cx-ink-soft)]">
            Best fit:
            <span class="font-semibold text-[var(--cx-ink)]">
              {{ session.best_fit_role?.name || 'Emerging from your answers' }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
