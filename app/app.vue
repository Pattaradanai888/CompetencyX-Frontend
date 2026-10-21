<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import { useLocale } from '~/composables/useLocale'

const route = useRoute()
const { currentLanguage, isThai } = useLocale()
const t = usePageI18n('app', isThai)

const headerVariant = computed(() =>
  route.path.startsWith('/assessment/') && route.params.sessionId
    ? 'slim'
    : 'full',
)

useHead({
  htmlAttrs: {
    lang: currentLanguage,
  },
  titleTemplate: '%s | Competency',
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/fonts/line-seed-sans-th/LINESeedSansTH_W_Rg.woff2',
      crossorigin: '',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/fonts/line-seed-sans-th/LINESeedSansTH_W_Bd.woff2',
      crossorigin: '',
    },
  ],
  meta: [
    { name: 'theme-color', content: '#ffffff' },
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
      <a href="#main-content" class="skip-link">{{ t.skipToContent }}</a>
      <NuxtRouteAnnouncer />
      <NuxtLoadingIndicator color="var(--color-accent)" />
      <AppHeader :variant="headerVariant" />
      <div class="app-shell">
        <NuxtPage />
      </div>
    </UApp>
  </div>
</template>
