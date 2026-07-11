<script setup lang="ts">
import { motion } from 'motion-v'
import RoleCard from '~/components/catalog/RoleCard.vue'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import { useLastSession } from '~/composables/useLastSession'
import type { Role } from '~~/shared/types/assessment'

const { listRoles } = useCatalogApi()
const { lastSessionId } = useAssessmentSession()
const { isThai } = useLocale()
const prefersReduced = useReducedMotion()
const { lastSessionRoute, resumeLabel } = useLastSession({
  th: 'ทำเซสชันล่าสุดต่อ',
  en: 'Resume previous session',
})

const { data: roles, error } = await useAsyncData('catalog-roles', listRoles, {
  default: () => [] as Role[],
})

const featuredRoles = computed(() => {
  try {
    return Array.isArray(roles.value) ? roles.value.slice(0, 3) : []
  } catch (e) {
    console.error('Error in featuredRoles', e)
    return []
  }
})

const t = usePageI18n('index', isThai)

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | การประเมินแผนผังที่ปรับเปลี่ยนตามความเหมาะสม'
      : 'CompetencyX | Adaptive roadmap assessment',
  ),
  description: computed(() =>
    isThai.value
      ? 'เริ่มการประเมินความสามารถที่ปรับเปลี่ยนได้ และรับแผนผังบทบาทที่ปรับให้เหมาะกับจุดแข็ง ช่องว่าง และขั้นตอนการเรียนรู้ถัดไปของคุณ'
      : 'Start an adaptive competency assessment and get a role roadmap tailored to your strengths, gaps, and next learning step.',
  ),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <motion.section
      class="relative overflow-hidden py-14 text-center sm:py-20 lg:py-24"
      :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="prefersReduced ? { duration: 0 } : { duration: 0.45 }"
    >
      <div class="mx-auto max-w-4xl">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          <span aria-hidden="true">✦</span>
          {{ t.heroEyebrow }}
        </div>
        <h1
          class="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl lg:text-6xl"
        >
          {{ t.heroTitle }}
          <span class="text-accent">{{ t.heroTitleAccent }}</span>
        </h1>
        <p
          class="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg"
        >
          {{ t.heroSub }}
        </p>

        <div class="landing-cta-stack">
          <NuxtLink
            to="/assessment/preferred-role"
            class="cx-button-primary cx-button-primary--hero"
            :aria-label="t.startBtn"
          >
            <span>{{ t.startBtn }}</span>
            <span class="cx-button-primary__icon" aria-hidden="true">→</span>
          </NuxtLink>
          <NuxtLink
            v-if="lastSessionId && lastSessionRoute"
            :to="lastSessionRoute"
            class="landing-cta-stack__secondary"
          >
            {{ resumeLabel }}
          </NuxtLink>
        </div>

        <p class="mt-8 text-sm text-ink-soft">
          {{ t.heroFooter }}
          <span class="font-bold text-ink"
            >11+ {{ isThai ? 'เส้นทางซอฟต์แวร์' : 'software paths' }}</span
          >
          {{
            isThai
              ? 'ด้วยการตัดสินใจที่เรียบง่ายและไม่กดดัน'
              : 'with one low-pressure decision at a time.'
          }}
        </p>
      </div>

      <motion.div
        class="paper-panel mx-auto mt-14 max-w-5xl overflow-hidden p-2 shadow-xl"
        :initial="
          prefersReduced
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.96 }
        "
        :animate="{ opacity: 1, scale: 1 }"
        :transition="
          prefersReduced ? { duration: 0 } : { delay: 0.12, duration: 0.45 }
        "
      >
        <div
          class="overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(234,112,31,0.18),rgba(255,255,255,0.86)_42%,rgba(33,122,111,0.13))] p-5 text-left md:p-8"
        >
          <div
            class="rounded-lg border border-border-subtle bg-surface-elevated/95 p-4 shadow-sm backdrop-blur md:p-6"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="eyebrow">{{ t.livePreview }}</p>
                <p
                  class="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl"
                >
                  {{ t.previewFormula }}
                </p>
              </div>
              <span
                class="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
              >
                {{ t.adaptive }}
              </span>
            </div>

            <div class="mt-6 grid gap-3 md:grid-cols-4">
              <div
                v-for="(step, index) in t.processSteps"
                :key="step.title"
                class="rounded-lg border border-border-subtle bg-surface-card p-4"
              >
                <p class="data-value text-sm font-bold text-accent">
                  0{{ index + 1 }}
                </p>
                <p class="mt-3 text-sm font-bold leading-6 text-ink">
                  {{ step.title }}
                </p>
                <p class="mt-2 line-clamp-3 text-xs leading-5 text-ink-soft">
                  {{ step.copy }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p
          v-if="error"
          aria-live="polite"
          class="cx-warning-panel mt-4 p-4 text-sm"
        >
          {{
            isThai
              ? 'ไม่สามารถพรีวิวตำแหน่งงานได้ในขณะนี้ แต่คุณยังสามารถเริ่มทำแบบประเมินได้'
              : 'Role previews are unavailable right now. You can still begin the assessment.'
          }}
        </p>
      </motion.div>
    </motion.section>

    <section id="how-it-works" class="section-band py-16">
      <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p class="eyebrow">{{ t.howItWorks }}</p>
          <h2
            class="mt-3 max-w-xl text-4xl font-bold leading-tight text-ink md:text-5xl"
          >
            {{ t.twoAssessments }}
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.howItWorksSub }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <motion.article
            v-for="(step, index) in t.processSteps"
            :key="step.title"
            class="paper-panel p-5"
            :initial="
              prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
            "
            :while-in-view="{ opacity: 1, y: 0 }"
            :viewport="{ once: true, amount: 0.25 }"
            :transition="
              prefersReduced
                ? { duration: 0 }
                : { delay: index * 0.05, duration: 0.28 }
            "
          >
            <p class="eyebrow">{{ step.eyebrow }}</p>
            <h3 class="mt-3 text-xl font-bold text-ink">
              {{ step.title }}
            </h3>
            <p class="mt-3 text-sm leading-7 text-ink-soft">{{ step.copy }}</p>
          </motion.article>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <p class="eyebrow">{{ t.whyStudents }}</p>
          <h2
            class="mt-3 text-4xl font-bold leading-tight text-ink md:text-5xl"
          >
            {{ t.lessGuessing }}
          </h2>
          <div class="mt-8 grid gap-3">
            <div
              v-for="benefit in t.studentBenefits"
              :key="benefit"
              class="metric-card flex items-start gap-3 p-4"
            >
              <span
                class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent text-xs font-bold text-white"
                aria-hidden="true"
              >
                ?
              </span>
              <p class="text-sm font-semibold leading-6 text-ink">
                {{ benefit }}
              </p>
            </div>
          </div>
        </div>

        <div class="paper-panel p-6">
          <p class="eyebrow">{{ t.roleFamiliesTitle }}</p>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.roleFamiliesSub }}
          </p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div
              v-for="role in t.roleFamilies"
              :key="role.name"
              class="rounded-md border border-border-subtle bg-surface-card p-4"
            >
              <div class="flex items-center gap-2">
                <span class="text-base" aria-hidden="true">{{
                  role.icon
                }}</span>
                <p class="font-bold text-ink">{{ role.name }}</p>
              </div>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                {{ role.description }}
              </p>
              <p class="mt-2 text-xs leading-6 text-ink-soft/90">
                {{ role.details }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-band py-16">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">{{ t.processTitle }}</p>
          <h2
            class="mt-3 text-4xl font-bold leading-tight text-ink md:text-5xl"
          >
            {{ t.processSub }}
          </h2>
        </div>
        <NuxtLink
          to="/assessment/preferred-role"
          class="cx-button-primary cx-button-primary--hero"
        >
          <span>{{ t.startNow }}</span>
          <span class="cx-button-primary__icon" aria-hidden="true">→</span>
        </NuxtLink>
      </div>

      <ol class="mt-8 grid gap-3 lg:grid-cols-5">
        <li
          v-for="(item, index) in t.timeline"
          :key="item.title"
          class="flow-node relative min-h-44 p-4 pl-5"
        >
          <span
            v-if="index < t.timeline.length - 1"
            class="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-accent/60 lg:inline"
            aria-hidden="true"
            >→</span
          >
          <div class="flex items-center justify-between gap-3">
            <p class="data-value text-sm font-bold text-accent">
              0{{ index + 1 }}
            </p>
            <span class="text-lg font-bold text-accent" aria-hidden="true">
              {{ item.icon }}
            </span>
          </div>
          <p class="mt-4 text-base font-bold leading-6 text-ink">
            {{ item.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{ item.copy }}
          </p>
        </li>
      </ol>
    </section>

    <section class="mt-16">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">{{ t.rolePreviewTitle }}</p>
          <h2
            class="mt-3 text-4xl font-bold leading-tight text-ink md:text-5xl"
          >
            {{ t.rolePreviewSub }}
          </h2>
        </div>
        <NuxtLink
          to="/assessment/start"
          class="cx-button-primary hidden text-sm sm:inline-flex"
        >
          {{ t.openOnboarding }}
        </NuxtLink>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <RoleCard
          v-for="role in featuredRoles"
          :key="role.id"
          :role="role"
          @select="
            navigateTo({
              path: '/assessment/start',
              query: { role: role.slug },
            })
          "
        />
      </div>
    </section>

    <section class="section-band mt-16 py-16">
      <div class="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p class="eyebrow">{{ t.faqTitle }}</p>
          <h2
            class="mt-3 text-4xl font-bold leading-tight text-ink md:text-5xl"
          >
            {{ t.faqSub }}
          </h2>
        </div>
        <div class="grid gap-3">
          <p class="text-sm leading-7 text-ink-soft">
            {{ t.faqIntro }}
          </p>
          <details
            v-for="item in t.faqs"
            :key="item.question"
            class="metric-card group p-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-bold text-ink"
            >
              <span class="flex items-center gap-2">
                <span aria-hidden="true">{{ item.icon }}</span>
                <span>{{ item.question }}</span>
              </span>
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-ink-soft transition group-open:rotate-180"
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 5L7 9L11 5"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <p class="mt-3 text-sm leading-7 text-ink-soft">
              {{ item.answer }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <footer class="py-12">
      <div
        class="paper-panel flex flex-wrap items-center justify-between gap-4 p-5"
      >
        <div>
          <p class="font-display text-2xl font-bold text-ink">CompetencyX</p>
          <p class="mt-1 text-sm text-ink-soft">
            {{ t.footerSub }}
          </p>
        </div>
        <NuxtLink to="/assessment/preferred-role" class="cx-button-secondary">
          {{ t.beginAssessment }}
        </NuxtLink>
      </div>
    </footer>
  </main>
</template>
