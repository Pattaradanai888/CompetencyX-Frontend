<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import type { ApiError } from '~~/shared/types/assessment'

const props = defineProps<{
  mode: 'sign-in' | 'register'
  isSubmitting: boolean
  error: ApiError | null
  isThai: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { email: string; password: string }]
}>()

const t = usePageI18n('account', () => props.isThai)

const email = ref('')
const password = ref('')

const actionLabel = computed(() =>
  props.mode === 'register' ? t.value.registerAction : t.value.signInAction,
)

const canSubmit = computed(
  () =>
    !props.isSubmitting &&
    email.value.trim().length > 0 &&
    password.value.length > 0,
)

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', { email: email.value.trim(), password: password.value })
}
</script>

<template>
  <form class="grid gap-5" novalidate @submit.prevent="handleSubmit">
    <label class="grid gap-2 text-sm font-semibold text-ink">
      <span>{{ t.email }}</span>
      <input
        v-model="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        class="w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-base font-normal text-ink placeholder:text-ink-soft/50 transition focus-visible:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
      />
    </label>

    <label class="grid gap-2 text-sm font-semibold text-ink">
      <span>{{ t.password }}</span>
      <input
        v-model="password"
        name="password"
        type="password"
        :autocomplete="
          mode === 'register' ? 'new-password' : 'current-password'
        "
        required
        :minlength="mode === 'register' ? 8 : undefined"
        class="w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-base font-normal text-ink transition focus-visible:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
      />
      <span
        v-if="mode === 'register'"
        class="text-xs font-normal leading-6 text-ink-soft"
      >
        {{ t.passwordHint }}
      </span>
    </label>

    <p
      v-if="error"
      role="alert"
      aria-live="polite"
      class="cx-error-panel p-4 text-sm"
    >
      {{ getErrorMessage(error) }}
    </p>

    <button
      type="submit"
      class="cx-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="!canSubmit"
    >
      <span
        v-if="isSubmitting"
        class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        aria-hidden="true"
      />
      {{ isSubmitting ? t.working : actionLabel }}
    </button>
  </form>
</template>
