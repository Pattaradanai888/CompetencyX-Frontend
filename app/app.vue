<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'

const { currentLanguage, selectLanguage } = useLocale()

useHead({
  titleTemplate: '%s | CompetencyX',
  meta: [
    { name: 'theme-color', content: '#fbf6eb' },
    {
      name: 'description',
      content:
        'Adaptive competency assessment with personalized role roadmaps.',
    },
  ],
})
</script>

<template>
  <div class="isolate min-h-screen">
    <UApp>
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <NuxtRouteAnnouncer />
      <NuxtLoadingIndicator color="var(--color-accent)" />
      <div class="app-shell">
        <div class="ambient-plane" />
        <div class="ambient-grid" />
        <AppHeader />
        <NuxtPage />
      </div>
      <div
        class="fixed right-4 top-3 z-50 flex items-center gap-1 rounded-full border border-border-subtle bg-surface-elevated/80 p-0.5 shadow-sm backdrop-blur-sm"
      >
        <button
          type="button"
          class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.05em] transition-all duration-300"
          :class="
            currentLanguage === 'en'
              ? 'bg-accent text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]'
              : 'text-ink-soft hover:text-ink hover:bg-surface-muted/50'
          "
          @click="selectLanguage('en')"
        >
          <span>🇺🇸</span>
          <span class="hidden sm:inline">EN</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.05em] transition-all duration-300"
          :class="
            currentLanguage === 'th'
              ? 'bg-accent text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]'
              : 'text-ink-soft hover:text-ink hover:bg-surface-muted/50'
          "
          @click="selectLanguage('th')"
        >
          <span>🇹🇭</span>
          <span class="hidden sm:inline">TH</span>
        </button>
      </div>
    </UApp>
  </div>
</template>
