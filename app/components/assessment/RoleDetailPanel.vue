<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import { getRoleDisplayDescription } from '~/utils/assessment'
import type { Role, RoadmapTopic, ApiError } from '~~/shared/types/assessment'
import type { RoleExplorerMeta } from '~/data/roleMeta'

defineProps<{
  selectedRole: Role | null
  selectedRoleName: string
  selectedMeta: RoleExplorerMeta
  topicsPending: boolean
  selectedRoleTopics: RoadmapTopic[]
  isSubmitting: boolean
  canStart: boolean
  startButtonLabel: string
  pageError: ApiError | null
  t: Record<string, string>
  isThai: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
}>()
</script>

<template>
  <aside
    class="role-details-panel hidden lg:block"
    aria-labelledby="selected-role-title"
  >
    <!-- Header -->
    <div class="role-details-header">
      <p class="eyebrow">{{ t.selectedRole }}</p>
      <h2 id="selected-role-title" class="role-details-header__title">
        {{ selectedRoleName }}
      </h2>
    </div>

    <!-- Scrollable Body content -->
    <div class="role-details-body">
      <p class="text-base leading-relaxed text-ink-soft/90">
        {{
          selectedRole
            ? getRoleDisplayDescription(selectedRole, isThai)
            : t.choosePrompt
        }}
      </p>

      <div v-if="selectedRole" class="space-y-6">
        <!-- 1. Responsibilities (Always Visible) -->
        <div class="role-details-section">
          <h3 class="role-details-section__title">
            {{ t.responsibilities }}
          </h3>
          <ul class="role-details-list">
            <li
              v-for="responsibility in selectedMeta.responsibilities"
              :key="responsibility"
              class="role-details-list-item"
            >
              {{ responsibility }}
            </li>
          </ul>
        </div>

        <!-- 2. Required Skills (Always Visible) -->
        <div class="role-details-section">
          <h3 class="role-details-section__title">
            {{ t.skills }}
          </h3>
          <div class="role-details-tags">
            <span
              v-for="skill in selectedMeta.skills"
              :key="skill"
              class="role-details-tag"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- 3. Roadmap Preview / Recommended Competencies (Always Visible) -->
        <div class="role-details-section">
          <h3 class="role-details-section__title">
            {{ t.roadmapPreview }}
          </h3>
          <div
            v-if="topicsPending"
            aria-live="polite"
            role="status"
            class="role-details-loading-preview"
          >
            <span
              v-for="index in 3"
              :key="index"
              class="skeleton h-11 rounded-md"
            />
          </div>
          <div
            v-else-if="selectedRoleTopics.length"
            class="role-details-topics"
          >
            <div
              v-for="topic in selectedRoleTopics"
              :key="topic.id"
              class="role-details-topic-item"
            >
              {{ topic.title }}
            </div>
          </div>
          <p v-else class="text-sm text-ink-soft">{{ t.noTopics }}</p>
        </div>

        <!-- 5. Additional Metadata Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div
            v-if="selectedMeta.workStyle && selectedMeta.workStyle.length"
            class="role-details-section mb-0"
          >
            <h4
              class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
            >
              {{ t.workStyle }}
            </h4>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="style in selectedMeta.workStyle"
                :key="style"
                class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
              >
                {{ style }}
              </span>
            </div>
          </div>

          <div
            v-if="selectedMeta.interests && selectedMeta.interests.length"
            class="role-details-section mb-0"
          >
            <h4
              class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
            >
              {{ t.interests }}
            </h4>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="interest in selectedMeta.interests"
                :key="interest"
                class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
              >
                {{ interest }}
              </span>
            </div>
          </div>

          <div
            v-if="selectedMeta.careerAreas && selectedMeta.careerAreas.length"
            class="role-details-section mb-0"
          >
            <h4
              class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
            >
              {{ t.careerAreas }}
            </h4>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="area in selectedMeta.careerAreas"
                :key="area"
                class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
              >
                {{ area }}
              </span>
            </div>
          </div>

          <div
            v-if="selectedMeta.environment && selectedMeta.environment.length"
            class="role-details-section mb-0"
          >
            <h4
              class="text-[0.65rem] font-bold uppercase tracking-wider text-ink"
            >
              {{ t.environment }}
            </h4>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="env in selectedMeta.environment"
                :key="env"
                class="bg-surface-elevated text-ink-soft text-[0.7rem] px-2 py-0.5 rounded border border-border-subtle"
              >
                {{ env }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="role-details-footer">
      <div
        v-if="pageError"
        aria-live="polite"
        role="alert"
        class="cx-error-panel mb-4 p-4 text-sm"
      >
        {{ getErrorMessage(pageError) }}
        {{
          isThai
            ? 'โปรดพยายามเริ่มต้นใหม่อีกครั้ง'
            : 'Please try starting again.'
        }}
      </div>

      <button
        type="button"
        class="cx-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!canStart"
        @click="emit('start')"
      >
        <span
          v-if="isSubmitting"
          class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          aria-hidden="true"
        />
        {{ startButtonLabel }}
      </button>
      <p
        v-if="isSubmitting"
        aria-live="polite"
        role="status"
        class="mt-2 text-center text-xs text-ink-soft"
      >
        {{ t.settingUpQuestion }}
      </p>
    </div>
  </aside>
</template>
