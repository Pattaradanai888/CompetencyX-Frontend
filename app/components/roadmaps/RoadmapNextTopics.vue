<script setup lang="ts">
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

/**
 * The unit's name and the sentence explaining why it is suggested both come
 * from the API. A Thai session reads the Canonical Thai Wording and the Thai
 * reason; the English text is the fallback for a set with no Thai wording, not
 * the default.
 */
function topicTitle(topic: SkillAssessmentTopicEntry): string {
  return (props.isThai && topic.topic_title_th) || topic.topic_title
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

function stateBadgeClass(state: SkillAssessmentTopicEntry['state']): string {
  if (state === 'unassessed') {
    // Neutral on purpose: nobody checked this topic, so it must not read as
    // a verdict or as a gap.
    return 'border-border-subtle bg-surface-card text-ink-soft'
  }
  if (state === 'held') {
    return 'border-blueprint/20 bg-blueprint/10 text-blueprint'
  }
  return 'border-accent/16 bg-accent/8 text-accent'
}
</script>

<template>
  <section
    data-testid="next-topics"
    class="mt-10 rounded-[2rem] border border-border-subtle bg-surface-elevated/70 p-6 shadow-[0_24px_70px_rgba(74,54,35,0.08)] md:p-8"
    aria-labelledby="next-topics-title"
  >
    <div class="max-w-3xl">
      <p class="eyebrow">{{ t.nextTopicsEyebrow }}</p>
      <h2 id="next-topics-title" class="mt-4 font-display text-3xl text-ink md:text-4xl">
        {{ t.nextTopicsTitle }}
      </h2>
      <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
        {{ t.nextTopicsIntro }}
      </p>
    </div>

    <ol class="mt-6 grid gap-4">
      <li
        v-for="(topic, index) in topics"
        :id="`next-topic-${topic.topic_slug}`"
        :key="topic.topic_slug"
        data-testid="next-topic-item"
        class="paper-panel p-5 md:p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">{{ index + 1 }}</p>
            <h3 class="mt-1 text-xl font-bold text-ink">
              {{ topicTitle(topic) }}
            </h3>
          </div>
          <span
            class="shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.06em]"
            :class="stateBadgeClass(topic.state)"
          >
            {{ stateLabel(topic.state) }}
          </span>
        </div>

        <p
          v-if="topicReason(topic)"
          class="mt-3 max-w-2xl text-sm leading-6 text-ink-soft"
        >
          {{ topicReason(topic) }}
        </p>

        <div v-if="canMark && topic.state !== 'held'" class="mt-4">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="busyTopicKey === topic.topic_slug"
            @click="emit('mark', topic.topic_slug)"
          >
            {{ t.markHeld }}
          </button>
        </div>
      </li>
    </ol>

    <p
      v-if="!canMark"
      data-testid="mark-requires-account"
      class="mt-4 rounded-lg border border-blueprint/15 bg-blueprint/5 px-3 py-2 text-xs leading-6 text-blueprint/80"
    >
      {{ t.markingRequiresAccount }}
    </p>

    <ul v-if="heldEntries.length" class="mt-4 grid gap-2" data-testid="recently-marked-list">
      <li
        v-for="entry in heldEntries"
        :key="entry.topic_slug"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-card px-3 py-2"
      >
        <p class="text-xs leading-6 text-ink-soft">
          <span class="font-semibold text-ink">{{ topicTitle(entry) }}</span>
          — {{ topicStatement(entry) }}
        </p>
        <button
          type="button"
          class="rounded-lg border border-dashed border-border-subtle px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="busyTopicKey === entry.topic_slug"
          @click="emit('unmark', entry.topic_slug)"
        >
          {{ t.undoMark }}
        </button>
      </li>
    </ul>
  </section>
</template>
