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

let enOut = 'export default {\n';
let thOut = 'export default {\n';

for (const p of pages) {
  const content = fs.readFileSync(path.resolve(__dirname, '..', p.path), 'utf8');
  
  const tStart = content.indexOf('const t = computed(() => {');
  if (tStart === -1) {
    continue;
  }
  
  const thStart = content.indexOf('if (isThai.value) {', tStart);
  const thRetStart = content.indexOf('return {', thStart);
  
  let thRetEnd = -1;
  let braceCount = 0;
  let inString = false;
  let strChar = '';
  for (let i = thRetStart; i < content.length; i++) {
    const char = content[i];
    if ((char === "'" || char === '"' || char === '`') && content[i-1] !== '\\') {
      if (!inString) { inString = true; strChar = char; }
      else if (strChar === char) { inString = false; }
    }
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          thRetEnd = i;
          break;
        }
      }
    }
  }
  
  let thBody = content.substring(thRetStart + 7, thRetEnd + 1); 
  
  const enRetStart = content.indexOf('return {', thRetEnd);
  braceCount = 0;
  inString = false;
  strChar = '';
  let enRetEnd = -1;
  for (let i = enRetStart; i < content.length; i++) {
    const char = content[i];
    if ((char === "'" || char === '"' || char === '`') && content[i-1] !== '\\') {
      if (!inString) { inString = true; strChar = char; }
      else if (strChar === char) { inString = false; }
    }
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          enRetEnd = i;
          break;
        }
      }
    }
  }
  
  let enBody = content.substring(enRetStart + 7, enRetEnd + 1);
  
  // STRIP DYNAMIC STRINGS!
  enBody = enBody.replace(/resumeLabel: resumeLabel\.value,/g, '');
  thBody = thBody.replace(/resumeLabel: resumeLabel\.value,/g, '');
  
  enOut += `  ${p.key}: ${enBody},\n`;
  thOut += `  ${p.key}: ${thBody},\n`;
}

enOut += '}\n';
thOut += '}\n';

fs.writeFileSync(path.resolve(__dirname, '../app/i18n/en.ts'), enOut);
fs.writeFileSync(path.resolve(__dirname, '../app/i18n/th.ts'), thOut);
console.log('Extraction done.');
