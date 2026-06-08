<script setup lang="ts">
import { motion } from 'motion-v'
import RoleCard from '~/components/catalog/RoleCard.vue'
import { useCatalogApi } from '~/composables/useCatalogApi'
import { useAssessmentSession } from '~/composables/useAssessmentSession'
import { useLocale } from '~/composables/useLocale'
import type { AssessmentSession, Role } from '~~/shared/types/assessment'

const { listRoles } = useCatalogApi()
const { getSession, lastSessionId } = useAssessmentSession()
const { currentLanguage, selectLanguage, isThai } = useLocale()
const prefersReduced = useReducedMotion()
const lastSessionSnapshot = ref<AssessmentSession | null>(null)

const { data: roles, error } = await useAsyncData('catalog-roles', listRoles, {
  default: () => [] as Role[],
})

const featuredRoles = computed(() => {
  try {
    return Array.isArray(roles.value) ? roles.value.slice(0, 3) : []
  } catch (e) {
    console.error('Error in featuredRoles', e)
    return []
  }
})

const lastSessionRoute = computed(() => {
  if (!lastSessionId.value) {
    return null
  }
  if (lastSessionSnapshot.value?.status === 'completed') {
    return `/results/${lastSessionId.value}`
  }
  return `/assessment/${lastSessionId.value}`
})

