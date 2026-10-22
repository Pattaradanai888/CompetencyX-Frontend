<script setup lang="ts">
const props = defineProps<{
  score: number
  /** The backend-derived target, or null when this role has no readiness data. */
  target: number | null
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

const gap = computed(() =>
  props.target === null ? null : Math.max(0, props.target - props.score),
)

const summary = computed(() => {
  if (gap.value === null) return t.value.readinessNoTarget
  if (gap.value === 0) return t.value.readinessAtTarget
  return t.value.readinessGap.replace('{n}', String(gap.value))
})
</script>

<template>
  <section
    class="surface mt-8 p-5 md:p-6"
    data-testid="readiness-meter"
    :aria-label="t.readinessTitle"
  >
    <div class="readiness-meter__values">
      <div>
        <p class="readiness-meter__label">{{ t.readinessYou }}</p>
        <p class="readiness-meter__value text-blueprint">{{ score }}%</p>
      </div>
      <div v-if="target !== null" class="text-right">
        <p class="readiness-meter__label">{{ t.readinessTarget }}</p>
        <p class="readiness-meter__value text-accent">{{ target }}%</p>
      </div>
    </div>
    <div class="readiness-meter__track" role="img" :aria-label="summary">
      <div
        class="readiness-meter__fill"
        :style="{ width: `${Math.min(100, score)}%` }"
      />
      <span
        v-if="target !== null"
        class="readiness-meter__target"
        :style="{ left: `${Math.min(100, target)}%` }"
      />
    </div>
    <p class="mt-4 font-bold text-ink">{{ summary }}</p>
  </section>
</template>
