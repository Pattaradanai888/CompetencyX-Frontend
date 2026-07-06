<script setup lang="ts">
import { motion } from 'motion-v'
import { useLocale } from '~/composables/useLocale'
import { useQuestionI18n } from '~/composables/useQuestionI18n'
import type { RoadmapsScaleOption } from '~~/shared/types/assessment'

const props = defineProps<{
  phase2GuidanceTitle: string
  phase2ProgressSummary: string
  roadmapsProgressPercent: number
  phase2PromptContext: string
  preferredRoleName: string | null
  activeQuestion: { id: string; prompt: string; translations?: any } | null
  isSavingRoadmaps: boolean
  isAutoAdvancing: boolean
  answerScale: RoadmapsScaleOption[]
  activeQuestionAnswer: number | null
  phase2Microcopy: string
  currentQuestionIndex: number
}>()

const emit = defineEmits<{
  selectAnswer: [value: number]
  previousQuestion: []
  complete: []
}>()

const prefersReduced = useReducedMotion()
const isGuidanceExpanded = ref(false)
const { isThai } = useLocale()
const t = usePageI18n('questionnaire', isThai)

const activeQuestionRef = computed(() => props.activeQuestion)
const { localizedPrompt } = useQuestionI18n(() => activeQuestionRef.value)

function getRoadmapScaleLabel(option: RoadmapsScaleOption): string {
  return isThai.value ? (option.label_th ?? option.label) : option.label
}

function selectAnswer(val: number) {
  emit('selectAnswer', val)
}

function goToPreviousQuestion() {
  emit('previousQuestion')
}
</script>

<template>
  <section
    class="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start"
    aria-live="polite"
  >
    <aside class="lg:sticky lg:top-8">
      <section class="phase2-guidance-card">
        <button
          type="button"
          class="phase2-guidance-card__toggle"
          :aria-expanded="isGuidanceExpanded"
          aria-controls="phase2-guidance-body"
          @click="isGuidanceExpanded = !isGuidanceExpanded"
        >
          <div class="min-w-0">
            <p class="phase2-guidance-card__label">Live guidance</p>
            <h2 class="phase2-guidance-card__title">
              {{ phase2GuidanceTitle }}
            </h2>
            <p class="phase2-guidance-card__meta">
              {{ phase2ProgressSummary }}
            </p>
          </div>
          <span
            class="phase2-guidance-card__icon"
            :class="isGuidanceExpanded ? 'rotate-180' : ''"
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>

        <div
          id="phase2-guidance-body"
          class="grid transition-all duration-300 ease-out"
          :class="
            isGuidanceExpanded
              ? 'mt-6 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
          "
        >
          <div class="min-h-0 overflow-hidden">
            <p class="phase2-guidance-card__copy">
              Answer calmly and literally. This pass measures present-day
              execution strength, not aspiration.
            </p>

            <div class="phase2-guidance-card__meter">
              <div class="phase2-guidance-card__meter-head">
                <span>Assessment progress</span>
                <span>{{ roadmapsProgressPercent }}%</span>
              </div>
              <div
                class="phase2-guidance-card__progress"
                role="progressbar"
                aria-label="Phase 2 progress"
                :aria-valuenow="roadmapsProgressPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="phase2-guidance-card__progress-fill"
                  :style="{ width: `${roadmapsProgressPercent}%` }"
                />
              </div>
            </div>

            <div class="phase2-guidance-card__facts">
              <div class="phase2-guidance-card__fact">
                <span class="phase2-guidance-card__fact-label">Phase</span>
                <span class="phase2-guidance-card__fact-value">
                  Skill assessment
                </span>
              </div>
              <div class="phase2-guidance-card__fact">
                <span class="phase2-guidance-card__fact-label">Question</span>
                <span class="phase2-guidance-card__fact-value">
                  {{ phase2PromptContext }}
                </span>
              </div>
              <div class="phase2-guidance-card__fact">
                <span class="phase2-guidance-card__fact-label">Known role</span>
                <span class="phase2-guidance-card__fact-value">
                  {{ preferredRoleName || 'Open discovery path' }}
                </span>
              </div>
            </div>

            <p class="phase2-guidance-card__footnote">
              Your roadmap stays hidden until this calibration step is complete.
            </p>
          </div>
        </div>
      </section>
    </aside>

    <section class="phase2-panel">
      <div class="phase2-panel__chips">
        <span class="phase2-panel__eyebrow">Skill assessment</span>
        <span class="phase2-panel__chip phase2-panel__chip--soft">
          Agreement scale
        </span>
      </div>

      <motion.div
        v-if="activeQuestion"
        class="phase2-question-shell"
        :key="activeQuestion.id"
        :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="prefersReduced ? { duration: 0 } : { duration: 0.28 }"
      >
        <div class="phase2-question-card">
          <div class="phase2-question-card__frame">
            <p class="phase2-question-card__prompt-label">
              {{ phase2PromptContext }}
            </p>
            <h2 class="phase2-question-card__prompt">
              {{
                localizedPrompt ||
                activeQuestion?.prompt ||
                (isThai
                  ? 'กำลังโหลดคำถามต่อไป...'
                  : 'Loading the next scenario...')
              }}
            </h2>
          </div>

          <fieldset
            class="phase2-scale"
            :disabled="isSavingRoadmaps || isAutoAdvancing"
          >
            <legend class="sr-only">
              Choose a value from strongly disagree to strongly agree
            </legend>

            <div class="phase2-scale__caption">
              <span>Strongly disagree</span>
              <span>Strongly agree</span>
            </div>

            <div class="phase2-scale__track">
              <span class="phase2-scale__rail" aria-hidden="true" />

              <button
                v-for="option in answerScale"
                :key="`${activeQuestion.id}-${option.value}`"
                type="button"
                class="phase2-scale__option"
                :class="
                  activeQuestionAnswer === option.value
                    ? 'phase2-scale__option--selected'
                    : ''
                "
                :aria-pressed="activeQuestionAnswer === option.value"
                :aria-label="option.label"
                :disabled="isSavingRoadmaps || isAutoAdvancing"
                @click="selectAnswer(option.value)"
              >
                <span class="phase2-scale__orb" aria-hidden="true">
                  <span class="phase2-scale__orb-core" />
                </span>
                <span class="phase2-scale__option-label">
                  {{ getRoadmapScaleLabel(option) }}
                </span>
              </button>
            </div>
          </fieldset>
        </div>

        <div class="phase2-panel__footer">
          <p class="phase2-panel__microcopy">
            {{ phase2Microcopy }}
          </p>
          <div class="phase2-panel__actions">
            <button
              type="button"
              class="phase2-button phase2-button--ghost"
              :disabled="currentQuestionIndex === 0"
              @click="goToPreviousQuestion"
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
  </section>
</template>
