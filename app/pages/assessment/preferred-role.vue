<script setup lang="ts">
import { getErrorMessage } from '~/utils/api'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import type { ApiError, AssessmentSession } from '~~/shared/types/assessment'

const { createSession, getSession, isSubmitting, lastSessionId } =
  useAssessmentSession()
const { currentLanguage, isThai } = useLocale()
const toast = useToast()
const pageError = ref<ApiError | null>(null)
const lastSessionSnapshot = ref<AssessmentSession | null>(null)

const PREFERRED_ROLE_KEY = 'competencyx:preferred-role'

const t = computed(() => {
  if (isThai.value) {
    return {
      backLink: 'ย้อนกลับไปหน้าภาพรวม',
      resumeBtn: 'กลับไปทำเซสชันล่าสุด',
      eyebrow: 'เริ่มต้น',
      title: 'คุณมีตำแหน่งอาชีพที่ต้องการอยู่ในใจแล้วหรือยัง?',
      description:
        'เลือกเส้นทางที่ตรงกับสถานการณ์ของคุณตอนนี้ เพื่อให้ CompetencyX เริ่มด้วยคำถามที่เหมาะสมที่สุด',
      yesTitle: 'ใช่ ฉันมีตำแหน่งที่ต้องการแล้ว',
      yesCopy:
        'ไปที่หน้าตัวเลือกบทบาท เลือกตำแหน่งเป้าหมาย แล้วเข้าสู่การประเมินทักษะเฉพาะทาง',
      noTitle: 'ไม่ ฉันอยากให้ระบบช่วยค้นหา',
      noCopy:
        'เริ่มจากแบบสำรวจความชอบและสไตล์การทำงาน เพื่อให้ระบบแนะนำบทบาทที่เหมาะสม',
      yesAction: 'เลือกตำแหน่ง',
      noAction: 'เริ่มแบบสำรวจหน้าแรก',
      preparing: 'กำลังเตรียมแบบสำรวจ...',
      footer: 'คุณสามารถเริ่มใหม่ได้ภายหลัง การเลือกนี้มีผลเฉพาะเซสชันปัจจุบัน',
      errorTitle: 'ไม่สามารถเริ่มแบบสำรวจได้',
    }
  }

  return {
    backLink: 'Back to overview',
    resumeBtn: 'Resume previous session',
    eyebrow: 'Onboarding',
    title: 'Do you already have a preferred career role in mind?',
    description:
      'Choose the path that matches where you are now, so CompetencyX can start with the right first step.',
    yesTitle: 'Yes, I already have a preferred role',
    yesCopy:
      'Open role selection, choose your target path, then continue into role-specific skill calibration.',
    noTitle: "No, I'd like the system to help me discover one",
    noCopy:
      'Start with preference and work-style questions so the system can recommend your best-fit role.',
    yesAction: 'Choose a role',
    noAction: 'Start survey page 1',
    preparing: 'Preparing survey...',
    footer:
      'You can restart later. This choice only affects the current onboarding session.',
    errorTitle: 'Could not start survey',
  }
})

async function chooseKnownRole() {
  await navigateTo('/assessment/start')
}

async function chooseDiscovery() {
  if (isSubmitting.value) {
    return
  }

  pageError.value = null

  if (import.meta.client) {
    localStorage.removeItem(PREFERRED_ROLE_KEY)
  }

  try {
    const session = await createSession({
      language: currentLanguage.value,
    })

    await navigateTo(`/assessment/${session.id}`)
  } catch (error) {
    pageError.value = error as ApiError
    toast.add({
      title: t.value.errorTitle,
      description: getErrorMessage(error as ApiError) ?? undefined,
      color: 'error',
    })
  }
}

const isSurvey2Complete = computed(() => {
  const profile = lastSessionSnapshot.value?.profile
  if (!profile) return false
  const survey2 = (profile as Record<string, unknown>).survey2
  return (
    typeof survey2 === 'object' &&
    survey2 !== null &&
    (survey2 as Record<string, unknown>).completed === true
  )
})

