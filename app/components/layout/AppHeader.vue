<script setup lang="ts">
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLastSession } from '~/composables/useLastSession'
import { useLocale } from '~/composables/useLocale'

const props = withDefaults(
  defineProps<{
    variant?: 'full' | 'slim'
  }>(),
  { variant: 'full' },
)

const route = useRoute()
const { lastSessionId } = useAssessmentSession()
const { lastSessionRoute } = useLastSession()
const { isThai } = useLocale()
const mobileMenuOpen = ref(false)
const isSlim = computed(() => props.variant === 'slim')

const navItems = computed(() => [
  { label: isThai.value ? 'ภาพรวม' : 'Overview', to: '/' },
  {
    label: isThai.value ? 'เริ่มต้น' : 'Start',
    to: '/assessment/preferred-role',
  },
])

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(path)
}

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  },
)
</script>

<template>
  <header class="app-header">
    <nav class="app-header__inner" aria-label="Main navigation">
      <NuxtLink to="/" class="app-header__brand" aria-label="CompetencyX home">
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

      <div v-if="!isSlim" class="app-header__nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="app-header__link"
          :class="isActive(item.to) ? 'is-active' : ''"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <div class="app-header__actions">
        <NuxtLink
          v-if="!isSlim && lastSessionId"
          :to="lastSessionRoute ?? `/assessment/${lastSessionId}`"
          class="app-header__ghost"
        >
          {{ isThai ? 'ทำต่อ' : 'Resume' }}
        </NuxtLink>
        <NuxtLink
          v-if="!isSlim"
          to="/assessment/preferred-role"
          class="app-header__cta"
        >
          {{ isThai ? 'เริ่มเลย' : 'Begin' }}
        </NuxtLink>
        <button
          v-if="!isSlim"
          type="button"
          class="app-header__menu"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-main-nav"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5H15M3 9H15M3 13H15"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5L13 13M13 5L5 13"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </nav>

    <div
      v-if="!isSlim"
      id="mobile-main-nav"
      class="app-header__mobile"
      :class="mobileMenuOpen ? 'is-open' : ''"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="app-header__mobile-link"
        :class="isActive(item.to) ? 'is-active' : ''"
      >
        {{ item.label }}
      </NuxtLink>
      <NuxtLink
        v-if="lastSessionId"
        :to="lastSessionRoute ?? `/assessment/${lastSessionId}`"
        class="app-header__mobile-link"
      >
        {{ isThai ? 'ทำเซสชันต่อ' : 'Resume session' }}
      </NuxtLink>
      <NuxtLink to="/assessment/preferred-role" class="app-header__mobile-cta">
        {{ isThai ? 'เริ่มการประเมิน' : 'Start assessment' }}
      </NuxtLink>
    </div>
  </header>
</template>
