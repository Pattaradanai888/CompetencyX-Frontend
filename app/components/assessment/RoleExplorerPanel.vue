<script setup lang="ts">
import { getRoleMeta } from '~/data/roleMeta'
import type { RoleExplorerMeta } from '~/data/roleMeta'
import {
  getRoleDisplayDescription,
  getRoleDisplayName,
} from '~/utils/assessment'
import type { Role, RoadmapTopic } from '~~/shared/types/assessment'

const props = defineProps<{
  rolesPending: boolean
  filteredRoles: Role[]
  preferredRoleSlug: string | null
  resultSummary: string
  t: Record<string, string>
  isThai: boolean
  topicsPending: boolean
  selectedRoleTopics: RoadmapTopic[]
  canStart: boolean
  isSubmitting: boolean
  startButtonLabel: string
}>()

const emit = defineEmits<{
  'clear-filters': []
  'select-role': [slug: string]
  start: []
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

// One metadata lookup per role per render, in the language on screen.
const metaBySlug = computed(() => {
  const locale = props.isThai ? 'th' : 'en'
  return new Map(
    props.filteredRoles.map((role) => [
      role.slug,
      getRoleMeta(role.slug, locale),
    ]),
  )
})

function metaFor(role: Role): RoleExplorerMeta {
  return metaBySlug.value.get(role.slug) ?? getRoleMeta(role.slug)
}
</script>

<template>
  <section class="role-selector-panel">
    <!-- Search bar -->
    <div class="relative block w-full">
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle
          cx="7"
          cy="7"
          r="4.5"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M10.5 10.5L14 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <input
        id="role-search"
        v-model="searchQuery"
        name="role-search"
        type="text"
        autocomplete="off"
        :placeholder="t.searchPlaceholder"
        class="w-full rounded-full border border-border-subtle bg-surface-card py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-soft/50 transition focus-visible:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
      />
    </div>

    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold text-ink-soft" aria-live="polite">
        {{ resultSummary }}
      </p>
      <button
        v-if="searchQuery.trim() !== ''"
        type="button"
        class="editorial-link text-xs font-semibold"
        @click="emit('clear-filters')"
      >
        {{ t.clearFilters }}
      </button>
    </div>

    <!-- Role List Grid with Inline Expansion for Mobile -->
    <div
      v-if="rolesPending"
      class="role-cards-grid"
      aria-busy="true"
      :aria-label="isThai ? 'กำลังโหลดตำแหน่งงาน' : 'Loading role catalog'"
    >
      <div v-for="index in 5" :key="index" class="skeleton h-20 rounded-lg" />
    </div>
    <div v-else-if="filteredRoles.length" class="role-cards-grid">
      <div
        v-for="role in filteredRoles"
        :key="role.id"
        class="role-card-container flex flex-col"
      >
        <!-- Card trigger button -->
        <button
          type="button"
          class="option-card role-card group flex w-full flex-col text-left rounded-md p-3"
          :class="
            role.slug === preferredRoleSlug
              ? 'border-accent bg-accent-soft/20 shadow-[0_16px_34px_rgba(234,112,31,0.14)]'
              : ''
          "
          :aria-label="
            isThai
              ? `เลือก ${getRoleDisplayName(role, true)}`
              : `Select ${role.name}`
          "
          :aria-pressed="role.slug === preferredRoleSlug ? 'true' : 'false'"
          @click="emit('select-role', role.slug)"
        >
          <div class="flex items-start justify-between gap-2 w-full">
            <div class="min-w-0 flex-1">
              <p class="font-bold text-ink text-sm leading-tight">
                {{ getRoleDisplayName(role, isThai) }}
              </p>
              <p
                class="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed"
              >
                {{ getRoleDisplayDescription(role, isThai) }}
              </p>
            </div>
            <span
              v-if="role.slug === preferredRoleSlug"
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-white mt-0.5"
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6.5L5 9L9.5 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>
        </button>

        <!-- Inline Mobile Details: Expanding inline on mobile -->
        <div
          v-if="role.slug === preferredRoleSlug"
          class="mobile-inline-details lg:hidden"
        >
          <div class="space-y-4">
            <div>
              <h3 class="font-display text-lg font-bold text-ink">
                {{ getRoleDisplayName(role, isThai) }}
              </h3>
              <p class="mt-1.5 text-xs text-ink-soft leading-relaxed">
                {{ getRoleDisplayDescription(role, isThai) }}
              </p>
            </div>

            <div class="role-details-section">
              <h4
                class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
              >
                {{ t.responsibilities }}
              </h4>
              <ul class="role-details-list mt-1.5">
                <li
                  v-for="resp in metaFor(role).responsibilities"
                  :key="resp"
                  class="role-details-list-item text-xs"
                >
                  {{ resp }}
                </li>
              </ul>
            </div>

            <div class="role-details-section">
              <h4
                class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
              >
                {{ t.skills }}
              </h4>
              <div class="role-details-tags mt-1.5">
                <span
                  v-for="skill in metaFor(role).skills"
                  :key="skill"
                  class="role-details-tag text-[0.7rem] px-2 py-0.5"
                >
                  {{ skill }}
                </span>
              </div>
            </div>

            <div class="role-details-section">
              <h4
                class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
              >
                {{ t.roadmapPreview }}
              </h4>
              <div
                v-if="topicsPending"
                class="role-details-loading-preview mt-1.5"
              >
                <span
                  v-for="index in 3"
                  :key="index"
                  class="skeleton h-8 rounded-md"
                />
              </div>
              <div
                v-else-if="selectedRoleTopics.length"
                class="role-details-topics mt-1.5"
              >
                <div
                  v-for="topic in selectedRoleTopics"
                  :key="topic.id"
                  class="role-details-topic-item text-xs py-1.5 px-3"
                >
                  {{ topic.title }}
                </div>
              </div>
              <p v-else class="text-xs text-ink-soft mt-1">
                {{ t.noTopics }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-2">
              <div v-if="metaFor(role).workStyle.length">
                <h5
                  class="text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft"
                >
                  {{ t.workStyle }}
                </h5>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="style in metaFor(role).workStyle"
                    :key="style"
                    class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                  >
                    {{ style }}
                  </span>
                </div>
              </div>

              <div v-if="metaFor(role).interests.length">
                <h5
                  class="text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft"
                >
                  {{ t.interests }}
                </h5>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="interest in metaFor(role).interests"
                    :key="interest"
                    class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                  >
                    {{ interest }}
                  </span>
                </div>
              </div>

              <div v-if="metaFor(role).careerAreas.length">
                <h5
                  class="text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft"
                >
                  {{ t.careerAreas }}
                </h5>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="area in metaFor(role).careerAreas"
                    :key="area"
                    class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                  >
                    {{ area }}
                  </span>
                </div>
              </div>

              <div v-if="metaFor(role).environment.length">
                <h5
                  class="text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft"
                >
                  {{ t.environment }}
                </h5>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="env in metaFor(role).environment"
                    :key="env"
                    class="bg-surface-elevated text-ink-soft text-[0.65rem] px-1.5 py-0.5 rounded border border-border-subtle"
                  >
                    {{ env }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-border-subtle/40">
              <button
                type="button"
                class="cx-button-primary w-full text-xs min-h-[2.5rem] py-2 px-4"
                :disabled="!canStart"
                @click="emit('start')"
              >
                <span
                  v-if="isSubmitting"
                  class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white"
                  aria-hidden="true"
                />
                {{ startButtonLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="rounded-md border border-border-subtle bg-surface-card p-6 text-center text-sm text-ink-soft"
      aria-live="polite"
    >
      {{ t.noRolesMatch }}
    </div>
  </section>
</template>
