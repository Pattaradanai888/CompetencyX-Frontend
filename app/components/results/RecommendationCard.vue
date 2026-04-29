<script setup lang="ts">
import { getRecommendationHeadline, hasTopicRecommendation } from '~/utils/assessment'
import type { Recommendation } from '~/shared/types/assessment'

defineProps<{
  eyebrow: string
  recommendation: Recommendation | null
}>()
</script>

<template>
  <section class="paper-panel rounded-[2rem] p-6">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h3 class="mt-4 font-display text-2xl text-[var(--cx-ink)]">
      {{ getRecommendationHeadline(recommendation) }}
    </h3>
    <p class="mt-3 break-words text-sm leading-7 text-[var(--cx-ink-soft)]">
      {{ recommendation?.reason || 'A focused next topic is not available for this path yet.' }}
    </p>
    <div class="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cx-ink-soft)]">
      <span class="rounded-full border border-black/10 bg-white/80 px-3 py-1">
        {{ recommendation?.policy_type || 'Recommendation in review' }}
      </span>
      <span class="rounded-full border border-black/10 bg-white/80 px-3 py-1">
        {{ hasTopicRecommendation(recommendation) ? recommendation?.role_slug : 'More signal needed' }}
      </span>
    </div>
  </section>
</template>
