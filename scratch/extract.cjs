const fs = require('fs');
const path = require('path');

const srcFile = 'app/pages/roadmaps/[sessionId].vue';
const lines = fs.readFileSync(srcFile, 'utf8').split('\n');

const templateStart = lines.findIndex(l => l.includes('<template>'));

// From manual inspection:
// Questionnaire: lines 1254-1462 (0-indexed: 1253-1461)
// Dashboard: lines 1464-2062 (0-indexed: 1463-2061)
const qTemplate = lines.slice(1253, 1462).join('\n');
const dTemplate = lines.slice(1463, 2062).join('\n');

// The original script setup
const originalScript = lines.slice(0, templateStart).join('\n');

// We will just create three files:
// 1. app/components/roadmaps/RoadmapQuestionnaire.vue
const qContent = `<script setup lang="ts">
// TO BE CLEANED UP
${originalScript.replace('<script setup lang="ts">', '')}
</script>

<template>
${qTemplate}
</template>
`;
fs.writeFileSync('app/components/roadmaps/RoadmapQuestionnaire.vue', qContent);

// 2. app/components/roadmaps/RoadmapResultDashboard.vue
const dContent = `<script setup lang="ts">
// TO BE CLEANED UP
${originalScript.replace('<script setup lang="ts">', '')}
</script>

<template>
${dTemplate}
</template>
`;
fs.writeFileSync('app/components/roadmaps/RoadmapResultDashboard.vue', dContent);

// 3. Keep the original roadmaps/[sessionId].vue for now but replace template
const pTemplate = `<template>
  <main
    id="main-content"
    :class="['page-wrap', !isRoadmapsComplete ? 'phase2-assessment-page' : '']"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink to="/" class="editorial-link text-sm">
        {{ t.backToHome }}
      </NuxtLink>
      <NuxtLink
        v-if="hasRoleAnswers"
        :to="\`/results/\${route.params.sessionId}\`"
        class="editorial-link text-sm"
      >
        {{ t.backToSurvey1 }}
      </NuxtLink>
      <p class="text-sm text-ink-soft">
        {{ t.session }} {{ route.params.sessionId }}
      </p>
    </div>

    <section v-if="isRoadmapsComplete" class="glass-panel mt-6 p-6 md:p-8">
      <p class="eyebrow">
        {{ isRoadmapsComplete ? t.finalDashboard : t.phase2Assessment }}
      </p>
      <h1 class="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
        {{
          isRoadmapsComplete
            ? \`\${survey2RoleTitle} \${t.readinessRoadmap}\`
            : t.calibrateSkills
        }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
        {{ isRoadmapsComplete ? t.completeIntro : t.incompleteIntro }}
      </p>
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span
          v-if="preferredRoleName"
          class="rounded-full border border-border-subtle bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink"
        >
          Known role: {{ preferredRoleName }}
        </span>
        <span
          v-if="bestFitRoleName"
          class="rounded-full border border-accent-soft bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-accent"
        >
          Discovery result: {{ bestFitRoleName }}
        </span>
      </div>
    </section>

    <!-- NEW EXTRACTED COMPONENTS -->
    <RoadmapQuestionnaire v-if="!isRoadmapsComplete" />
    <RoadmapResultDashboard v-else />
  </main>
</template>
`;

// we leave the script as is in parent for now, but append the new template
fs.writeFileSync('app/pages/roadmaps/[sessionId].vue', originalScript + '\n' + pTemplate);
console.log('Extraction complete!');
