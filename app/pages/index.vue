<script setup lang="ts">
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import { useLastSession } from '~/composables/useLastSession'
import type { Role } from '~~/shared/types/assessment'

const { listRoles } = useCatalogApi()
const { lastSessionId } = useAssessmentSession()
const { isThai } = useLocale()
const { lastSessionRoute, resumeLabel } = useLastSession({
  th: 'ทำเซสชันล่าสุดต่อ',
  en: 'Resume previous session',
})

const { data: roles } = await useAsyncData('catalog-roles', listRoles, {
  default: () => [] as Role[],
})

const featuredRoles = computed(() =>
  Array.isArray(roles.value) ? roles.value.slice(0, 3) : [],
)

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
    <section
      class="animate-fade-in-up grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.85fr] lg:items-center lg:py-28 lg:min-h-[calc(88vh-8rem)]"
    >
      <div>
        <p class="eyebrow">{{ t.heroEyebrow }}</p>
        <h1
          class="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-6xl"
        >
          {{ t.heroTitle }}
          <span class="text-accent">{{ t.heroTitleAccent }}</span>
        </h1>
        <p class="mt-6 max-w-xl text-base leading-8 text-ink-soft md:text-lg">
          {{ t.heroSub }}
        </p>

        <div class="mt-9 flex flex-wrap items-center gap-4">
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
            class="editorial-link text-sm"
          >
            {{ resumeLabel }}
          </NuxtLink>
        </div>

        <p class="mt-7 text-sm text-ink-soft">
          {{ t.heroFooter }}
        </p>
      </div>

      <div class="relative mx-auto w-full max-w-md lg:max-w-none">
        <div
          class="absolute -inset-3 -z-10 rotate-2 rounded-[1.25rem] border border-accent/10 bg-accent/5"
          aria-hidden="true"
        />
        <div class="paper-panel p-6 md:p-7">
          <div class="flex items-center justify-between gap-3">
            <p class="eyebrow">
              {{ isThai ? 'ตัวอย่างผลลัพธ์' : 'Example result' }}
            </p>
            <span
              class="rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-xs font-bold text-accent"
            >
              {{ isThai ? 'ปรับตามผู้ใช้' : 'Personalized' }}
            </span>
          </div>
          <p class="mt-3 font-display text-2xl font-semibold text-ink">
            {{ featuredRoles[0]?.name ?? 'Backend Engineer' }}
          </p>

          <div class="mt-5 grid gap-3">
            <div
              class="rounded-xl border-l-4 border-l-blueprint bg-surface-card px-4 py-3"
            >
              <div class="flex items-end justify-between gap-3">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.1em] text-blueprint"
                >
                  {{ isThai ? 'ระดับปัจจุบัน' : 'Where you are' }}
                </p>
                <p class="data-value text-xl font-bold text-ink">58%</p>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                <div class="h-1.5 w-[58%] rounded-full bg-blueprint" />
              </div>
            </div>

            <div
              class="rounded-xl border-l-4 border-l-accent bg-surface-card px-4 py-3"
            >
              <div class="flex items-end justify-between gap-3">
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.1em] text-accent"
                >
                  {{ isThai ? 'เป้าหมายของบทบาท' : 'Role target' }}
                </p>
                <p class="data-value text-xl font-bold text-accent">78%</p>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-ink/8">
                <div class="h-1.5 w-[78%] rounded-full bg-accent" />
              </div>
            </div>
          </div>

          <p
            class="mt-4 border-t border-border-subtle pt-4 text-xs leading-6 text-ink-soft"
          >
            {{
              isThai
                ? 'แบบประเมินจะวัดช่องว่างของคุณ แล้วเรียงหัวข้อที่ต้องเรียนให้เป็นลำดับ'
                : 'The assessment measures your gap, then orders the topics you need to close it.'
            }}
          </p>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="section-band py-16 md:py-24 lg:py-28">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">{{ t.howItWorks }}</p>
          <h2
            class="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight text-ink md:text-5xl"
          >
            {{ t.twoAssessments }}
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.howItWorksSub }}
          </p>
        </div>
        <NuxtLink
          to="/assessment/preferred-role"
          class="cx-button-primary cx-button-primary--hero"
        >
          <span>{{ t.startBtn }}</span>
          <span class="cx-button-primary__icon" aria-hidden="true">→</span>
        </NuxtLink>
      </div>

      <ol class="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        <li
          v-for="(item, index) in t.timeline"
          :key="item.title"
          class="border-t-2 border-accent/25 pt-4"
        >
          <p class="font-display text-2xl font-semibold text-accent">
            0{{ index + 1 }}
          </p>
          <p class="mt-3 text-base font-bold leading-6 text-ink">
            {{ item.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{ item.copy }}
          </p>
        </li>
      </ol>
    </section>

    <section class="py-16 md:py-24 lg:py-28">
      <div class="mx-auto max-w-3xl text-center">
        <p class="eyebrow">{{ t.whyStudents }}</p>
        <h2
          class="mt-3 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl"
        >
          {{ t.lessGuessing }}
        </h2>
      </div>
      <div
        class="mx-auto mt-10 grid max-w-4xl gap-x-12 gap-y-7 text-left sm:grid-cols-2"
      >
        <div
          v-for="benefit in t.studentBenefits"
          :key="benefit"
          class="flex items-start gap-3"
        >
          <span
            class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent"
            aria-hidden="true"
          >
            ✓
          </span>
          <p class="text-sm leading-7 text-ink">
            {{ benefit }}
          </p>
        </div>
      </div>
    </section>

    <section class="section-band py-16 md:py-24 lg:py-28">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="max-w-3xl">
          <h2
            class="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl"
          >
            {{ t.roleFamiliesTitle }}
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.roleFamiliesSub }}
          </p>
        </div>
        <NuxtLink to="/assessment/start" class="cx-button-secondary text-sm">
          {{ t.openOnboarding }}
        </NuxtLink>
      </div>
      <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="role in t.roleFamilies"
          :key="role.name"
          class="rounded-lg border border-border-subtle bg-surface-card p-5"
        >
          <p class="font-bold text-ink">{{ role.name }}</p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{ role.description }}
          </p>
          <p class="mt-2 text-xs leading-6 text-ink-soft/90">
            {{ role.details }}
          </p>
        </div>
      </div>
    </section>

    <section class="section-band -mb-20 py-16 md:py-24 lg:py-28">
      <div class="mx-auto max-w-3xl">
        <div class="text-center">
          <p class="eyebrow">{{ t.faqTitle }}</p>
          <h2
            class="mt-3 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl"
          >
            {{ t.faqSub }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.faqIntro }}
          </p>
        </div>
        <div
          class="mt-10 divide-y divide-border-subtle border-y border-border-subtle"
        >
          <details v-for="item in t.faqs" :key="item.question" class="group">
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-bold text-ink transition-colors hover:text-accent"
            >
              <span>{{ item.question }}</span>
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-ink-soft transition group-open:rotate-180"
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
            <p class="max-w-2xl pb-6 text-sm leading-7 text-ink-soft">
              {{ item.answer }}
            </p>
          </details>
        </div>
      </div>
    </section>
  </main>
</template>
