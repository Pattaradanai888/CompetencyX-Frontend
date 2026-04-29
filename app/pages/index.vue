<script setup lang="ts">
import { motion } from 'motion-v'
import RoleCard from '~/components/catalog/RoleCard.vue'
import { useApiConnection } from '~/composables/useApiConnection'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import type { Role } from '~/shared/types/assessment'

const { apiBase } = useApiConnection()
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
      class="grid gap-10 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start"
      :initial="prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="prefersReduced ? { duration: 0 } : { duration: 0.45 }"
    >
      <div>
        <p class="eyebrow">Adaptive roadmap intake</p>
        <h1 class="mt-5 max-w-4xl font-display text-5xl leading-[0.94] text-[var(--cx-ink)] md:text-7xl">
          Find the role you are really converging toward, then surface the next topic that matters.
        </h1>
        <p class="mt-6 max-w-2xl text-base leading-8 text-[var(--cx-ink-soft)] md:text-lg">
          CompetencyX guides you through one decision at a time, keeps the flow focused, and turns the finished assessment into a clear next-step roadmap.
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

        <div class="assessment-stagebar mt-10 grid gap-4 rounded-[2rem] border border-black/6 bg-white/56 p-4 sm:grid-cols-3">
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
        <p class="eyebrow">What this MVP covers</p>
        <div class="mt-5 space-y-4 text-sm leading-7 text-[var(--cx-ink-soft)]">
          <p>
            Each screen stays calm and deliberate: one prompt, one decision, and one clear next step without clutter or conflicting controls.
          </p>
          <p>
            The current release stays tightly scoped around the core journey: choose a direction, complete the assessment, and review a concise recommendation dossier.
          </p>
        </div>
        <div class="my-6 metric-rule" />
        <p class="text-sm text-[var(--cx-ink-soft)]">
          Local API endpoint:
          <code class="rounded bg-black/5 px-2 py-1 text-[var(--cx-ink)]">{{ apiBase }}</code>
        </p>
        <p
          v-if="error"
          aria-live="polite"
          class="mt-4 rounded-[1.25rem] border border-amber-300/60 bg-amber-50/90 p-4 text-sm text-amber-950"
        >
          Role previews are unavailable right now. You can still begin the assessment and try again from onboarding.
        </p>
      </div>
    </motion.section>

    <section class="mt-10">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Role preview</p>
          <h2 class="mt-3 font-display text-3xl text-[var(--cx-ink)] md:text-4xl">
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
