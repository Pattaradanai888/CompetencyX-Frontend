const fs = require('fs');

const logPath = 'C:\\Users\\jj101\\.gemini\\antigravity-cli\\brain\\888b52f3-26b4-4b19-9e68-bb1a235ca202\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
let maxLen = 0;
let bestObj = null;

for(const line of lines) {
  if(!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes('<script setup lang="ts">') && obj.content.includes('const autoAdvanceTimer = ref<NodeJS.Timeout>')) {
      if (obj.content.length > maxLen) {
        maxLen = obj.content.length;
        bestObj = obj;
      }
    }
  } catch(e) {}
}

if (bestObj) {
  const content = bestObj.content;
  const startIdx = content.lastIndexOf('<script setup lang="ts">');
  if(startIdx !== -1) {
    fs.writeFileSync('scratch/recovered_roadmap.vue', content.substring(startIdx));
    console.log('Recovered! size:', content.length - startIdx);
  }
}
