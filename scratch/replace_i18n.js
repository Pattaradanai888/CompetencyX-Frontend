import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = [
  { key: 'index', path: 'app/pages/index.vue' },
  { key: 'start', path: 'app/pages/assessment/start.vue' },
  { key: 'preferredRole', path: 'app/pages/assessment/preferred-role.vue' },
  { key: 'results', path: 'app/pages/results/[sessionId].vue' },
  { key: 'roadmaps', path: 'app/pages/roadmaps/[sessionId].vue' },
  { key: 'questionnaire', path: 'app/components/roadmaps/RoadmapQuestionnaire.vue' },
  { key: 'dashboard', path: 'app/components/roadmaps/RoadmapResultDashboard.vue' },
];

for (const p of pages) {
  let content = fs.readFileSync(path.resolve(__dirname, '..', p.path), 'utf8');
  
  const tStart = content.indexOf('const t = computed(() => {');
  if (tStart === -1) continue;
  
  const enRetStart = content.lastIndexOf('return {', content.indexOf('})', tStart));
  let enRetEnd = -1;
  let braceCount = 0;
  for (let i = enRetStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        enRetEnd = i;
        break;
      }
    }
  }
  
  // The block ends with "})"
  const tEnd = content.indexOf('})', enRetEnd) + 2;
  
  const block = content.substring(tStart, tEnd);
  content = content.replace(block, `const t = usePageI18n('${p.key}', isThai)`);
  
  // Make sure usePageI18n is imported
  if (!content.includes('usePageI18n')) {
    content = content.replace('<script setup lang="ts">\n', `<script setup lang="ts">\nimport { usePageI18n } from '~/composables/usePageI18n'\n`);
  }
  
  // For index, start, preferredRole: replace t.resumeLabel with resumeLabel
  content = content.replace(/t\.resumeLabel/g, 'resumeLabel');
  
  fs.writeFileSync(path.resolve(__dirname, '..', p.path), content);
}
console.log('Replacements done.');
