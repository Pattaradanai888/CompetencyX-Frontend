<script setup lang="ts">
const props = defineProps<{
  title: string
  progressSummary: string
  progressPercent: number
  promptContext: string
  preferredRoleName: string | null
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

const isExpanded = ref(false)
</script>

<template>
  <section class="skill-assessment-guidance-card">
    <button
      type="button"
      class="skill-assessment-guidance-card__toggle"
      :aria-expanded="isExpanded"
      aria-controls="skill-assessment-guidance-body"
      @click="isExpanded = !isExpanded"
    >
      <div class="min-w-0">
        <p class="skill-assessment-guidance-card__label">
          {{ t.liveGuidance }}
        </p>
        <h2 class="skill-assessment-guidance-card__title">
          {{ title }}
        </h2>
        <p class="skill-assessment-guidance-card__meta">
          {{ progressSummary }}
        </p>
      </div>
      <span
        class="skill-assessment-guidance-card__icon"
        :class="isExpanded ? 'rotate-180' : ''"
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
      id="skill-assessment-guidance-body"
      class="grid transition-all duration-300 ease-out"
      :class="
        isExpanded
          ? 'mt-6 grid-rows-[1fr] opacity-100'
          : 'mt-0 grid-rows-[0fr] opacity-0'
      "
    >
      <div class="min-h-0 overflow-hidden">
        <p class="skill-assessment-guidance-card__copy">
          {{ t.guidanceCopy }}
        </p>

        <div class="skill-assessment-guidance-card__meter">
          <div class="skill-assessment-guidance-card__meter-head">
            <span>{{ t.assessmentProgress }}</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div
            class="skill-assessment-guidance-card__progress"
            role="progressbar"
            :aria-label="t.assessmentProgress"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="skill-assessment-guidance-card__progress-fill"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <div class="skill-assessment-guidance-card__facts">
          <div class="skill-assessment-guidance-card__fact">
            <span class="skill-assessment-guidance-card__fact-label">{{
              t.phase
            }}</span>
            <span class="skill-assessment-guidance-card__fact-value">
              {{ t.phaseSkillAssessment }}
            </span>
          </div>
          <div class="skill-assessment-guidance-card__fact">
            <span class="skill-assessment-guidance-card__fact-label">{{
              t.questionLabel
            }}</span>
            <span class="skill-assessment-guidance-card__fact-value">
              {{ promptContext }}
            </span>
          </div>
          <div class="skill-assessment-guidance-card__fact">
            <span class="skill-assessment-guidance-card__fact-label">{{
              t.knownRole
            }}</span>
            <span class="skill-assessment-guidance-card__fact-value">
              {{ preferredRoleName || t.openDiscoveryPath }}
            </span>
          </div>
        </div>

        <p class="skill-assessment-guidance-card__footnote">
          {{ t.roadmapHiddenNote }}
        </p>
      </div>
    </div>
  </section>
</template>