const t = computed(() => {
  if (isThai.value) {
    return {
      heroEyebrow: 'ค้นพบเส้นทางซอฟต์แวร์ของคุณ',
      heroTitle: 'ค้นหาตำแหน่งงานที่ใช่ ',
      heroTitleAccent: 'ในสไตล์ที่เป็นคุณ',
      heroSub:
        'CompetencyX ช่วยให้นักศึกษาค้นพบตัวตนและวัดระดับทักษะเชิงเทคนิค เพื่อสร้างแผนการเรียนรู้ที่ชัดเจนและตอบโจทย์จริง',
      startBtn: 'เริ่มการค้นหา',
      resumeLabel:
        lastSessionSnapshot.value?.status === 'completed'
          ? 'ดูผลการประเมินล่าสุด'
          : 'ทำเซสชันล่าสุดต่อ',
      heroFooter: 'ออกแบบมาเพื่อนักศึกษาที่กำลังมองหา 11+ เส้นทางซอฟต์แวร์',
      livePreview: 'ตัวอย่างเส้นทางสายอาชีพ',
      previewFormula: 'ค้นพบตัวตน + วัดระดับทักษะ = แผนพัฒนาอาชีพ',
      adaptive: 'ปรับตามผู้ใช้',
      howItWorks: 'วิธีการทำงาน',
      twoAssessments: 'สองขั้นตอนการประเมิน เพื่อทิศทางที่นำไปใช้ได้จริง',
      howItWorksSub:
        'เฟส 1 ช่วยค้นหาบทบาทที่เหมาะกับความชอบของคุณ เฟส 2 จะประเมินทักษะที่จำเป็นสำหรับบทบาทนั้นเพื่อสร้างแผนการเรียนรู้ที่ลงตัว',
      whyStudents: 'ทำไมต้องใช้ CompetencyX',
      lessGuessing: 'ลดการคาดเดา เพิ่มความมั่นใจด้วยข้อมูลจริง',
      roleFamiliesTitle: 'ภาพรวมตำแหน่งงานซอฟต์แวร์',
      roleFamiliesSub:
        'แต่ละตำแหน่งเน้นการแก้ปัญหาและทักษะที่ต่างกัน เลือกเส้นทางที่ตรงกับวิธีคิดและการลงมือทำของคุณ',
      processTitle: 'กระบวนการประเมิน',
      processSub: 'เปลี่ยนความไม่แน่ใจ เป็นแผนที่สู่เป้าหมาย',
      rolePreviewTitle: 'พรีวิวตำแหน่งงาน',
      rolePreviewSub: 'พรีวิวเส้นทางที่คุณสามารถวัดระดับทักษะได้',
      openOnboarding: 'เปิดหน้าเริ่มต้น',
      faqTitle: 'คำถามที่พบบ่อย',
      faqSub: 'ทำความเข้าใจก่อนเริ่ม',
      faqIntro: 'คำถามที่พบบ่อยก่อนเริ่มเข้าสู่กระบวนการประเมิน',
      footerSub: 'การค้นหาตัวตนและแผนพัฒนาทักษะสำหรับนักศึกษาซอฟต์แวร์',
      beginAssessment: 'เริ่มทำแบบประเมิน',
      startNow: 'เริ่มเลย',
      langLabel: 'ภาษา',
      processSteps: [
        {
          eyebrow: 'เฟส 1',
          title: 'ค้นหาตัวตน',
          copy: 'คำถามเกี่ยวกับบุคลิกภาพ สไตล์การทำงาน และความชอบ เพื่อช่วยระบุบทบาทงานที่เข้ากับธรรมชาติการแก้ปัญหาของคุณ',
        },
        {
          eyebrow: 'จุดตัดสินใจ',
          title: 'เลือกหรือยืนยันเส้นทาง',
          copy: 'หากมีตำแหน่งในใจอยู่แล้ว สามารถข้ามการค้นหาและเข้าสู่การประเมินทักษะเชิงลึกได้ทันที',
        },
        {
          eyebrow: 'เฟส 2',
          title: 'วัดระดับความสามารถ',
          copy: 'ชุดคำถามทางเทคนิคที่ออกแบบตามบทบาท เพื่อระบุระดับปัจจุบัน ความมั่นใจ และช่องว่างที่ควรพัฒนา',
        },
        {
          eyebrow: 'ผลลัพธ์',
          title: 'แดชบอร์ดแผนพัฒนา',
          copy: 'สรุปผลเป็นแผนการเรียนรู้ที่เน้นจุดสำคัญ พร้อมหัวข้อถัดไป โปรเจกต์แนะนำ และสัญญาณความพร้อม',
        },
      ],
      studentBenefits: [
        'เปลี่ยนความสนใจที่คลุมเครือให้เป็นทิศทางอาชีพที่ชัดเจน',
        'แยกแยะความเข้ากันของบุคลิกภาพออกจากความพร้อมทางเทคนิคปัจจุบัน',
        'ให้ลำดับการเรียนรู้ที่นำไปใช้ได้จริง แทนที่จะเป็นแค่รายชื่อวิชาทั่วไป',
        'ลดความกดดันด้วยการประเมินที่ให้คุณตัดสินใจทีละขั้นตอน',
      ],
      roleFamilies: [
        {
          name: 'Frontend',
          icon: '🎨',
          description: 'หน้าบ้าน, React, ระบบที่รองรับทุกหน้าจอ',
          details:
            'เหมาะสำหรับผู้ที่ชอบประสบการณ์ผู้ใช้ ความสวยงาม และการเปลี่ยนไอเดียผลิตภัณฑ์ให้เป็นหน้าเว็บที่โต้ตอบได้',
        },
        {
          name: 'Backend',
          icon: '⚙️',
          description: 'APIs, ฐานข้อมูล, ระบบความปลอดภัย',
          details:
            'เน้นตรรกะของบริการ ความน่าเชื่อถือของข้อมูล และโครงสร้างฝั่งเซิร์ฟเวอร์ที่ขับเคลื่อนแอปพลิเคชัน',
        },
        {
          name: 'Full Stack',
          icon: '🥞',
          description: 'วิศวกรรมผลิตภัณฑ์แบบครบวงจร',
          details:
            'รักษาสมดุลระหว่างงานหน้าบ้านและหลังบ้าน เพื่อส่งมอบฟีเจอร์ที่สมบูรณ์แบบในทุกเลเยอร์',
        },
        {
          name: 'Mobile',
          icon: '📱',
          description: 'iOS, Android, แอปพลิเคชันข้ามแพลตฟอร์ม',
          details:
            'เหมาะสำหรับการสร้างประสบการณ์บนแอป โดยเน้นประสิทธิภาพ ความสามารถของอุปกรณ์ และ UX แบบสัมผัส',
        },
        {
          name: 'DevOps',
          icon: '☁️',
          description: 'การปรับใช้งาน, อัตโนมัติ, ความน่าเชื่อถือ',
          details:
            'เน้นที่ CI/CD, โครงสร้างพื้นฐาน, การสังเกตการณ์ และการส่งมอบซอฟต์แวร์ที่เสถียรในสภาพแวดล้อมจริง',
        },
        {
          name: 'Data',
          icon: '📊',
          description: 'การจัดการข้อมูล, การวิเคราะห์, แมชชีนเลิร์นนิง',
          details:
            'สำหรับผู้ที่ชอบเปลี่ยนข้อมูลดิบให้เป็นตัวชี้วัด แบบจำลอง และการตัดสินใจทางธุรกิจที่ชัดเจน',
        },
        {
          name: 'QA',
          icon: '🛡️',
          description: 'กลยุทธ์คุณภาพและระบบทดสอบอัตโนมัติ',
          details:
            'เน้นการป้องกันข้อผิดพลาด การออกแบบการทดสอบ ระบบอัตโนมัติ และความมั่นใจก่อนส่งมอบงาน',
        },
        {
          name: 'Product',
          icon: '📦',
          description: 'การค้นหาฟีเจอร์, การจัดลำดับความสำคัญ',
          details:
            'สำหรับการประสานงานคุณค่าของผู้ใช้ การตัดสินใจขอบเขตงาน และผลลัพธ์ที่ปรับปรุงอย่างต่อเนื่อง',
        },
      ],
      timeline: [
        {
          title: 'เริ่มเส้นทาง',
          copy: 'เลือกตำแหน่งที่รู้แล้วหรือเริ่มค้นหาแบบเปิด',
          icon: '◎',
        },
        {
          title: 'แบบประเมิน 1',
          copy: 'ตอบคำถามเกี่ยวกับความชอบและสไตล์ส่วนตัว',
          icon: '◉',
        },
        {
          title: 'จับคู่บทบาท',
          copy: 'ทบทวนตำแหน่งงานหลักและทางเลือกที่แนะนำ',
          icon: '◈',
        },
        {
          title: 'แบบประเมิน 2',
          copy: 'วัดระดับความสามารถตามบทบาทงานที่เลือก',
          icon: '◍',
        },
        {
          title: 'แผนพัฒนา',
          copy: 'รับแผนการพัฒนาที่เน้นการปฏิบัติและก้าวถัดไป',
          icon: '◆',
        },
      ],
      faqs: [
        {
          icon: '⏭️',
          question: 'ฉันสามารถข้ามการประเมินบุคลิกภาพได้หรือไม่?',
          answer:
            'ได้ หากคุณมีตำแหน่งที่ต้องการอยู่แล้ว สามารถเลือกตำแหน่งนั้นในขั้นตอนเริ่มต้นและเข้าสู่เส้นทางการวัดทักษะได้โดยตรง',
        },
        {
          icon: '🎯',
          question: 'เหมาะสำหรับมือใหม่เท่านั้นหรือไม่?',
          answer:
            'ไม่ ระบบนี้ออกแบบมาสำหรับทั้งผู้ที่กำลังค้นหาตัวเองและผู้ที่มีประสบการณ์แล้วแต่ต้องการแผนการพัฒนาที่ชัดเจนขึ้น',
        },
        {
          icon: '🗺️',
          question: 'จะได้อะไรเมื่อทำเสร็จสิ้น?',
          answer:
            'คุณจะได้รับการวิเคราะห์ความเหมาะสม แผนภูมิสรุปทักษะ หัวข้อที่ต้องเสริม และแผนการพัฒนาที่เปลี่ยนผลลัพธ์เป็นขั้นตอนปฏิบัติ',
        },
        {
          icon: '🔁',
          question: 'สามารถทำแบบประเมินซ้ำได้หรือไม่?',
          answer:
            'ได้ คุณสามารถเริ่มทำใหม่ได้เมื่อทักษะของคุณพัฒนาขึ้น เพื่อเปรียบเทียบแผนพัฒนาปัจจุบันกับผลลัพธ์ในอดีต',
        },
        {
          icon: '🧾',
          question: 'ผลลัพธ์นี้จะมาแทนที่พอร์ตโฟลิโอหรือไม่?',
          answer:
            'ไม่ใช่ แต่จะช่วยส่งเสริมพอร์ตโฟลิโอของคุณ โดยช่วยจัดลำดับความสำคัญว่าควรสร้างอะไรต่อและปิดช่องว่างทักษะใดก่อน',
        },
      ],
    }
  }

  return {
    heroEyebrow: 'Discover your software path',
    heroTitle: 'Find the software role that ',
    heroTitleAccent: 'fits how you think',
    heroSub:
      'CompetencyX guides students through role discovery and technical skill calibration, then turns the result into a clear learning roadmap.',
    startBtn: 'Start discovery',
    resumeLabel:
      lastSessionSnapshot.value?.status === 'completed'
        ? 'View last evaluation'
        : 'Resume last session',
    heroFooter: 'Built for students choosing from 11+ software paths',
    livePreview: 'Live pathway preview',
    previewFormula: 'Discovery signal + skill signal = career roadmap',
    adaptive: 'Adaptive',
    howItWorks: 'How it works',
    twoAssessments: 'Two assessments, one usable direction.',
    howItWorksSub:
      'Phase 1 helps students discover the role shape that fits their preferences. Phase 2 checks the technical skills needed for that role and produces a practical learning plan.',
    whyStudents: 'Why students use it',
    lessGuessing: 'Less guessing. More evidence.',
    roleFamiliesTitle: 'Software roles overview',
    roleFamiliesSub:
      'Each role path focuses on different problem types, workflows, and technical depth. Pick the one that aligns with how you prefer to think and build.',
    processTitle: 'Assessment process',
    processSub: 'From uncertainty to roadmap.',
    rolePreviewTitle: 'Role preview',
    rolePreviewSub: 'Preview the paths you can calibrate against.',
    openOnboarding: 'Open onboarding',
    faqTitle: 'FAQ',
    faqSub: 'Clear before you begin.',
    faqIntro: 'Common questions before starting the assessment flow.',
    footerSub: 'Career discovery and skill roadmaps for software students.',
    beginAssessment: 'Begin assessment',
    startNow: 'Start now',
    langLabel: 'Language',
    processSteps: [
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
    ],
    studentBenefits: [
      'Turns vague interest into a concrete role direction',
      'Separates personality fit from current technical readiness',
      'Gives a practical learning sequence instead of a generic course list',
      'Keeps the assessment low-pressure with one decision at a time',
    ],
    roleFamilies: [
      {
        name: 'Frontend',
        icon: '🎨',
        description: 'Interfaces, React, responsive systems',
        details:
          'Best for students who enjoy user experience, visual polish, and turning product ideas into interactive pages.',
      },
      {
        name: 'Backend',
        icon: '⚙️',
        description: 'APIs, databases, authentication',
        details:
          'Focused on service logic, data reliability, and the server-side foundations that power applications.',
      },
      {
        name: 'Full Stack',
        icon: '🥞',
        description: 'End-to-end product engineering',
        details:
          'Balances frontend and backend responsibilities for complete feature delivery across the stack.',
      },
      {
        name: 'Mobile',
        icon: '📱',
        description: 'iOS, Android, cross-platform apps',
        details:
          'Ideal for building app-first experiences with performance, device capabilities, and touch UX in mind.',
      },
      {
        name: 'DevOps',
        icon: '☁️',
        description: 'Deployment, automation, reliability',
        details:
          'Centers on CI/CD, infrastructure, observability, and stable software delivery in production.',
      },
      {
        name: 'Data',
        icon: '📊',
        description: 'Pipelines, analytics, machine learning',
        details:
          'For students who like transforming raw data into clear metrics, models, and business decisions.',
      },
      {
        name: 'QA',
        icon: '🛡️',
        description: 'Quality strategy and test automation',
        details:
          'Emphasizes defect prevention, test design, automation, and confidence before release.',
      },
      {
        name: 'Product',
        icon: '📦',
        description: 'Discovery, prioritization, delivery',
        details:
          'For coordinating user value, scope decisions, and iterative outcomes across cross-functional teams.',
      },
    ],
    timeline: [
      {
        title: 'Start path',
        copy: 'Choose known role or open discovery',
        icon: '◎',
      },
      {
        title: 'Survey 1',
        copy: 'Answer preference and personality prompts',
        icon: '◉',
      },
      {
        title: 'Role match',
        copy: 'Review primary role and alternatives',
        icon: '◈',
      },
      {
        title: 'Survey 2',
        copy: 'Complete role-aware skill assessment',
        icon: '◍',
      },
      {
        title: 'Roadmap',
        copy: 'Get project-ready action plan and next steps',
        icon: '◆',
      },
    ],
    faqs: [
      {
        icon: '⏭️',
        question: 'Can I skip the personality assessment?',
        answer:
          'Yes. If you already know your preferred role, select it during onboarding and continue directly into the skill-focused path.',
      },
      {
        icon: '🎯',
        question: 'Is this only for beginners?',
        answer:
          'No. The flow works for students who are exploring roles and for students who already have experience but need a clearer roadmap.',
      },
      {
        icon: '🗺️',
        question: 'What do I get at the end?',
        answer:
          'You get a role-fit read, skill breakdown, gap topics, and a roadmap that turns the result into concrete next steps.',
      },
      {
        icon: '🔁',
        question: 'Can I retake the assessment later?',
        answer:
          'Yes. You can restart the flow as your skills evolve and compare your newer roadmap against previous results.',
      },
      {
        icon: '🧾',
        question: 'Will this replace my portfolio?',
        answer:
          'No. It complements your portfolio by helping you prioritize what to build next and which skill gaps to close first.',
      },
    ],
  }
})

