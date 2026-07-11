<script setup lang="ts">
import { motion } from 'motion-v'
import { getRoadmapScaleLabel } from '~/utils/roadmaps'
import type { RoadmapsScaleOption } from '~~/shared/types/assessment'

const props = withDefaults(
  defineProps<{
    question: { id: string; prompt: string } | null
    prompt: string
    promptContext: string
    microcopy: string
    answerScale: RoadmapsScaleOption[]
    selectedValue: number | null
    isSaving: boolean
    isAutoAdvancing: boolean
    isFirstQuestion: boolean
    isThai: boolean
    prefersReduced?: boolean
  }>(),
  { prefersReduced: false },
)

const emit = defineEmits<{
  select: [value: number]
  previous: []
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

function getScaleLabel(option: RoadmapsScaleOption): string {
  return getRoadmapScaleLabel(option, props.isThai)
}
</script>

<template>
  <section class="phase2-panel">
    <div class="phase2-panel__chips">
      <span class="phase2-panel__eyebrow">Skill assessment</span>
      <span class="phase2-panel__chip phase2-panel__chip--soft">
        Agreement scale
      </span>
    </div>

    <motion.div
      v-if="question"
      :key="question.id"
      class="phase2-question-shell"
      :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="prefersReduced ? { duration: 0 } : { duration: 0.28 }"
    >
      <div class="phase2-question-card">
        <div class="phase2-question-card__frame">
          <p class="phase2-question-card__prompt-label">
            {{ promptContext }}
          </p>
          <h2 class="phase2-question-card__prompt">
            {{ prompt }}
          </h2>
        </div>

        <fieldset class="phase2-scale" :disabled="isSaving || isAutoAdvancing">
          <legend class="sr-only">
            {{
              isThai
                ? 'เลือกค่าตั้งแต่ ไม่เห็นด้วยอย่างยิ่ง ถึง เห็นด้วยอย่างยิ่ง'
                : 'Choose a value from strongly disagree to strongly agree'
            }}
          </legend>

          <div class="phase2-scale__caption">
            <span>{{
              isThai ? 'ไม่เห็นด้วยอย่างยิ่ง' : 'Strongly disagree'
            }}</span>
            <span>{{ isThai ? 'เห็นด้วยอย่างยิ่ง' : 'Strongly agree' }}</span>
          </div>

          <div class="phase2-scale__track">
            <span class="phase2-scale__rail" aria-hidden="true" />

            <button
              v-for="option in answerScale"
              :key="`${question.id}-${option.value}`"
              type="button"
              class="phase2-scale__option"
              :class="
                selectedValue === option.value
                  ? 'phase2-scale__option--selected'
                  : ''
              "
              :aria-pressed="selectedValue === option.value"
              :aria-label="option.label"
              :disabled="isSaving || isAutoAdvancing"
              @click="emit('select', option.value)"
            >
              <span class="phase2-scale__orb" aria-hidden="true">
                <span class="phase2-scale__orb-core" />
              </span>
              <span class="phase2-scale__option-label">
                {{ getScaleLabel(option) }}
              </span>
            </button>
          </div>
        </fieldset>
      </div>

      <div class="phase2-panel__footer">
        <p class="phase2-panel__microcopy">
          {{ microcopy }}
        </p>
        <div class="phase2-panel__actions">
          <button
            type="button"
            class="phase2-button phase2-button--ghost"
            :disabled="isFirstQuestion"
            @click="emit('previous')"
          >
            {{ t.previous }}
          </button>
        </div>
      </div>
    </motion.div>

    <div v-else class="phase2-question-card phase2-question-card--empty">
      <p class="phase2-question-card__prompt-label">
        {{ t.preparingPrompt }}
      </p>
      <h2
        class="phase2-question-card__prompt phase2-question-card__prompt--compact"
      >
        {{ t.resolvingQuestion }}
      </h2>
      <p class="phase2-panel__lead mt-4">
        {{ t.refreshPrompt }}
      </p>
    </div>
  </section>
</template>
