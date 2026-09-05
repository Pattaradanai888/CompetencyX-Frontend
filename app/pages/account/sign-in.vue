<script setup lang="ts">
import AccountCredentialsForm from '~/components/account/AccountCredentialsForm.vue'
import { useAccountApi } from '~/composables/useAccountApi'
import { useCurrentAccount } from '~/composables/useCurrentAccount'
import { useLocale } from '~/composables/useLocale'
import type { ApiError } from '~~/shared/types/assessment'

const route = useRoute()
const { signIn } = useAccountApi()
const { account, isSignedIn, remember } = useCurrentAccount()
const { isThai } = useLocale()
const t = usePageI18n('account', isThai)

const isSubmitting = ref(false)
const error = ref<ApiError | null>(null)

/**
 * Where to go once signed in: the page that sent the respondent here, else
 * home. Only a same-site path is followed: `//host` and `/\host` are
 * protocol-relative URLs to another site, not paths.
 */
const nextPath = computed(() => {
  const next = route.query.next
  return typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : '/'
})

async function handleSubmit(payload: { email: string; password: string }) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  error.value = null
  try {
    remember(await signIn(payload))
    await navigateTo(nextPath.value)
  } catch (caught) {
    error.value = caught as ApiError
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({
  title: computed(() => t.value.signInTitle),
  description: computed(() => t.value.signInIntro),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <section
      class="mx-auto mt-10 max-w-md"
      aria-labelledby="sign-in-title"
      data-testid="sign-in-page"
    >
      <div class="paper-panel p-6 md:p-8">
        <p class="eyebrow">{{ t.signInTitle }}</p>
        <h1
          id="sign-in-title"
          class="mt-3 font-display text-3xl font-semibold leading-tight text-ink md:text-4xl"
        >
          {{ t.signInTitle }}
        </h1>
        <p class="mt-3 text-sm leading-7 text-ink-soft">
          {{ t.signInIntro }}
        </p>

        <div
          v-if="isSignedIn"
          class="mt-6 rounded-xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-ink"
        >
          {{ t.alreadySignedIn }}
          <span class="font-semibold">{{ account?.email ?? '…' }}</span>
          <NuxtLink to="/" class="editorial-link ml-2 text-sm">{{
            t.backHome
          }}</NuxtLink>
        </div>

        <div v-else class="mt-6">
          <AccountCredentialsForm
            mode="sign-in"
            :is-submitting="isSubmitting"
            :error="error"
            :is-thai="isThai"
            @submit="handleSubmit"
          />
          <p class="mt-6 text-sm text-ink-soft">
            {{ t.noAccountYet }}
            <NuxtLink
              :to="{ path: '/account/register', query: route.query }"
              class="editorial-link ml-1 text-sm"
            >
              {{ t.switchToRegister }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
