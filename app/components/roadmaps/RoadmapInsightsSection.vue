<script setup lang="ts">
import type { DimensionCard } from '~/utils/roadmaps'

const props = defineProps<{
  strongestDimensionCards: DimensionCard[]
  growthDimensionCards: DimensionCard[]
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)
</script>

<template>
  <section class="section-band mt-10 py-12 md:py-16">
    <div class="mx-auto max-w-6xl">
      <div class="max-w-3xl">
        <p class="eyebrow">{{ t.section }} 4</p>
        <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
          {{ t.additionalInsights }}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ t.insightsCopy }}
        </p>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-2">
        <article class="paper-panel p-6">
          <p class="eyebrow">{{ t.strengthDistribution }}</p>
          <h3 class="mt-3 text-2xl font-bold text-ink">
            {{ t.strongestDimensions }}
          </h3>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.strongestDimensionsCopy }}
          </p>
          <div class="mt-6 grid gap-4">
            <div
              v-for="dimension in strongestDimensionCards"
              :key="dimension.key"
              class="metric-card p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ dimension.label }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ dimension.percent }}%
                </p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ dimension.description }}
              </p>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                  :style="{ width: `${dimension.percent}%` }"
                />
              </div>
            </div>
          </div>
        </article>

        <article class="paper-panel p-6">
          <p class="eyebrow">{{ t.developmentPriorities }}</p>
          <h3 class="mt-3 text-2xl font-bold text-ink">
            {{ t.improveNext }}
          </h3>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.improveNextCopy }}
          </p>
          <div class="mt-6 grid gap-4">
            <div
              v-for="dimension in growthDimensionCards"
              :key="dimension.key"
              class="metric-card p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-ink">
                  {{ dimension.label }}
                </p>
                <p class="data-value text-sm font-bold text-accent">
                  {{ dimension.percent }}%
                </p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ dimension.description }}
              </p>
              <div class="mt-2 h-2 rounded-full bg-ink/8">
                <div
                  class="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-blueprint))]"
                  :style="{ width: `${dimension.percent}%` }"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
