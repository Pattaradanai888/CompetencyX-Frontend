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

const processSteps = [
  {
    eyebrow: 'Phase 1',
    title: 'Role discovery',
    copy: 'Personality, work-style, and preference prompts reveal the software roles that fit how you naturally solve problems.',
  },
  {
    eyebrow: 'Decision point',
    title: 'Choose or confirm a path',
    copy: 'Students who already know their target role can skip discovery and move directly into skill assessment.',
  },
  {
    eyebrow: 'Phase 2',
    title: 'Skill calibration',
    copy: 'Role-aware technical questions map your current level, confidence, and priority gaps.',
  },
  {
    eyebrow: 'Outcome',
    title: 'Roadmap dashboard',
    copy: 'Results turn into a focused learning plan with next topics, suggested projects, and readiness signals.',
  },
]

const studentBenefits = [
  'Turns vague interest into a concrete role direction',
  'Separates personality fit from current technical readiness',
  'Gives a practical learning sequence instead of a generic course list',
  'Keeps the assessment low-pressure with one decision at a time',
]

const roleFamilies = [
  ['Frontend', 'Interfaces, React, responsive systems'],
  ['Backend', 'APIs, databases, authentication'],
  ['Full Stack', 'End-to-end product engineering'],
  ['Mobile', 'iOS, Android, cross-platform apps'],
  ['DevOps', 'Deployment, automation, reliability'],
  ['Data', 'Pipelines, analytics, machine learning'],
  ['QA', 'Quality strategy and test automation'],
  ['Product', 'Discovery, prioritization, delivery'],
]

const timeline = [
  'Start with a role target or open discovery',
  'Answer focused personality and preference prompts',
  'Review the strongest role match and alternatives',
  'Complete the role-specific skill assessment',
  'Use the final roadmap to plan your next projects',
]

const faqs = [
  {
    question: 'Can I skip the personality assessment?',
    answer:
      'Yes. If you already know your preferred role, select it during onboarding and continue directly into the skill-focused path.',
  },
  {
    question: 'Is this only for beginners?',
    answer:
      'No. The flow works for students who are exploring roles and for students who already have experience but need a clearer roadmap.',
  },
  {
    question: 'What do I get at the end?',
    answer:
      'You get a role-fit read, skill breakdown, gap topics, and a roadmap that turns the result into concrete next steps.',
  },
]

useSeoMeta({
  title: 'CompetencyX | Adaptive roadmap assessment',
  description:
    'Start an adaptive competency assessment and get a role roadmap tailored to your strengths, gaps, and next learning step.',
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
          Discover your software path
        </div>
        <h1
          class="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl lg:text-6xl"
        >
          Find the software role that
          <span class="text-accent">fits how you think</span>
        </h1>
        <p
          class="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg"
        >
          CompetencyX guides students through role discovery and technical skill
          calibration, then turns the result into a clear learning roadmap.
        </p>

        <div
          class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <NuxtLink to="/assessment/start" class="cx-button-primary">
            Start discovery
          </NuxtLink>
          <NuxtLink
            v-if="lastSessionId"
            :to="`/assessment/${lastSessionId}`"
            class="cx-button-secondary"
          >
            Resume last session
          </NuxtLink>
          <NuxtLink to="#how-it-works" class="cx-button-secondary">
            See the flow
          </NuxtLink>
        </div>

        <p class="mt-8 text-sm text-ink-soft">
          Built for students choosing from
          <span class="font-bold text-ink">11+ software paths</span>
          with one low-pressure decision at a time.
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
            class="rounded-lg border border-white/75 bg-white/78 p-4 shadow-sm backdrop-blur md:p-6"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="eyebrow">Live pathway preview</p>
                <p
                  class="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl"
                >
                  Discovery signal + skill signal = career roadmap
                </p>
              </div>
              <span
                class="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
              >
                Adaptive
              </span>
            </div>

            <div class="mt-6 grid gap-3 md:grid-cols-4">
              <div
                v-for="(step, index) in processSteps"
                :key="step.title"
                class="rounded-lg border border-border-subtle bg-white/80 p-4"
              >
                <p class="data-value text-sm font-black text-accent">
                  0{{ index + 1 }}
                </p>
                <p class="mt-3 text-sm font-extrabold leading-6 text-ink">
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
          Role previews are unavailable right now. You can still begin the
          assessment.
        </p>
      </motion.div>
    </motion.section>

    <section id="how-it-works" class="section-band py-16">
      <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p class="eyebrow">How it works</p>
          <h2
            class="mt-3 max-w-xl text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            Two assessments, one usable direction.
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            Phase 1 helps students discover the role shape that fits their
            preferences. Phase 2 checks the technical skills needed for that
            role and produces a practical learning plan.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <motion.article
            v-for="(step, index) in processSteps"
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
            <h3 class="mt-3 text-xl font-extrabold text-ink">
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
          <p class="eyebrow">Why students use it</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            Less guessing. More evidence.
          </h2>
          <div class="mt-8 grid gap-3">
            <div
              v-for="benefit in studentBenefits"
              :key="benefit"
              class="metric-card flex items-start gap-3 p-4"
            >
              <span
                class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent text-xs font-black text-white"
                aria-hidden="true"
              >
                ✓
              </span>
              <p class="text-sm font-semibold leading-6 text-ink">
                {{ benefit }}
              </p>
            </div>
          </div>
        </div>

        <div class="paper-panel p-6">
          <p class="eyebrow">Software roles overview</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div
              v-for="[name, description] in roleFamilies"
              :key="name"
              class="rounded-md border border-border-subtle bg-surface-card p-4"
            >
              <p class="font-extrabold text-ink">{{ name }}</p>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                {{ description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-band py-16">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">Assessment process</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            From uncertainty to roadmap.
          </h2>
        </div>
        <NuxtLink to="/assessment/start" class="cx-button-primary">
          Start now
        </NuxtLink>
      </div>

      <ol class="mt-8 grid gap-3 lg:grid-cols-5">
        <li
          v-for="(item, index) in timeline"
          :key="item"
          class="flow-node min-h-40 p-4 pl-5"
        >
          <p class="data-value text-sm font-black text-accent">
            0{{ index + 1 }}
          </p>
          <p class="mt-4 text-sm font-extrabold leading-6 text-ink">
            {{ item }}
          </p>
        </li>
      </ol>
    </section>

    <section class="mt-16">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Role preview</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            Preview the paths you can calibrate against.
          </h2>
        </div>
        <NuxtLink
          to="/assessment/start"
          class="editorial-link hidden text-sm sm:inline-flex"
        >
          Open onboarding
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
          <p class="eyebrow">FAQ</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            Clear before you begin.
          </h2>
        </div>
        <div class="grid gap-3">
          <details
            v-for="item in faqs"
            :key="item.question"
            class="metric-card group p-5"
          >
            <summary
              class="cursor-pointer list-none text-base font-extrabold text-ink"
            >
              {{ item.question }}
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
            Career discovery and skill roadmaps for software students.
          </p>
        </div>
        <NuxtLink to="/assessment/start" class="cx-button-secondary">
          Begin assessment
        </NuxtLink>
      </div>
    </footer>
  </main>
</template>
