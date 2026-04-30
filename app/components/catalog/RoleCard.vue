<script setup lang="ts">
import { motion } from 'motion-v'
import type { Role } from '~/shared/types/assessment'

defineProps<{
  role: Role
  selected?: boolean
  topicsCount?: number
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [roleSlug: string]
}>()

const prefersReduced = useReducedMotion()
</script>

<template>
  <motion.button
    type="button"
    class="option-card role-card group flex h-full w-full flex-col text-left"
    :class="compact ? 'rounded-[1.35rem] p-4' : 'rounded-[1.75rem] p-5 md:p-6'"
    :aria-label="`Choose ${role.name}`"
    :aria-pressed="selected ? 'true' : 'false'"
    :while-hover="prefersReduced ? {} : { y: compact ? -2 : -4 }"
    :while-press="prefersReduced ? {} : { scale: 0.99 }"
    :transition="prefersReduced ? { duration: 0 } : { duration: 0.2 }"
    @click="emit('select', role.slug)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p
          class="font-bold text-(--cx-ink)"
          :class="compact ? 'text-sm leading-snug' : 'text-lg leading-snug'"
        >
          {{ role.name }}
        </p>
        <p
          v-if="!compact && role.description"
          class="mt-1.5 line-clamp-2 break-words text-sm leading-6 text-(--cx-ink-soft)"
        >
          {{ role.description }}
        </p>
      </div>
      <span
        v-if="selected"
        class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--cx-accent) text-white"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.5L5 9L9.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span
        v-else
        class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 text-(--cx-ink-soft) opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>

    <div
      v-if="compact"
      class="mt-auto flex items-center pt-2"
    >
      <span
        v-if="topicsCount"
        class="text-xs text-(--cx-ink-soft)"
      >
        {{ topicsCount }} topics
      </span>
    </div>
  </motion.button>
</template>
