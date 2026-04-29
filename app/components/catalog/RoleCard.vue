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
    class="option-card role-card flex h-full w-full flex-col text-left"
    :class="compact ? 'rounded-[1.35rem] p-4' : 'rounded-[1.75rem] p-5 md:p-6'"
    :aria-label="`Choose ${role.name}`"
    :aria-pressed="selected ? 'true' : 'false'"
    :while-hover="prefersReduced ? {} : { y: compact ? -2 : -4 }"
    :while-press="prefersReduced ? {} : { scale: 0.99 }"
    :transition="prefersReduced ? { duration: 0 } : { duration: 0.2 }"
    @click="emit('select', role.slug)"
  >
    <div
      class="flex items-start justify-between"
      :class="compact ? 'gap-2' : 'gap-4'"
    >
      <div class="min-w-0">
        <p
          class="font-display text-[var(--cx-ink)]"
          :class="compact ? 'text-base leading-snug' : 'text-xl'"
        >
          {{ role.name }}
        </p>
        <p
          v-if="!compact"
          class="mt-2 break-words text-sm leading-6 text-[var(--cx-ink-soft)]"
        >
          {{
            role.description ||
            'Explore how this path aligns with your interests and current skill shape.'
          }}
        </p>
      </div>
      <span
        v-if="!compact"
        class="shrink-0 rounded-full border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
        :class="
          selected
            ? 'border-emerald-700/30 bg-emerald-700/10 text-emerald-900'
            : 'border-black/8 bg-white/80 text-[var(--cx-ink-soft)]'
        "
      >
        {{ selected ? 'Selected' : 'Optional' }}
      </span>
    </div>

    <div
      :class="
        compact
          ? 'mt-auto flex items-center justify-between pt-3 text-xs font-semibold'
          : 'mt-5 flex items-center justify-between gap-4 text-sm text-[var(--cx-ink-soft)]'
      "
    >
      <span
        v-if="!compact"
        class="min-w-0 break-words text-sm text-[var(--cx-ink-soft)]"
      >
        {{
          topicsCount
            ? `${topicsCount} roadmap topics preview`
            : 'Preview on selection'
        }}
      </span>
      <span
        class="font-semibold"
        :class="
          selected ? 'text-[var(--cx-accent)]' : 'text-[var(--cx-ink-soft)]'
        "
      >
        {{ selected ? 'Selected' : 'Choose role' }}
      </span>
    </div>
  </motion.button>
</template>
