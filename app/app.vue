<script setup>
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
    </UApp>
  </div>
</template>
