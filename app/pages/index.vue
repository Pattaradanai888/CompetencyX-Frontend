<script setup lang="ts">
import { motion } from 'motion-v'
import RoleCard from '~/components/catalog/RoleCard.vue'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type { Role } from '~/shared/types/assessment'

const { listRoles } = useCatalogApi()
const { lastSessionId } = useAssessmentSession()
const prefersReduced = useReducedMotion()

const { data: roles, error } = await useAsyncData('catalog-roles', listRoles, {
  default: () => [] as Role[],
})

const featuredRoles = computed(() => roles.value.slice(0, 3))

useSeoMeta({
  title: 'CompetencyX | Adaptive roadmap assessment',
  description: 'Start an adaptive competency assessment and get a role roadmap tailored to your strengths, gaps, and next learning step.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <motion.section
      class="grid gap-12 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start"
      :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="prefersReduced ? { duration: 0 } : { duration: 0.45 }"
    >
      <div>
        <p class="eyebrow">Competency assessment</p>
        <h1 class="mt-5 max-w-4xl font-display text-4xl leading-[0.96] text-[var(--cx-ink)] sm:text-5xl md:text-7xl">
          Discover the role that fits your actual skill shape, not just your title.
        </h1>
        <p class="mt-6 max-w-2xl text-base leading-8 text-[var(--cx-ink-soft)] md:text-lg">
          One focused question at a time. A clear roadmap at the end.
        </p>

        <div class="mt-8 flex flex-wrap gap-4">
          <NuxtLink
            to="/assessment/start"
            class="inline-flex items-center justify-center rounded-full bg-[var(--cx-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            Begin the assessment
          </NuxtLink>
          <NuxtLink
            v-if="lastSessionId"
            :to="`/assessment/${lastSessionId}`"
            class="inline-flex items-center justify-center rounded-full border border-[var(--cx-border)] bg-white/85 px-6 py-3 text-sm font-semibold text-[var(--cx-ink)] transition hover:-translate-y-0.5"
          >
            Resume last session
          </NuxtLink>
        </div>

        <div class="assessment-stagebar mt-12 grid gap-4 rounded-[2rem] border border-black/6 bg-white/56 p-5 grid-cols-1 sm:grid-cols-3">
          <div class="glass-panel rounded-[1.5rem] p-4">
            <p class="eyebrow">Step 01</p>
            <p class="mt-3 font-semibold text-[var(--cx-ink)]">Choose a target role or skip it</p>
          </div>
          <div class="glass-panel rounded-[1.5rem] p-4">
            <p class="eyebrow">Step 02</p>
            <p class="mt-3 font-semibold text-[var(--cx-ink)]">Answer focused questions, one at a time</p>
          </div>
          <div class="glass-panel rounded-[1.5rem] p-4">
            <p class="eyebrow">Step 03</p>
            <p class="mt-3 font-semibold text-[var(--cx-ink)]">Review fit, gaps, and next topics</p>
          </div>
        </div>
      </div>

      <div class="paper-panel rounded-[2rem] p-6 md:p-8">
        <p class="eyebrow">How it works</p>
        <div class="mt-5 space-y-4 text-sm leading-7 text-[var(--cx-ink-soft)]">
          <p>
            Every screen presents a single prompt with a clear next step. No clutter, no competing controls.
          </p>
          <p>
            Your answers sharpen the recommendation in real time, building toward a focused role fit and learning roadmap.
          </p>
        </div>
        <div class="my-6 metric-rule" />
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-sm text-[var(--cx-ink-soft)]">
            <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-(--cx-accent)/20 bg-(--cx-accent)/8 text-(--cx-accent)">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5.5L4 7.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
            <span>Adaptive question flow that adjusts to your answers</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-[var(--cx-ink-soft)]">
            <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-(--cx-accent)/20 bg-(--cx-accent)/8 text-(--cx-accent)">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5.5L4 7.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
            <span>Role fit analysis with confidence scoring</span>
          </li>
          <li class="flex items-start gap-3 text-sm text-[var(--cx-ink-soft)]">
            <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-(--cx-accent)/20 bg-(--cx-accent)/8 text-(--cx-accent)">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5.5L4 7.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
            <span>Personalized gap topics and next learning steps</span>
          </li>
        </ul>
        <p
          v-if="error"
          aria-live="polite"
          class="mt-4 rounded-[1.25rem] border border-amber-300/60 bg-amber-50/90 p-4 text-sm text-amber-950"
        >
          Role previews are unavailable right now. You can still begin the assessment.
        </p>
      </div>
    </motion.section>

    <section class="mt-16">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Role preview</p>
          <h2 class="mt-3 text-3xl font-bold text-[var(--cx-ink)] md:text-4xl">
            Preview the paths you can calibrate against
          </h2>
        </div>
        <NuxtLink to="/assessment/start" class="editorial-link text-sm">
          Open onboarding
        </NuxtLink>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <RoleCard
          v-for="role in featuredRoles"
          :key="role.id"
          :role="role"
          @select="navigateTo({ path: '/assessment/start', query: { role: role.slug } })"
        />
      </div>
    </section>
  </main>
</template>
