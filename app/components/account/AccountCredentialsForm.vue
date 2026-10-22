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
const emailError = ref('')
const passwordError = ref('')
const emailInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

const actionLabel = computed(() =>
  props.mode === 'register' ? t.value.registerAction : t.value.signInAction,
)

// Typing clears the field's error so the message tracks the latest state.
watch(email, () => {
  if (emailError.value) emailError.value = ''
})
watch(password, () => {
  if (passwordError.value) passwordError.value = ''
})

function handleSubmit() {
  emailError.value = email.value.trim() ? '' : t.value.emailRequired
  passwordError.value = password.value ? '' : t.value.passwordRequired

  if (!emailError.value && emailInput.value?.validity.typeMismatch) {
    emailError.value = t.value.emailInvalid
  }
  if (
    !passwordError.value &&
    props.mode === 'register' &&
    password.value.length < 8
  ) {
    passwordError.value = t.value.passwordTooShort
  }

  if (emailError.value) {
    emailInput.value?.focus()
    return
  }
  if (passwordError.value) {
    passwordInput.value?.focus()
    return
  }

  if (props.isSubmitting) return
  emit('submit', { email: email.value.trim(), password: password.value })
}
</script>

<template>
  <form class="grid gap-5" novalidate @submit.prevent="handleSubmit">
    <label class="grid gap-2 text-sm font-semibold text-ink">
      <span>{{ t.email }}</span>
      <input
        ref="emailInput"
        v-model="email"
        name="email"
        type="email"
        autocomplete="email"
        spellcheck="false"
        autocapitalize="none"
        required
        :aria-invalid="emailError ? 'true' : undefined"
        :aria-describedby="emailError ? 'email-error' : undefined"
        class="cx-input"
      />
      <p
        v-if="emailError"
        id="email-error"
        class="text-xs font-normal leading-5 text-error"
      >
        {{ emailError }}
      </p>
    </label>

    <label class="grid gap-2 text-sm font-semibold text-ink">
      <span>{{ t.password }}</span>
      <input
        ref="passwordInput"
        v-model="password"
        name="password"
        type="password"
        :autocomplete="
          mode === 'register' ? 'new-password' : 'current-password'
        "
        required
        :minlength="mode === 'register' ? 8 : undefined"
        :aria-invalid="passwordError ? 'true' : undefined"
        :aria-describedby="passwordError ? 'password-error' : undefined"
        class="cx-input"
      />
      <p
        v-if="passwordError"
        id="password-error"
        class="text-xs font-normal leading-5 text-error"
      >
        {{ passwordError }}
      </p>
      <span
        v-else-if="mode === 'register'"
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
      class="cx-button-primary w-full"
      :disabled="isSubmitting"
      :aria-busy="isSubmitting ? 'true' : undefined"
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
