<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import { computed } from 'vue'

const props = defineProps<{
  error: unknown
}>()

const emit = defineEmits<{
  clearError: []
}>()

const { isThai } = useLocale()

const errorMessage = computed(() => {
  // Error may arrive as an Error, a ref-wrapped Error, or unknown
  const err = props.error as
    | { value?: { message?: string }; message?: string }
    | null
    | undefined
  const msg = err?.value?.message ?? err?.message
  if (msg) return msg
  return isThai.value
    ? 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    : 'An unexpected error occurred.'
})

function handleClearError() {
  emit('clearError')
}
</script>

<template>
  <div
    class="page-wrap flex min-h-[50vh] flex-col items-center justify-center text-center"
  >
    <h2 class="font-display text-2xl text-ink">
      {{ isThai ? 'มีบางอย่างผิดพลาด' : 'Something went wrong' }}
    </h2>
    <p class="mt-4 text-ink-soft">{{ errorMessage }}</p>
    <button
      type="button"
      class="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-surface transition hover:bg-ink-soft"
      @click="handleClearError"
    >
      {{ isThai ? 'โหลดหน้าเว็บใหม่' : 'Reload Page' }}
    </button>
  </div>
</template>
