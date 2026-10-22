<script setup lang="ts">
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

interface TopicGroup {
  name: string | null
  entries: { topic: RoadmapTopic; step: number }[]
}

/** Consecutive topics that share a group read under one heading, in learning order. */
const groups = computed<TopicGroup[]>(() => {
  const result: TopicGroup[] = []
  props.topics.forEach((topic, index) => {
    const name = topic.topic_group ?? null
    const last = result.at(-1)
    const entry = { topic, step: index + 1 }
    if (last && last.name === name) {
      last.entries.push(entry)
    } else {
      result.push({ name, entries: [entry] })
    }
  })
  return result
})

function isHeld(topic: RoadmapTopic): boolean {
  return heldIds.value.has(topic.id)
}

function nodeClass(topic: RoadmapTopic): string {
  if (isHeld(topic)) return 'spine-node--held'
  if (topic.is_gap) return 'spine-node--priority'
  return ''
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
  const q = encodeURIComponent(
    `${topic.title} ${props.roleTitle ?? ''} tutorial`.trim(),
  )
  if (engine === 'youtube') {
    return `https://www.youtube.com/results?search_query=${q}`
  }
  return `https://www.google.com/search?q=${q}`
}
</script>

<template>
  <section class="roadmap-section" aria-labelledby="full-roadmap-title">
    <h2 id="full-roadmap-title" class="roadmap-section__title">
      {{ t.fullRoadmapTitle }}
    </h2>
    <p class="roadmap-section__intro">{{ t.fullRoadmapIntro }}</p>

    <div class="spine-groups mt-6">
      <div v-for="(group, groupIndex) in groups" :key="groupIndex">
        <h3 v-if="group.name" class="spine-group">{{ group.name }}</h3>
        <ol class="spine spine--compact">
          <li
            v-for="{ topic, step } in group.entries"
            :id="'topic-' + topic.id"
            :key="topic.id"
            data-testid="roadmap-topic"
            class="spine-item roadmap-topic-card"
          >
            <span
              class="spine-node"
              :class="nodeClass(topic)"
              aria-hidden="true"
            >
              <svg
                v-if="isHeld(topic)"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M3 7.5L5.75 10L11 4"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <template v-else>{{ step }}</template>
            </span>

            <details class="roadmap-row min-w-0">
              <summary class="roadmap-row__summary">
                <h4
                  class="roadmap-row__title"
                  data-testid="roadmap-topic-title"
                >
                  {{ topic.title }}
                </h4>
                <span
                  v-if="isHeld(topic) || topic.is_gap"
                  class="roadmap-row__chips"
                >
                  <span
                    v-if="isHeld(topic)"
                    class="state-chip state-chip--held"
                  >
                    {{ t.heldStatement }}
                  </span>
                  <span v-else class="state-chip state-chip--gap">
                    {{ t.priority }}
                  </span>
                </span>
                <svg
                  class="roadmap-row__chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 5L7 9L11 5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </summary>

              <div class="roadmap-row__body">
                <p
                  v-if="topic.prerequisite_titles?.length"
                  class="text-sm leading-6 text-ink-soft"
                >
                  {{ t.buildsOn }} {{ topic.prerequisite_titles.join(', ') }}
                </p>
                <p class="mt-3 text-sm font-bold text-ink">
                  {{ t.resources }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <template v-if="topicResources.get(topic.id)?.length">
                    <a
                      v-for="link in topicResources.get(topic.id)"
                      :key="link.url"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="resource-link"
                    >
                      <span class="resource-link__type">
                        {{ getResourceTypeLabel(link.type) }}
                      </span>
                      <span>{{ link.title }}</span>
                    </a>
                  </template>
                  <template v-else>
                    <a
                      :href="searchUrl(topic, 'google')"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="resource-link"
                    >
                      {{ t.searchWeb }}
                    </a>
                    <a
                      :href="searchUrl(topic, 'youtube')"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="resource-link"
                    >
                      {{ t.watchOnYouTube }}
                    </a>
                  </template>
                </div>
              </div>
            </details>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
