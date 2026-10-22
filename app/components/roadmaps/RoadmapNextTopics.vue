<script setup lang="ts">
import { getTopicEntryTitle } from '~/utils/roadmaps'
import type { SkillAssessmentTopicEntry } from '~~/shared/types/assessment'

const props = defineProps<{
  /** The next three to five topics, in the order the API returned them. */
  topics: SkillAssessmentTopicEntry[]
  isThai: boolean
  canMark: boolean
  busyTopicKey: string | null
  /** Everything this account says it can already do; each carries its undo. */
  heldEntries: SkillAssessmentTopicEntry[]
}>()

const emit = defineEmits<{
  mark: [topicKey: string]
  unmark: [topicKey: string]
}>()

const t = usePageI18n('roadmaps', () => props.isThai)
const route = useRoute()

function stateLabel(state: SkillAssessmentTopicEntry['state']): string {
  if (state === 'unassessed') {
    return t.value.stateUnassessed
  }
  if (state === 'held') {
    // Held units do not appear among the suggestions today; if one ever does,
    // it must read as the respondent's own statement, never as a gap.
    return t.value.heldStatement
  }
  return t.value.stateAssessedGap
}

function stateChipClass(state: SkillAssessmentTopicEntry['state']): string {
  if (state === 'unassessed') return 'state-chip--unassessed'
  if (state === 'held') return 'state-chip--held'
  return 'state-chip--gap'
}

/**
 * The unit's name and the sentence explaining why it is suggested both come
 * from the API. A Thai session reads the Canonical Thai Wording and the Thai
 * reason; the English text is the fallback for a set with no Thai wording, not
 * the default.
 */
function topicTitle(topic: SkillAssessmentTopicEntry): string {
  return getTopicEntryTitle(topic, props.isThai)
}

function topicReason(topic: SkillAssessmentTopicEntry): string | undefined {
  return (props.isThai && topic.reason_th) || topic.reason
}

function topicStatement(topic: SkillAssessmentTopicEntry): string {
  return (
    (props.isThai && topic.statement_th) ||
    topic.statement ||
    t.value.heldStatement
  )
}
</script>

<template>
  <section
    data-testid="next-topics"
    class="roadmap-section"
    aria-labelledby="next-topics-title"
  >
    <h2 id="next-topics-title" class="roadmap-section__title">
      {{ t.nextTopicsTitle }}
    </h2>
    <p class="roadmap-section__intro">{{ t.nextTopicsIntro }}</p>

    <ol v-if="topics.length" class="spine mt-6">
      <li
        v-for="(topic, index) in topics"
        :id="`next-topic-${topic.topic_slug}`"
        :key="topic.topic_slug"
        data-testid="next-topic-item"
        class="spine-item"
      >
        <span
          class="spine-node"
          :class="
            topic.state === 'held' ? 'spine-node--held' : 'spine-node--priority'
          "
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>
        <article class="surface topic-card">
          <div
            class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2"
          >
            <h3 class="topic-card__title min-w-0">{{ topicTitle(topic) }}</h3>
            <span class="state-chip" :class="stateChipClass(topic.state)">
              {{ stateLabel(topic.state) }}
            </span>
          </div>
          <p v-if="topicReason(topic)" class="mt-2 leading-7 text-ink-soft">
            {{ topicReason(topic) }}
          </p>
          <button
            v-if="canMark && topic.state !== 'held'"
            type="button"
            class="cx-button-secondary cx-button-small mt-4"
            :disabled="busyTopicKey === topic.topic_slug"
            @click="emit('mark', topic.topic_slug)"
          >
            {{ t.markHeld }}
          </button>
        </article>
      </li>
    </ol>
    <p v-else class="surface mt-6 p-5 text-ink-soft">
      {{ t.nextTopicsEmpty }}
    </p>

    <p
      v-if="!canMark"
      data-testid="mark-requires-account"
      class="mt-5 text-sm text-ink-soft"
    >
      {{ t.markingRequiresAccount }}
      <NuxtLink
        :to="{ path: '/account/sign-in', query: { next: route.fullPath } }"
        class="editorial-link"
      >
        {{ t.signInToMark }}
      </NuxtLink>
    </p>

    <div v-if="heldEntries.length" class="mt-8">
      <h3 class="text-lg font-bold text-ink">{{ t.heldTitle }}</h3>
      <ul class="mt-3 grid gap-2" data-testid="recently-marked-list">
        <li
          v-for="entry in heldEntries"
          :key="entry.topic_slug"
          class="surface flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <span
            class="spine-node spine-node--held spine-node--sm shrink-0"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7.5L5.75 10L11 4"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <p class="min-w-0 flex-1 text-sm leading-6 text-ink-soft">
            <span class="font-bold text-ink">{{ topicTitle(entry) }}</span>
            — {{ topicStatement(entry) }}
          </p>
          <button
            type="button"
            class="editorial-link min-h-10 text-sm"
            :disabled="busyTopicKey === entry.topic_slug"
            @click="emit('unmark', entry.topic_slug)"
          >
            {{ t.undoMark }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
