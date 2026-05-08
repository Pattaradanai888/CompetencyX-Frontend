<script setup lang="ts">
import SkillSpiderChart from '~/components/results/SkillSpiderChart.vue'
import { useAssessmentResults } from '~/composables/useAssessmentResults'
import { buildSurvey2Evaluation } from '~/utils/survey2'
import type { RadarDimension } from '~/utils/survey2'
import { getErrorMessage } from '~/utils/api'
import type { ApiError } from '~/shared/types/assessment'

const route = useRoute('/survey2/[sessionId]')
const { getResults, getHistory, getSurvey2State, saveSurvey2State } = useAssessmentResults()
const toast = useToast()

const result = await getResults(route.params.sessionId)
const history = await getHistory(route.params.sessionId).catch(() => null)
const survey2State = await getSurvey2State(route.params.sessionId).catch(() => ({
  completed: false,
  answers: {},
  completed_at: null,
}))
const evaluation = computed(() => buildSurvey2Evaluation(result, history))

const topRoadmapTopics = computed(() => result.preferred_role_gap_topics.slice(0, 6))
const isSurvey2Complete = ref(survey2State.completed)

type Survey2Question = {
  id: string
  prompt: string
  dimensionKey: string
}

const survey2Questions: Survey2Question[] = [
  {
    id: 'q-req',
    prompt: 'I can turn ambiguous business needs into clear technical requirements.',
    dimensionKey: 'sdlc-requirements',
  },
  {
    id: 'q-design',
    prompt: 'I am comfortable designing architecture and making tradeoff decisions.',
    dimensionKey: 'sdlc-design',
  },
  {
    id: 'q-dev',
    prompt: 'I deliver maintainable code with consistent structure and standards.',
    dimensionKey: 'sdlc-development',
  },
  {
    id: 'q-test',
    prompt: 'I define quality checks and test strategy before release.',
    dimensionKey: 'sdlc-testing',
  },
  {
    id: 'q-release',
    prompt: 'I can support deployment/release processes and incident response.',
    dimensionKey: 'sdlc-deployment',
  },
  {
    id: 'q-psp',
    prompt: 'I estimate, track, and improve my own process quality over time.',
    dimensionKey: 'psp-planning',
  },
]

const answerScale = [
  { label: 'Strongly disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly agree', value: 5 },
]

const survey2Answers = ref<Record<string, number>>({ ...survey2State.answers })
const currentQuestionIndex = ref(0)
const isSavingSurvey2 = ref(false)

const hasAnsweredAll = computed(() => {
  return survey2Questions.every((question) => Number.isFinite(survey2Answers.value[question.id]))
})

const activeQuestion = computed(() => survey2Questions[currentQuestionIndex.value] ?? null)
const activeQuestionAnswer = computed(() => {
  if (!activeQuestion.value) {
    return null
  }

  return survey2Answers.value[activeQuestion.value.id] ?? null
})

function getQuestionInfluence(question: Survey2Question): number {
  const raw = survey2Answers.value[question.id]
  if (!Number.isFinite(raw)) {
    return 0
  }

  return (raw - 1) / 4
}

const blendedDimensions = computed<RadarDimension[]>(() => {
  const baseByKey = new Map(evaluation.value.dimensions.map((item) => [item.key, item]))

  return evaluation.value.dimensions.map((dimension) => {
    const matchingQuestions = survey2Questions.filter((question) => question.dimensionKey === dimension.key)
    const influences = matchingQuestions.map((question) => getQuestionInfluence(question))
    const questionScore = influences.length
      ? influences.reduce((sum, value) => sum + value, 0) / influences.length
      : dimension.value

    const blendedValue = Math.max(0, Math.min(1, (dimension.value * 0.7) + (questionScore * 0.3)))
    const base = baseByKey.get(dimension.key) ?? dimension

    return {
      ...base,
      value: blendedValue,
    }
  })
})

const recalculatedStrengths = computed(() => {
  return [...blendedDimensions.value]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((item) => item.label)
})

const recalculatedGrowthAreas = computed(() => {
  return [...blendedDimensions.value]
    .sort((left, right) => left.value - right.value)
    .slice(0, 3)
    .map((item) => item.label)
})

async function submitSurvey2() {
  if (!hasAnsweredAll.value) {
    return
  }

  isSavingSurvey2.value = true

  try {
    const saved = await saveSurvey2State(route.params.sessionId, {
      completed: true,
      answers: { ...survey2Answers.value },
      completed_at: new Date().toISOString(),
    })

    survey2Answers.value = { ...saved.answers }
    isSurvey2Complete.value = saved.completed
  } catch (error) {
    toast.add({
      title: 'Could not save Survey 2',
      description: getErrorMessage(error as ApiError),
      color: 'error',
    })
  } finally {
    isSavingSurvey2.value = false
  }
}

