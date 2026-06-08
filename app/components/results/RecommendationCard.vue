<script setup lang="ts">
import {
  getRecommendationHeadline,
  hasTopicRecommendation,
} from '~/utils/assessment'
import type { Recommendation } from '~~/shared/types/assessment'

defineProps<{
  eyebrow: string
  recommendation: Recommendation | null
}>()
</script>

<template>
  <section class="paper-panel p-6 md:p-8">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h3 class="mt-4 text-2xl font-bold text-ink">
      {{ getRecommendationHeadline(recommendation) }}
    </h3>
    <p class="mt-3 wrap-break-word text-sm leading-7 text-ink-soft">
      {{
        recommendation?.reason ||
        'A focused next topic is not available for this path.'
      }}
    </p>
    <div
      class="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-ink-soft"
    >
      <span
        class="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1"
      >
        {{ recommendation?.policy_type || 'Recommendation in review' }}
      </span>
      <span
        class="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1"
      >
        {{
          hasTopicRecommendation(recommendation)
            ? recommendation?.role_slug
            : 'More signal needed'
        }}
      </span>
    </div>
  </section>
</template>
