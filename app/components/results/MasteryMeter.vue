<script setup lang="ts">
import { formatMasteryPercent } from '~/utils/assessment'
import type { TopicMastery } from '~~/shared/types/assessment'

defineProps<{
  mastery: TopicMastery
}>()
</script>

<template>
  <div class="rounded-md border border-border-subtle bg-surface-card p-4">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="break-words text-sm font-semibold text-ink">
          {{ mastery.topic_title }}
        </p>
        <p class="mt-1 text-xs uppercase tracking-[0.08em] text-ink-soft">
          Confidence {{ formatMasteryPercent(mastery.confidence_score) }}
        </p>
      </div>
      <p class="data-value text-sm font-semibold text-accent">
        {{ formatMasteryPercent(mastery.mastery_score) }}
      </p>
    </div>
    <div class="mastery-track mt-4 h-2 rounded-full">
      <div
        class="mastery-fill h-2 rounded-full"
        :style="{
          width: `${Math.max(0, Math.min((mastery.mastery_score ?? 0) * 100, 100))}%`,
        }"
      />
    </div>
  </div>
</template>
