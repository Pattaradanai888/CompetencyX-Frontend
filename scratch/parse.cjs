const fs = require('fs');

const vueFile = fs.readFileSync('app/pages/roadmaps/[sessionId].vue', 'utf8');
const lines = vueFile.split('\n');

const templateStart = lines.findIndex(l => l.includes('<template>'));

const imports = lines.slice(0, 24);
const apiSetup = lines.slice(24, 356); // the core fetching logic
const scriptLogic = lines.slice(356, templateStart - 1); // lines 356 to 1201

// Manually verify template bounds
const qStart = lines.findIndex(l => l.includes('<section') && l.includes('v-if="!isRoadmapsComplete"'));
const qEnd = lines.findIndex(l => l.includes('</section>') && l > qStart && lines[l-1].includes('</section>'));
const dashStart = lines.findIndex(l => l.includes('<template v-if="isRoadmapsComplete">'));
const dashEnd = lines.findIndex(l => l.includes('</template>') && l > dashStart && l > qEnd);

console.log(`qStart: ${qStart}, qEnd: ${qEnd}`);
console.log(`dashStart: ${dashStart}, dashEnd: ${dashEnd}`);
