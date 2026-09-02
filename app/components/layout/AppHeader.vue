<script setup lang="ts">
import LocaleToggler from '~/components/layout/LocaleToggler.vue'
import { useLocale } from '~/composables/useLocale'

const { isThai } = useLocale()

defineProps<{
  variant?: 'full' | 'slim'
}>()
</script>

<template>
  <header class="app-header">
    <nav
      class="app-header__inner"
      :aria-label="isThai ? 'เมนูหลัก' : 'Main navigation'"
    >
      <NuxtLink
        to="/"
        class="app-header__brand"
        :aria-label="isThai ? 'หน้าแรก CompetencyX' : 'CompetencyX home'"
      >
        <span class="app-header__mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2.25L15 5.6V12.4L9 15.75L3 12.4V5.6L9 2.25Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <path
              d="M6.25 9.1L8.2 11.05L12 7.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="font-display text-lg font-bold text-ink">CompetencyX</span>
      </NuxtLink>

      <div class="app-header__actions">
        <LocaleToggler />
      </div>
    </nav>
  </header>
</template>
