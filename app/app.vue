<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import { useLocale } from '~/composables/useLocale'

const route = useRoute()
const { currentLanguage } = useLocale()

const headerVariant = computed(() =>
  route.path.startsWith('/assessment/') && route.params.sessionId
    ? 'slim'
    : 'full',
)

useHead({
  htmlAttrs: {
    lang: currentLanguage,
  },
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
      <AppHeader :variant="headerVariant" />
      <div class="app-shell">
        <div class="ambient-plane" />
        <div class="ambient-grid" />
        <NuxtPage />
      </div>
    </UApp>
  </div>
</template>
