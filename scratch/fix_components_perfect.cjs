const fs = require('fs')

const original = fs.readFileSync('scratch/original_roadmap.vue', 'utf8')

const scriptStart = original.indexOf('<script setup lang="ts">')
const scriptEnd = original.indexOf('</script>') + 9
const originalScript = original.substring(scriptStart, scriptEnd)

const tStart = originalScript.indexOf('const t = computed(() => {')
const hasRoleAnswersStart = originalScript.indexOf(
  'const hasRoleAnswers = computed(() => {',
)

const beforeT = originalScript.substring(0, tStart)
const afterT = originalScript.substring(hasRoleAnswersStart)

const questionnaireScript = `${beforeT}const t = usePageI18n('questionnaire', isThai)\n\n${afterT}`
const dashboardScript = `${beforeT}const t = usePageI18n('dashboard', isThai)\n\n${afterT}`

const qFile = 'app/components/roadmaps/RoadmapQuestionnaire.vue'
if (fs.existsSync(qFile)) {
  const content = fs.readFileSync(qFile, 'utf8')
  const qScriptStart = content.indexOf('<script setup lang="ts">')
  const qScriptEnd = content.indexOf('</script>') + 9
  const newContent =
    content.substring(0, qScriptStart) +
    questionnaireScript +
    content.substring(qScriptEnd)
  fs.writeFileSync(qFile, newContent)
  console.log('Fixed RoadmapQuestionnaire.vue')
}

const dFile = 'app/components/roadmaps/RoadmapResultDashboard.vue'
if (fs.existsSync(dFile)) {
  const content = fs.readFileSync(dFile, 'utf8')
  const dScriptStart = content.indexOf('<script setup lang="ts">')
  const dScriptEnd = content.indexOf('</script>') + 9
  const newContent =
    content.substring(0, dScriptStart) +
    dashboardScript +
    content.substring(dScriptEnd)
  fs.writeFileSync(dFile, newContent)
  console.log('Fixed RoadmapResultDashboard.vue')
}