function selectAnswer(value: number) {
  if (!activeQuestion.value) {
    return
  }

  survey2Answers.value[activeQuestion.value.id] = value
}

function goToPreviousQuestion() {
  if (currentQuestionIndex.value <= 0) {
    return
  }

  currentQuestionIndex.value -= 1
}

function goToNextQuestion() {
  if (!activeQuestion.value || !Number.isFinite(activeQuestionAnswer.value ?? NaN)) {
    return
  }

  if (currentQuestionIndex.value < survey2Questions.length - 1) {
    currentQuestionIndex.value += 1
    return
  }

  void submitSurvey2()
}

onMounted(() => {
  if (!survey2State.completed) {
    const firstUnanswered = survey2Questions.findIndex((question) => !Number.isFinite(survey2State.answers[question.id]))
    currentQuestionIndex.value = firstUnanswered === -1 ? survey2Questions.length - 1 : firstUnanswered
  }
})

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportRoadmapReport() {
  const exportDimensions = isSurvey2Complete.value ? blendedDimensions.value : evaluation.value.dimensions
  const exportStrengths = isSurvey2Complete.value ? recalculatedStrengths.value : evaluation.value.strengths
  const exportGrowthAreas = isSurvey2Complete.value ? recalculatedGrowthAreas.value : evaluation.value.growthAreas

  const lines = [
    'CompetencyX Survey 2 - PSP + SDLC Roadmap',
    `Session: ${route.params.sessionId}`,
    `Best fit role: ${result.best_fit_role?.name ?? 'N/A'}`,
    '',
    'Strengths:',
    ...exportStrengths.map((item) => `- ${item}`),
    '',
    'Growth Areas:',
    ...exportGrowthAreas.map((item) => `- ${item}`),
    '',
    'Personality Signals:',
    ...evaluation.value.personalitySignals.map((item) => `- ${item}`),
    '',
    'Dimension Scores:',
    ...exportDimensions.map((item) => `- ${item.label}: ${Math.round(item.value * 100)}%`),
  ]

  downloadFile(`survey2-roadmap-${route.params.sessionId}.txt`, lines.join('\n'), 'text/plain;charset=utf-8')
}

function exportSpiderChartSvg() {
  const svgElement = document.querySelector('#survey2-spider-chart svg')

  if (!svgElement) {
    return
  }

  const svgMarkup = new XMLSerializer().serializeToString(svgElement)
  downloadFile(`survey2-spider-${route.params.sessionId}.svg`, svgMarkup, 'image/svg+xml;charset=utf-8')
}

