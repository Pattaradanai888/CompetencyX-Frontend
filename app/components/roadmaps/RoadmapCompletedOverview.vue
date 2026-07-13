<script setup lang="ts">
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import type { RadarDimension, DimensionCard } from '~/utils/roadmaps'
import type { RoadmapTopic } from '~~/shared/types/assessment'

const props = defineProps<{
  roleTitle: string
  overallCapabilityScore: number
  recalculatedStrengths: string[]
  recalculatedGrowthAreas: string[]
  targetScore: number
  isAtTarget: boolean
  capabilityGap: number
  displayTopics: RoadmapTopic[]
  priorityTopics: RoadmapTopic[]
  blendedDimensions: RadarDimension[]
  strongestDimensionCards: DimensionCard[]
  hasRoleAnswers: boolean
  isThai: boolean
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

function scrollToGapInsight() {
  const el = document.getElementById('role-gap-insight')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollToTopic(topicId: number) {
  const el = document.getElementById(`step-${topicId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const targetPerDimension = computed<RadarDimension[]>(() =>
  props.blendedDimensions.map((d) => ({
    ...d,
    value: props.targetScore / 100,
  })),
)
</script>

<template>
  <section class="result-spotlight mt-10 p-5 md:p-10">
    <div
      class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
    >
      <span aria-hidden="true">✓</span>
      {{ t.assessmentComplete }}
    </div>

    <h2
      class="mt-6 font-display text-4xl leading-tight text-ink md:text-6xl"
    >
      {{ roleTitle }} {{ t.readinessOrganized }}
    </h2>
    <p class="mt-5 text-sm leading-8 text-ink-soft md:text-base">
      {{ t.viewIntro }}
    </p>

    <div class="mt-8 grid gap-5 items-start xl:grid-cols-[1.3fr_1fr]">
      <!-- Left column -->
      <div class="flex flex-col gap-5 self-start">
        <div v-if="hasRoleAnswers || overallCapabilityScore > 0">
          <article class="paper-panel flex flex-col p-5">
            <p class="eyebrow">{{ t.overallReadiness }}</p>
            <div class="mt-3 flex flex-1 flex-col justify-center">
              <div class="rounded-xl bg-surface-card p-4 text-center">
                <p class="data-value text-5xl font-bold text-ink">
                  {{ overallCapabilityScore }}%
                </p>
                <p class="mt-1 text-xs leading-6 text-ink-soft">
                  {{ t.currentCapability }}
                </p>
                <div class="mt-3 h-2 rounded-full bg-ink/8">
                  <div
                    class="h-2 rounded-full bg-accent"
                    :style="{ width: `${overallCapabilityScore}%` }"
                  />
                </div>
              </div>
              <p class="mt-3 text-xs leading-6 text-ink-soft">
                {{ isThai ? 'คะแนนความพร้อมโดยประมาณจากคำตอบของคุณ — ยิ่งสูงยิ่งบ่งบอกว่าคุณมีพื้นฐานที่สอดคล้องกับบทบาทนี้มาก' : 'Estimated readiness from all your answers — higher means your existing knowledge already aligns more closely with this role.' }}
              </p>
              <div class="mt-4 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-semibold text-ink-soft">{{ isThai ? 'จุดแข็ง' : 'Strengths' }}</span>
                  <span class="text-xs font-bold text-green-600">{{ recalculatedStrengths.length }} {{ isThai ? 'ด้าน' : 'areas' }}</span>
                </div>
                <div
                  class="flex cursor-pointer items-center justify-between"
                  @click="scrollToGapInsight"
                >
                  <span class="text-[11px] font-semibold text-ink-soft">{{ isThai ? 'ช่องว่างที่ต้องพัฒนา' : 'Gaps to close' }}</span>
                  <span class="text-xs font-bold text-accent underline decoration-accent/30 underline-offset-2">
                    {{ recalculatedGrowthAreas.length }} {{ isThai ? 'ด้าน' : 'areas' }}
                  </span>
                </div>
              </div>
          </div>
        </article>
      </div>
      <article id="role-gap-insight" class="paper-panel p-5 min-h-[420px]">
          <p class="eyebrow">{{ t.roleGapInsight }}</p>
          <h3 class="mt-2 text-xl font-bold text-ink">
            {{ roleTitle }}
          </h3>
          <p class="mt-1 text-xs leading-6 text-ink-soft">
            {{ t.gapInsightCopy }}
          </p>
          <p
            class="mt-2 rounded-lg border border-blueprint/15 bg-blueprint/5 px-3 py-2 text-[11px] leading-6 text-blueprint/80"
          >
            {{ isThai ? 'คิดง่าย ๆ: "ปัจจุบัน" คือสิ่งที่คุณรู้อยู่แล้ว "เป้าหมาย" คือสิ่งที่บทบาทนี้ต้องการ — ยิ่งช่องว่างน้อยเท่าไหร่ ยิ่งหมายความว่าคุณพร้อมมากขึ้น' : 'Think of it simply: "As-Is" is what you already know; "To-Be" is what this role looks for. The smaller the gap, the more ready you are.' }}
          </p>

          <div class="mt-4 grid gap-3">
            <div
              class="rounded-xl border-l-4 border-l-blueprint bg-surface-card px-4 py-3"
            >
              <p
                class="text-[11px] font-bold uppercase tracking-[0.1em] text-blueprint"
              >
                {{ t.asIs }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ t.currentCapability }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-bold text-ink">
                  {{ overallCapabilityScore }}%
                </p>
                <p class="text-[11px] font-semibold text-ink-soft">
                  {{ t.overallReadiness }}
                </p>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-blueprint"
                  :style="{ width: `${overallCapabilityScore}%` }"
                />
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">
                {{ t.topGaps }}: {{ recalculatedGrowthAreas.join(' • ') }}
              </p>
            </div>

            <div
              class="rounded-xl border-l-4 border-l-accent bg-surface-card px-4 py-3"
            >
              <p
                class="text-[11px] font-bold uppercase tracking-[0.1em] text-accent"
              >
                {{ t.toBe }}
              </p>
              <p class="mt-1 text-sm font-bold text-ink">
                {{ roleTitle }}
              </p>
              <div class="mt-2 flex items-end justify-between gap-3">
                <p class="data-value text-2xl font-bold text-accent">
                  {{ targetScore }}%
                </p>
                <p class="text-[11px] font-semibold text-ink-soft">
                  {{ t.targetReadiness }}
                </p>
              </div>
              <div class="mt-1 h-1.5 rounded-full bg-ink/8">
                <div
                  class="h-1.5 rounded-full bg-accent"
                  :style="{ width: `${targetScore}%` }"
                />
              </div>

              <div
                class="mt-2 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-2"
              >
                <p class="text-[11px] font-bold text-ink-soft">
                  {{ t.gapToTarget }}
                </p>
                <p
                  class="text-sm font-bold"
                  :class="isAtTarget ? 'text-green-600' : 'text-ink'"
                >
                  {{
                    isAtTarget
                      ? t.gapClosed
                      : `${capabilityGap}%`
                  }}
                </p>
              </div>

              <p
                v-if="!isAtTarget"
                class="mt-2 text-[11px] leading-5 text-ink-soft/70"
              >
                {{ isThai ? `เป้าหมาย ${targetScore}% เป็นค่ามาตรฐานของบทบาทนี้ — ยิ่งคะแนนสูงหมายความว่าคุณมีความรู้และทักษะที่สอดคล้องกับบทบาทมากขึ้น ไม่ต้องกังวลถ้ายังไม่ถึง คุณสามารถพัฒนาได้จากแผนการเรียนรู้ด้านล่าง` : `A ${targetScore}% target is the readiness benchmark for this role. Higher scores mean your knowledge better aligns with what the role typically requires. Do not worry if you are below it — the learning plan below will help you close the gap.` }}
              </p>

              <p class="mt-3 text-xs leading-5 text-ink-soft">
                {{ displayTopics.length }} {{ t.gapTopicsCount }}
              </p>
              <div
                v-if="displayTopics.length"
                class="mt-1 flex flex-wrap gap-1.5"
              >
                <button
                  v-for="topic in priorityTopics.slice(0, 3)"
                  :key="topic.id"
                  class="cursor-pointer rounded-full border border-border-subtle bg-surface-elevated/60 px-2 py-0.5 text-[11px] font-semibold text-ink-soft transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                  @click="scrollToTopic(topic.id)"
                >
                  {{ topic.title }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Right column: spider chart + strength distribution + development priorities -->
      <div class="grid gap-5 xl:self-start">
        <article class="paper-panel p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.capabilityMap }}</p>
              <h3 class="mt-2 text-xl font-bold text-ink">
                {{ t.profileCenterpiece }}
              </h3>
            </div>
            <div
              class="shrink-0 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-center"
            >
              <p class="data-value text-lg font-bold text-accent">
                {{ overallCapabilityScore }}%
              </p>
              <p
                class="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
              >
                {{ t.overallReadiness }}
              </p>
            </div>
          </div>
          <p class="mt-2 text-xs leading-6 text-ink-soft">
            {{ t.mapCopy }}
          </p>
          <div class="mt-4">
            <SkillSpiderChart
              :dimensions="blendedDimensions"
              :target-dimensions="targetPerDimension"
            />
          </div>
        </article>

        <!-- Strength distribution — compact, below spider chart -->
        <article class="paper-panel p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow">{{ t.strengthDistribution }}</p>
              <h3 class="mt-1 text-xs font-bold text-ink">
                {{ t.strongestDimensions }}
              </h3>
              <p class="mt-1 text-[11px] leading-5 text-ink-soft">
                {{ t.strongestDimensionsCopy }}
              </p>
            </div>
            <p class="data-value text-xs font-bold text-accent">
              {{ strongestDimensionCards.length }} {{ isThai ? 'ด้าน' : 'areas' }}
            </p>
          </div>
          <div class="mt-4 grid gap-3">
            <div
              v-for="dim in strongestDimensionCards"
              :key="dim.key"
              class="flex items-center justify-between gap-3"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold text-ink">
                  {{ dim.label }}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-ink-soft">
                  {{ dim.description }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-16 rounded-full bg-ink/8 md:w-20">
                  <div
                    class="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--color-blueprint),var(--color-accent))]"
                    :style="{ width: `${dim.percent}%` }"
                  />
                </div>
                <span class="w-7 text-right text-[11px] font-bold text-ink">{{ dim.percent }}%</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
