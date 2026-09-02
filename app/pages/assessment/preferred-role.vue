<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import { PREFERRED_ROLE_KEY } from '~/utils/constants'
import type { ApiError } from '~~/shared/types/assessment'

const { createSession, isSubmitting } = useAssessmentSession()
const { currentLanguage, isThai } = useLocale()
const toast = useToast()
const pageError = ref<ApiError | null>(null)

const t = usePageI18n('preferredRole', isThai)

async function chooseKnownRole() {
  await navigateTo('/assessment/start')
}

async function chooseDiscovery() {
  if (isSubmitting.value) {
    return
  }

  pageError.value = null

  if (import.meta.client) {
    localStorage.removeItem(PREFERRED_ROLE_KEY)
  }

  try {
    const session = await createSession({
      language: currentLanguage.value,
    })

    await navigateTo(`/assessment/${session.id}`)
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: t.value.errorTitle,
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  }
}

useSeoMeta({
  title: computed(() =>
    isThai.value ? 'คำถามเริ่มต้น' : 'Preferred role question',
  ),
  description: computed(() =>
    isThai.value
      ? 'เลือกว่าคุณมีตำแหน่งงานเป้าหมายแล้วหรือยัง เพื่อเริ่มกระบวนการประเมินที่เหมาะสม'
      : 'Choose whether you already have a preferred role before starting the assessment flow.',
  ),
})
</script>

<template>
  <NuxtErrorBoundary>
    <main id="main-content" class="page-wrap">
      <section
        class="onboarding-choice-shell mx-auto mt-8 max-w-5xl"
        aria-labelledby="preferred-role-title"
      >
        <div class="text-center">
          <p class="eyebrow">{{ t.eyebrow }}</p>
          <h1
            id="preferred-role-title"
            class="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl"
          >
            {{ t.title }}
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">
            {{ t.description }}
          </p>
        </div>

        <div class="mt-10 grid gap-4 md:grid-cols-2" role="group">
          <button
            type="button"
            class="preferred-role-option"
            @click="chooseKnownRole"
          >
            <span class="preferred-role-option__marker" aria-hidden="true">
              01
            </span>
            <span class="preferred-role-option__body">
              <span class="preferred-role-option__title">
                {{ t.yesTitle }}
              </span>
              <span class="preferred-role-option__copy">
                {{ t.yesCopy }}
              </span>
              <span class="preferred-role-option__action">
                {{ t.yesAction }}
                <span aria-hidden="true">→</span>
              </span>
            </span>
          </button>

          <button
            type="button"
            class="preferred-role-option preferred-role-option--accent"
            :disabled="isSubmitting"
            @click="chooseDiscovery"
          >
            <span class="preferred-role-option__marker" aria-hidden="true">
              02
            </span>
            <span class="preferred-role-option__body">
              <span class="preferred-role-option__title">
                {{ t.noTitle }}
              </span>
              <span class="preferred-role-option__copy">
                {{ t.noCopy }}
              </span>
              <span class="preferred-role-option__action">
                <span
                  v-if="isSubmitting"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
                  aria-hidden="true"
                />
                {{ isSubmitting ? t.preparing : t.noAction }}
                <span v-if="!isSubmitting" aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        </div>

        <p
          class="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-ink-soft"
        >
          {{ t.footer }}
        </p>

        <p
          v-if="pageError"
          aria-live="polite"
          role="alert"
          class="cx-error-panel mx-auto mt-6 max-w-2xl p-4 text-sm"
        >
          {{ getErrorMessage(pageError) }}
        </p>
      </section>
    </main>
    <template #error="{ error, clearError }">
      <ErrorBoundaryFallback :error="error" @clear-error="clearError" />
    </template>
  </NuxtErrorBoundary>
</template>
