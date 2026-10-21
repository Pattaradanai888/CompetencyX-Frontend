<script setup lang="ts">
export interface QuizAnswerOption {
  key: string | number
  label: string
}

const props = withDefaults(
  defineProps<{
    options: QuizAnswerOption[]
    label: string
    selectedKey?: string | number | null
    disabled?: boolean
    layout?: 'stack' | 'row'
  }>(),
  { selectedKey: null, disabled: false, layout: 'stack' },
)

const emit = defineEmits<{
  select: [option: QuizAnswerOption]
}>()

function choose(option: QuizAnswerOption) {
  if (props.disabled) return
  emit('select', option)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (props.disabled || event.repeat) return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const target = event.target
  if (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"]')
  ) {
    return
  }
  const option = /^[1-9]$/.test(event.key)
    ? props.options[Number(event.key) - 1]
    : undefined
  if (!option) return
  event.preventDefault()
  choose(option)
})
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="quiz-answer-list"
    :class="layout === 'row' ? 'quiz-answer-list--row' : ''"
  >
    <button
      v-for="(option, index) in options"
      :key="option.key"
      type="button"
      class="quiz-answer"
      :aria-pressed="selectedKey === option.key"
      :disabled="disabled"
      @click="choose(option)"
    >
      <kbd class="quiz-answer__key" aria-hidden="true">{{ index + 1 }}</kbd>
      <span class="min-w-0 wrap-break-word">{{ option.label }}</span>
    </button>
  </div>
</template>
