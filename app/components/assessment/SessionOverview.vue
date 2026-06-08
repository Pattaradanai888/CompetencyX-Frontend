<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getAlignmentLabel,
  getQuestionStageLabel,
  getRoleResolutionLabel,
  getTotalAnswered,
} from '~/utils/assessment'
import type { AssessmentSession } from '~~/shared/types/assessment'

const props = defineProps<{
  session: AssessmentSession
}>()

const isExpanded = ref(false)
const isThai = computed(() => props.session.language === 'th')
</script>

<template>
  <aside class="paper-panel assessment-sidebar p-6 md:p-8 animate-fade-in-left">
    <!-- Always-visible header with toggle -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 text-left"
      :aria-expanded="isExpanded"
      aria-controls="session-guidance-detail"
      @click="isExpanded = !isExpanded"
    >
      <div class="min-w-0">
        <p class="eyebrow">{{ isThai ? 'คำแนะนำเรียลไทม์' : 'Live guidance' }}</p>
        <h2 class="mt-2 text-2xl font-bold text-ink">
          {{ getQuestionStageLabel(session.current_question?.stage || 'role', session.language) }}
        </h2>
      </div>
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-ink-soft transition-transform duration-300"
        :class="isExpanded ? 'rotate-180' : ''"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3.5 5.25L7 8.75L10.5 5.25"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <!-- Compact one-liner always visible -->
    <p class="mt-3 text-sm text-ink-soft">
      {{ isThai ? 'ตอบแล้ว' : '' }} Q{{ getTotalAnswered(session.milestones) }} {{ isThai ? 'ข้อ' : 'answered' }}
      <span class="mx-1.5 opacity-40">&middot;</span>
      {{ getAlignmentLabel(session.role_alignment_status, session.language) }}
      <span class="mx-1.5 opacity-40">&middot;</span>
      {{ getRoleResolutionLabel(session.role_resolution_status, session.language) }}
    </p>

    <!-- Expandable detail panel -->
    <div
      id="session-guidance-detail"
      class="grid transition-all duration-300 ease-in-out"
      :class="
        isExpanded
          ? 'mt-6 grid-rows-[1fr] opacity-100'
          : 'mt-0 grid-rows-[0fr] opacity-0'
      "
    >
      <div class="min-h-0 overflow-hidden">
        <p class="text-sm leading-7 text-ink-soft">
          {{ session.guidance_summary }}
        </p>

        <div class="my-6 metric-rule" />

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div
            class="assessment-stat rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">{{ isThai ? 'เป้าหมาย' : 'Alignment' }}</p>
            <p class="mt-2 text-lg font-semibold text-ink">
              {{ getAlignmentLabel(session.role_alignment_status, session.language) }}
            </p>
          </div>
          <div
            class="assessment-stat rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">{{ isThai ? 'สถานะวิเคราะห์' : 'Resolution' }}</p>
            <p class="mt-2 text-lg font-semibold text-ink">
              {{ getRoleResolutionLabel(session.role_resolution_status, session.language) }}
            </p>
          </div>
          <div
            class="assessment-stat rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">{{ isThai ? 'ตอบคำถามค้นหา' : 'Role answers' }}</p>
            <p class="mt-2 text-lg font-semibold text-ink">
              <span class="data-value">{{
                session.milestones.answered_role_questions
              }}</span>
            </p>
          </div>
          <div
            class="assessment-stat rounded-md border border-border-subtle bg-surface-card p-4"
          >
            <p class="eyebrow">{{ isThai ? 'คำตอบทั้งหมด' : 'Questions answered' }}</p>
            <p class="mt-2 text-lg font-semibold text-ink">
              <span class="data-value">{{
                getTotalAnswered(session.milestones)
              }}</span>
            </p>
          </div>
        </div>

        <div
          class="mt-6 rounded-lg border border-border-subtle bg-surface-elevated p-4"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.1em] text-warm">
            {{ isThai ? 'ผลวิเคราะห์ปัจจุบัน' : 'Current read' }}
          </p>
          <p class="mt-3 text-sm text-ink-soft">
            {{ isThai ? 'ตำแหน่งเป้าหมาย:' : 'Preferred role:' }}
            <span class="font-semibold text-ink">
              {{ session.preferred_role?.name || (isThai ? 'ยังไม่ได้ระบุ' : 'Undeclared') }}
            </span>
          </p>
          <p class="mt-2 text-sm text-ink-soft">
            {{ isThai ? 'ตำแหน่งที่เหมาะสม:' : 'Best fit:' }}
            <span class="font-semibold text-ink">
              {{ session.best_fit_role?.name || (isThai ? 'กำลังประมวลผลจากคำตอบ' : 'Emerging from your answers') }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
