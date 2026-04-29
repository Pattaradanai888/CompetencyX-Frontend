<template>
  <div class="isolate min-h-screen">
    <UApp>
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <NuxtRouteAnnouncer />
      <NuxtLoadingIndicator color="var(--cx-accent)" />
      <div class="app-shell">
        <div class="ambient-orb ambient-orb-one" />
        <div class="ambient-orb ambient-orb-two" />
        <div class="ambient-grid" />
        <NuxtPage />
      </div>
    </UApp>
  </div>
</template>
