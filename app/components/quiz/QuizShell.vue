<script setup lang="ts">
import { motion } from 'motion-v'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    questionKey: string | number
    prompt: string
    exitTo: RouteLocationRaw
    exitLabel: string
    context?: string
    help?: string
    count?: string
    progress?: number | null
    progressLabel?: string
  }>(),
  {
    context: '',
    help: '',
    count: '',
    progress: null,
    progressLabel: '',
  },
)

const prefersReduced = useReducedMotion()
const enter = computed(() =>
  prefersReduced.value
    ? { initial: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 8 }, transition: { duration: 0.2 } },
)
</script>

<template>
  <section class="quiz">
    <div class="quiz-bar">
      <NuxtLink
        :to="exitTo"
        class="quiz-exit"
        :aria-label="exitLabel"
        :title="exitLabel"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 5L15 15M15 5L5 15"
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
          />
        </svg>
      </NuxtLink>
      <div
        v-if="progress !== null"
        class="quiz-progress"
        role="progressbar"
        :aria-label="progressLabel"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="quiz-progress__fill" :style="{ width: `${progress}%` }" />
      </div>
      <p v-if="count" class="quiz-count">{{ count }}</p>
    </div>

    <div class="quiz-body" aria-live="polite">
      <motion.div
        :key="questionKey"
        :initial="enter.initial"
        :animate="{ opacity: 1, y: 0 }"
        :transition="enter.transition"
      >
        <p v-if="context" class="quiz-context">{{ context }}</p>
        <h1 class="quiz-prompt">{{ prompt }}</h1>
        <p v-if="help" class="quiz-help">{{ help }}</p>
      </motion.div>
    </div>

    <motion.div
      v-if="$slots.default"
      :key="questionKey"
      class="quiz-answers"
      :initial="enter.initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="enter.transition"
    >
      <slot />
    </motion.div>

    <div v-if="$slots.footer" class="quiz-footer">
      <slot name="footer" />
    </div>
  </section>
</template>
