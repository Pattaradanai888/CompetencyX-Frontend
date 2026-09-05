<script setup lang="ts">
import LocaleToggler from '~/components/layout/LocaleToggler.vue'
import { useCurrentAccount } from '~/composables/useCurrentAccount'
import { useLocale } from '~/composables/useLocale'

const { isThai } = useLocale()
const { account, isSignedIn, load, signOut } = useCurrentAccount()
const route = useRoute()
const t = usePageI18n('header', isThai)

defineProps<{
  variant?: 'full' | 'slim'
}>()

// Whether someone is signed in is known from the cookie on both server and
// client, so the header renders the right state at once; the email behind
// the credential is fetched after hydration.
onMounted(() => {
  void load()
})

const isSigningOut = ref(false)

async function handleSignOut() {
  if (isSigningOut.value) return
  isSigningOut.value = true
  try {
    await signOut()
  } finally {
    isSigningOut.value = false
  }
}

const signInLink = computed(() => ({
  path: '/account/sign-in',
  query: route.path.startsWith('/account/') ? {} : { next: route.fullPath },
}))
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
        <div
          v-if="isSignedIn"
          class="hidden items-center gap-2 text-xs text-ink-soft sm:flex"
          data-testid="header-account"
        >
          <span class="sr-only">{{ t.signedInAs }}</span>
          <span class="max-w-[14rem] truncate font-semibold text-ink">
            {{ account?.email ?? t.account }}
          </span>
          <button
            type="button"
            class="editorial-link text-xs"
            :disabled="isSigningOut"
            @click="handleSignOut"
          >
            {{ t.signOut }}
          </button>
        </div>
        <NuxtLink
          v-else
          :to="signInLink"
          class="editorial-link text-xs font-semibold"
          data-testid="header-sign-in"
        >
          {{ t.signIn }}
        </NuxtLink>
        <LocaleToggler />
      </div>
    </nav>
  </header>
</template>