useSeoMeta({
  title: computed(() =>
    isThai.value
      ? 'CompetencyX | การประเมินแผนผังที่ปรับเปลี่ยนตามความเหมาะสม'
      : 'CompetencyX | Adaptive roadmap assessment',
  ),
  description: computed(() =>
    isThai.value
      ? 'เริ่มการประเมินความสามารถที่ปรับเปลี่ยนได้ และรับแผนผังบทบาทที่ปรับให้เหมาะกับจุดแข็ง ช่องว่าง และขั้นตอนการเรียนรู้ถัดไปของคุณ'
      : 'Start an adaptive competency assessment and get a role roadmap tailored to your strengths, gaps, and next learning step.',
  ),
})

onMounted(async () => {
  if (!lastSessionId.value) {
    return
  }

  try {
    lastSessionSnapshot.value = await getSession(lastSessionId.value)
  } catch {
    lastSessionSnapshot.value = null
  }
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
        <!-- Language Switcher -->
        <div class="mb-8 flex flex-col items-center gap-2">
          <span
            class="text-[9px] font-extrabold uppercase tracking-[0.18em] text-ink-soft"
          >
            {{ t.langLabel }}
          </span>
          <div
            class="relative flex items-center rounded-full border border-border-subtle bg-surface-elevated/40 p-1 shadow-sm transition hover:border-ink/12"
          >
            <button
              type="button"
              class="relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.05em] transition-all duration-300"
              :class="
                currentLanguage === 'en'
                  ? 'bg-accent text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-muted/50'
              "
              @click="selectLanguage('en')"
            >
              <span>🇺🇸</span>
              <span>English</span>
            </button>
            <button
              type="button"
              class="relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.05em] transition-all duration-300"
              :class="
                currentLanguage === 'th'
                  ? 'bg-accent text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-muted/50'
              "
              @click="selectLanguage('th')"
            >
              <span>🇹🇭</span>
              <span>ไทย</span>
            </button>
          </div>
        </div>

        <div
          class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
        >
          <span aria-hidden="true">✦</span>
          {{ t.heroEyebrow }}
        </div>
        <h1
          class="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl lg:text-6xl"
        >
          {{ t.heroTitle }}
          <span class="text-accent">{{ t.heroTitleAccent }}</span>
        </h1>
        <p
          class="mx-auto mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg"
        >
          {{ t.heroSub }}
        </p>

        <div
          class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <NuxtLink to="/assessment/start" class="cx-button-primary">
            {{ t.startBtn }}
          </NuxtLink>
          <NuxtLink
            v-if="lastSessionId && lastSessionRoute"
            :to="lastSessionRoute"
            class="cx-button-secondary"
          >
            {{ t.resumeLabel }}
          </NuxtLink>
        </div>

        <p class="mt-8 text-sm text-ink-soft">
          {{ t.heroFooter }}
          <span class="font-bold text-ink"
            >11+ {{ isThai ? 'เส้นทางซอฟต์แวร์' : 'software paths' }}</span
          >
          {{
            isThai
              ? 'ด้วยการตัดสินใจที่เรียบง่ายและไม่กดดัน'
              : 'with one low-pressure decision at a time.'
          }}
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
            class="rounded-lg border border-border-subtle bg-surface-elevated/95 p-4 shadow-sm backdrop-blur md:p-6"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="eyebrow">{{ t.livePreview }}</p>
                <p
                  class="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl"
                >
                  {{ t.previewFormula }}
                </p>
              </div>
              <span
                class="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
              >
                {{ t.adaptive }}
              </span>
            </div>

            <div class="mt-6 grid gap-3 md:grid-cols-4">
              <div
                v-for="(step, index) in t.processSteps"
                :key="step.title"
                class="rounded-lg border border-border-subtle bg-surface-card p-4"
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
          {{
            isThai
              ? 'ไม่สามารถพรีวิวตำแหน่งงานได้ในขณะนี้ แต่คุณยังสามารถเริ่มทำแบบประเมินได้'
              : 'Role previews are unavailable right now. You can still begin the assessment.'
          }}
        </p>
      </motion.div>
    </motion.section>

    <section id="how-it-works" class="section-band py-16">
      <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p class="eyebrow">{{ t.howItWorks }}</p>
          <h2
            class="mt-3 max-w-xl text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            {{ t.twoAssessments }}
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
            {{ t.howItWorksSub }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <motion.article
            v-for="(step, index) in t.processSteps"
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
          <p class="eyebrow">{{ t.whyStudents }}</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            {{ t.lessGuessing }}
          </h2>
          <div class="mt-8 grid gap-3">
            <div
              v-for="benefit in t.studentBenefits"
              :key="benefit"
              class="metric-card flex items-start gap-3 p-4"
            >
              <span
                class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent text-xs font-black text-white"
                aria-hidden="true"
              >
                ?
              </span>
              <p class="text-sm font-semibold leading-6 text-ink">
                {{ benefit }}
              </p>
            </div>
          </div>
        </div>

        <div class="paper-panel p-6">
          <p class="eyebrow">{{ t.roleFamiliesTitle }}</p>
          <p class="mt-2 text-sm leading-7 text-ink-soft">
            {{ t.roleFamiliesSub }}
          </p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div
              v-for="(role, index) in t.roleFamilies"
              :key="role.name"
              class="rounded-md border border-border-subtle bg-surface-card p-4"
            >
              <div class="flex items-center gap-2">
                <span class="text-base" aria-hidden="true">{{
                  role.icon
                }}</span>
                <p class="font-extrabold text-ink">{{ role.name }}</p>
              </div>
              <p class="mt-2 text-sm leading-6 text-ink-soft">
                {{ role.description }}
              </p>
              <p class="mt-2 text-xs leading-6 text-ink-soft/90">
                {{ role.details }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-band py-16">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">{{ t.processTitle }}</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            {{ t.processSub }}
          </h2>
        </div>
        <NuxtLink to="/assessment/start" class="cx-button-primary">
          {{ t.startNow }}
        </NuxtLink>
      </div>

      <ol class="mt-8 grid gap-3 lg:grid-cols-5">
        <li
          v-for="(item, index) in t.timeline"
          :key="item.title"
          class="flow-node relative min-h-44 p-4 pl-5"
        >
          <span
            v-if="index < t.timeline.length - 1"
            class="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-accent/60 lg:inline"
            aria-hidden="true"
            >→</span
          >
          <div class="flex items-center justify-between gap-3">
            <p class="data-value text-sm font-black text-accent">
              0{{ index + 1 }}
            </p>
            <span class="text-lg font-black text-accent" aria-hidden="true">
              {{ item.icon }}
            </span>
          </div>
          <p class="mt-4 text-base font-extrabold leading-6 text-ink">
            {{ item.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-ink-soft">
            {{ item.copy }}
          </p>
        </li>
      </ol>
    </section>

    <section class="mt-16">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="eyebrow">{{ t.rolePreviewTitle }}</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            {{ t.rolePreviewSub }}
          </h2>
        </div>
        <NuxtLink
          to="/assessment/start"
          class="cx-button-primary hidden text-sm sm:inline-flex"
        >
          {{ t.openOnboarding }}
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
          <p class="eyebrow">{{ t.faqTitle }}</p>
          <h2
            class="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl"
          >
            {{ t.faqSub }}
          </h2>
        </div>
        <div class="grid gap-3">
          <p class="text-sm leading-7 text-ink-soft">
            {{ t.faqIntro }}
          </p>
          <details
            v-for="item in t.faqs"
            :key="item.question"
            class="metric-card group p-5"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-ink"
            >
              <span class="flex items-center gap-2">
                <span aria-hidden="true">{{ item.icon }}</span>
                <span>{{ item.question }}</span>
              </span>
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-ink-soft transition group-open:rotate-180"
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 5L7 9L11 5"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
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
            {{ t.footerSub }}
          </p>
        </div>
        <NuxtLink to="/assessment/start" class="cx-button-secondary">
          {{ t.beginAssessment }}
        </NuxtLink>
      </div>
    </footer>
  </main>
</template>