const lastSessionRoute = computed(() => {
  if (!lastSessionId.value) return null
  const snap = lastSessionSnapshot.value
  if (!snap) return `/assessment/${lastSessionId.value}`

  if (isSurvey2Complete.value || snap.preferred_role)
    return `/roadmaps/${lastSessionId.value}`

  if (snap.status === 'completed')
    return `/results/${lastSessionId.value}`

  return `/assessment/${lastSessionId.value}`
})

const resumeLabel = computed(() => {
  if (!lastSessionSnapshot.value) return t.value.resumeBtn
  if (isSurvey2Complete.value) {
    return isThai.value
      ? 'ดูผลลัพธ์เซสชันล่าสุด'
      : 'View last session result'
  }
  if (lastSessionSnapshot.value.status === 'completed') {
    return isThai.value ? 'ดูผลการประเมินล่าสุด' : 'View last evaluation'
  }
  return t.value.resumeBtn
})

onMounted(async () => {
  if (!lastSessionId.value) return
  try {
    lastSessionSnapshot.value = await getSession(lastSessionId.value)
  } catch {
    lastSessionSnapshot.value = null
  }
})

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | คำถามเริ่มต้น'
      : 'CompetencyX | Preferred role question',
  ),
  description: computed(() =>
    isThai.value
      ? 'เลือกว่าคุณมีตำแหน่งงานเป้าหมายแล้วหรือยัง เพื่อเริ่มกระบวนการประเมินที่เหมาะสม'
      : 'Choose whether you already have a preferred role before starting the assessment flow.',
  ),
})
</script>

<template>
  <main id="main-content" class="page-wrap">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/" class="editorial-link text-sm">
        {{ t.backLink }}
      </NuxtLink>
      <NuxtLink
        v-if="lastSessionId"
        :to="lastSessionRoute ?? `/assessment/${lastSessionId}`"
        class="inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
      >
        {{ resumeLabel }}
      </NuxtLink>
    </div>

    <section
      class="onboarding-choice-shell mx-auto mt-8 max-w-5xl"
      aria-labelledby="preferred-role-title"
    >
      <div class="text-center">
        <p class="eyebrow">{{ t.eyebrow }}</p>
        <h1
          id="preferred-role-title"
          class="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl"
        >
          {{ t.title }}
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">
          {{ t.description }}
        </p>
      </div>

      <div class="mt-10 grid gap-4 md:grid-cols-2" role="group">
        <button
          type="button"
          class="preferred-role-option"
          @click="chooseKnownRole"
        >
          <span class="preferred-role-option__marker" aria-hidden="true">
            01
          </span>
          <span class="preferred-role-option__body">
            <span class="preferred-role-option__title">
              {{ t.yesTitle }}
            </span>
            <span class="preferred-role-option__copy">
              {{ t.yesCopy }}
            </span>
            <span class="preferred-role-option__action">
              {{ t.yesAction }}
              <span aria-hidden="true">→</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          class="preferred-role-option preferred-role-option--accent"
          :disabled="isSubmitting"
          @click="chooseDiscovery"
        >
          <span class="preferred-role-option__marker" aria-hidden="true">
            02
          </span>
          <span class="preferred-role-option__body">
            <span class="preferred-role-option__title">
              {{ t.noTitle }}
            </span>
            <span class="preferred-role-option__copy">
              {{ t.noCopy }}
            </span>
            <span class="preferred-role-option__action">
              <span
                v-if="isSubmitting"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
                aria-hidden="true"
              />
              {{ isSubmitting ? t.preparing : t.noAction }}
              <span v-if="!isSubmitting" aria-hidden="true">→</span>
            </span>
          </span>
        </button>
      </div>

      <p
        class="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-ink-soft"
      >
        {{ t.footer }}
      </p>

      <p
        v-if="pageError"
        aria-live="polite"
        role="alert"
        class="cx-error-panel mx-auto mt-6 max-w-2xl p-4 text-sm"
      >
        {{ getErrorMessage(pageError) }}
      </p>
    </section>
  </main>
</template>
