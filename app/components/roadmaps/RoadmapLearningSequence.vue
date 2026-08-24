<script setup lang="ts">
import { getTopicDifficultyLabel } from '~/utils/roadmaps'
import type { ResourceLink, RoadmapTopic } from '~~/shared/types/assessment'

const props = defineProps<{
  topics: RoadmapTopic[]
  topicResources: Map<number, ResourceLink[]>
  isThai: boolean
  roleTitle?: string
  /** Topics the respondent said they can already do, kept visible as their own statement. */
  heldTopicIds?: number[]
}>()

const t = usePageI18n('roadmaps', () => props.isThai)

const heldIds = computed(() => new Set(props.heldTopicIds ?? []))

function isHeld(topic: RoadmapTopic): boolean {
  return heldIds.value.has(topic.id)
}

function difficultyLabel(topic: RoadmapTopic): string {
  return getTopicDifficultyLabel(topic.difficulty, {
    foundation: t.value.foundation,
    intermediate: t.value.intermediate,
    advanced: t.value.advanced,
    targeted: t.value.targeted,
  })
}

function getTopicTags(topic: RoadmapTopic): string[] {
  const tags: string[] = []

  if (topic.is_gap) {
    tags.push(t.value.priority)
  }
  if (topic.topic_group) {
    tags.push(topic.topic_group)
  } else if (!topic.is_gap) {
    tags.push(t.value.roadmap)
  }

  return tags
}

function getResourceTypeLabel(type: ResourceLink['type']): string {
  const labels: Record<ResourceLink['type'], string> = {
    book: t.value.labelBook,
    video: t.value.labelVideo,
    article: t.value.labelArticle,
    course: t.value.labelCourse,
    official: t.value.labelOfficial,
    website: t.value.labelWebsite,
    roadmap: t.value.labelRoadmap,
    feed: t.value.labelFeed,
  }
  return labels[type] ?? type
}

function searchUrl(topic: RoadmapTopic, engine: 'google' | 'youtube'): string {
  const q = encodeURIComponent(`${topic.title} ${props.roleTitle ?? ''} tutorial`.trim())
  if (engine === 'youtube') {
    return `https://www.youtube.com/results?search_query=${q}`
  }
  return `https://www.google.com/search?q=${q}`
}
</script>

<template>
  <section class="mt-10">
    <div
      class="rounded-[2rem] border border-border-subtle bg-surface-elevated/70 p-6 shadow-[0_24px_70px_rgba(74,54,35,0.08)] md:p-8"
    >
      <div class="max-w-3xl">
        <p class="eyebrow">{{ t.section }} 3</p>
        <h2 class="mt-4 font-display text-4xl text-ink md:text-5xl">
          {{ t.recommendedSequence }}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
          {{ t.sequenceCopy }}
        </p>
      </div>
    </div>

    <div class="mt-10 grid gap-5">
      <div v-for="(topic, index) in topics" :key="topic.id" class="relative">
        <div
          v-if="index !== topics.length - 1"
          class="absolute left-5 top-14 hidden h-[calc(100%+1.25rem)] w-px bg-[linear-gradient(180deg,rgba(234,112,31,0.28),rgba(33,122,111,0.14))] md:block"
        />
        <div
          class="absolute left-0 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-accent/20 bg-white text-sm font-bold text-accent shadow-[0_10px_24px_rgba(234,112,31,0.16)]"
        >
          {{ index + 1 }}
        </div>

        <article :id="'topic-' + topic.id" class="paper-panel ml-5 md:ml-14">
          <div class="grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
            <div class="max-w-3xl">
              <div class="flex flex-wrap items-center gap-2">
                <p class="eyebrow">{{ t.step }} {{ index + 1 }}</p>
                <span
                  class="rounded-full border border-accent/16 bg-accent/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-accent"
                >
                  {{ difficultyLabel(topic) }}
                </span>
                <span
                  v-if="isHeld(topic)"
                  class="rounded-full border border-blueprint/20 bg-blueprint/10 px-3 py-1 text-xs font-bold text-blueprint"
                >
                  {{ t.heldStatement }}
                </span>
              </div>
              <h3 class="mt-3 text-2xl font-bold text-ink">
                {{ topic.title }}
              </h3>
              <p
                v-if="topic.description"
                class="mt-3 max-w-2xl text-sm leading-7 text-ink-soft"
              >
                {{ topic.description }}
              </p>
            </div>

            <div
              class="flex flex-wrap content-start gap-2 md:max-w-56 md:justify-end"
            >
              <span
                v-for="tag in getTopicTags(topic)"
                :key="tag"
                class="rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div
            v-if="topicResources.get(topic.id)?.length"
            class="border-t border-border-subtle px-6 py-4 md:px-8"
          >
            <p
              class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
            >
              {{ t.resources }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a
                v-for="link in topicResources.get(topic.id)"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/30 hover:text-accent"
              >
                <span
                  class="shrink-0 rounded bg-surface-muted px-1 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                  >{{ getResourceTypeLabel(link.type) }}</span
                >
                <span>{{ link.title }}</span>
              </a>
            </div>
          </div>
          <div
            v-else
            class="border-t border-border-subtle px-6 py-4 md:px-8"
          >
            <p
              class="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft"
            >
              {{ t.resources }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a
                :href="searchUrl(topic, 'google')"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-subtle bg-surface-card/50 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/30 hover:text-accent"
              >
                <span class="text-nowrap">🔍 Search {{ topic.title }}</span>
              </a>
              <a
                :href="searchUrl(topic, 'youtube')"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-subtle bg-surface-card/50 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/30 hover:text-accent"
              >
                ▶ YouTube
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
