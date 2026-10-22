<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'

const { currentLanguage, selectLanguage } = useLocale()

const languages = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
] as const
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-xl border-2 border-border-subtle p-0.5"
  >
    <button
      v-for="language in languages"
      :key="language.code"
      type="button"
      class="min-h-9 rounded-lg px-2.5 text-sm font-bold transition-colors"
      :lang="language.code"
      :aria-pressed="currentLanguage === language.code"
      :class="
        currentLanguage === language.code
          ? 'bg-ink text-white'
          : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
      "
      @click="selectLanguage(language.code)"
    >
      {{ language.label }}
    </button>
  </div>
</template>