useSeoMeta({
  title: 'CompetencyX | Survey 2 roadmap',
  description: 'PSP and SDLC capability analysis with a personalized roadmap based on Survey 1 answers.',
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink :to="`/results/${route.params.sessionId}`" class="editorial-link text-sm">
        Back to Survey 1 results
      </NuxtLink>
      <p class="text-sm text-(--cx-ink-soft)">
        Session {{ route.params.sessionId }}
      </p>
    </div>

    <section class="glass-panel mt-6 rounded-[2.2rem] p-6 md:p-8">
      <p class="eyebrow">Survey 2</p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-(--cx-ink) md:text-6xl">
        PSP + SDLC capability roadmap
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-(--cx-ink-soft)">
        This profile uses your Survey 1 answers to estimate your current software process behavior (PSP) and SDLC stage confidence, then maps a development direction that matches your knowledge and personality signals.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          v-if="isSurvey2Complete"
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm font-semibold text-(--cx-ink) transition hover:-translate-y-0.5 hover:border-(--cx-accent)/35 hover:text-(--cx-accent)"
          @click="exportRoadmapReport"
        >
          Download roadmap report
        </button>
        <button
          v-if="isSurvey2Complete"
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm font-semibold text-(--cx-ink) transition hover:-translate-y-0.5 hover:border-(--cx-accent)/35 hover:text-(--cx-accent)"
          @click="exportSpiderChartSvg"
        >
          Download spider chart
        </button>
      </div>
    </section>

    <section v-if="!isSurvey2Complete" class="glass-panel mt-8 rounded-[2.2rem] p-6 md:p-8" aria-live="polite">
      <div class="flex flex-wrap items-center gap-3">
        <span class="eyebrow">Skill assessment</span>
        <span class="rounded-full border border-black/6 bg-white/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-(--cx-ink-soft)">
          Agreement scale
        </span>
      </div>

      <div class="mt-5 rounded-[1.7rem] border border-black/6 bg-white/58 p-5 md:p-6">
        <p class="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-(--cx-ink-soft)">
          Place each statement on the agreement scale to generate your Survey 2 profile.
        </p>
        <h2 class="font-display text-3xl leading-tight text-(--cx-ink) md:text-5xl">
          Answer before viewing your roadmap
        </h2>
        <p class="mt-4 text-sm text-(--cx-ink-soft)">
          Question {{ currentQuestionIndex + 1 }} of {{ survey2Questions.length }}
        </p>
      </div>

      <div v-if="activeQuestion" class="mt-8">
        <div
          class="rounded-[1.65rem] border border-black/6 bg-white/72 p-4 md:p-5"
        >
          <p class="text-base font-semibold leading-7 text-(--cx-ink) md:text-[1.05rem]">{{ activeQuestion.prompt }}</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-5">
            <button
              v-for="option in answerScale"
              :key="`${activeQuestion.id}-${option.value}`"
              type="button"
              class="answer-option answer-option--scale rounded-[1.25rem] px-3 py-3 text-xs font-semibold uppercase tracking-[0.04em] transition"
              :class="
                activeQuestionAnswer === option.value
                  ? 'is-selected text-(--cx-accent)'
                  : 'text-(--cx-ink-soft)'
              "
              @click="selectAnswer(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-5">
        <p class="status-copy">
          {{ hasAnsweredAll ? 'All prompts answered. Ready to evaluate.' : 'Complete every prompt to unlock results.' }}
        </p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-black/8 bg-white/80 px-5 py-3 text-sm font-semibold text-(--cx-ink) transition hover:-translate-y-0.5 hover:border-(--cx-accent)/35 hover:text-(--cx-accent) disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="currentQuestionIndex === 0"
            @click="goToPreviousQuestion"
          >
            Previous
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-(--cx-accent) px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!Number.isFinite(activeQuestionAnswer ?? NaN) || isSavingSurvey2"
            @click="goToNextQuestion"
          >
            {{ currentQuestionIndex === survey2Questions.length - 1 ? (isSavingSurvey2 ? 'Saving...' : 'Show Survey 2 results') : 'Next question' }}
          </button>
        </div>
      </div>
    </section>

    <section v-else class="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section class="paper-panel rounded-[2rem] p-6">
        <p class="eyebrow">Spider chart</p>
        <h2 class="mt-4 text-3xl font-bold text-(--cx-ink)">Current capability map</h2>
        <div id="survey2-spider-chart" class="mt-6">
          <SkillSpiderChart :dimensions="blendedDimensions" />
        </div>
      </section>

      <section class="paper-panel rounded-[2rem] p-6">
        <p class="eyebrow">Profile read</p>
        <h2 class="mt-4 text-3xl font-bold text-(--cx-ink)">Knowledge + personality fit</h2>

        <div class="mt-6 space-y-3">
          <p
            v-for="signal in evaluation.personalitySignals"
            :key="signal"
            class="rounded-[1.35rem] border border-black/6 bg-white/75 p-4 text-sm leading-6 text-(--cx-ink-soft)"
          >
            {{ signal }}
          </p>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-[1.35rem] border border-black/6 bg-white/75 p-4">
            <p class="eyebrow">Strongest now</p>
            <ul class="mt-3 space-y-2 text-sm text-(--cx-ink)">
              <li v-for="strength in recalculatedStrengths" :key="strength">{{ strength }}</li>
            </ul>
          </div>
          <div class="rounded-[1.35rem] border border-black/6 bg-white/75 p-4">
            <p class="eyebrow">Develop next</p>
            <ul class="mt-3 space-y-2 text-sm text-(--cx-ink)">
              <li v-for="gap in recalculatedGrowthAreas" :key="gap">{{ gap }}</li>
            </ul>
          </div>
        </div>
      </section>
    </section>

    <section class="mt-8 paper-panel rounded-[2rem] p-6">
      <p class="eyebrow">Roadmap actions</p>
      <h2 class="mt-4 text-3xl font-bold text-(--cx-ink)">Recommended learning sequence</h2>
      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <div
          v-for="(topic, index) in topRoadmapTopics"
          :key="topic.id"
          class="rounded-[1.35rem] border border-black/6 bg-white/75 p-4"
        >
          <p class="text-xs font-extrabold uppercase tracking-[0.08em] text-(--cx-warm)">Phase {{ index + 1 }}</p>
          <p class="mt-2 text-sm font-semibold text-(--cx-ink)">{{ topic.title }}</p>
          <p class="mt-2 text-sm leading-6 text-(--cx-ink-soft)">
            {{ topic.description || 'This topic is prioritized from your preferred-role gap profile.' }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
