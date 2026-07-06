const fs = require('fs')

const fixComponent = (filePath, key) => {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} not found, skipping.`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')

  // We need to find the start of the t block and the start of hasRoleAnswers
  const tStart = content.indexOf('const t = computed(() => {')
  const hasRoleAnswersStart = content.indexOf(
    'const hasRoleAnswers = computed(() => {',
  )

  if (
    tStart !== -1 &&
    hasRoleAnswersStart !== -1 &&
    hasRoleAnswersStart > tStart
  ) {
    // The t block ends exactly before hasRoleAnswersStart. We'll leave one newline.
    const beforeT = content.substring(0, tStart)
    const afterT = content.substring(hasRoleAnswersStart)

    const newContent = `${beforeT}const t = usePageI18n('${key}', isThai)\n\n${afterT}`
    fs.writeFileSync(filePath, newContent)
    console.log(`Fixed ${filePath}`)
  } else {
    console.log(`Could not find markers in ${filePath}`)
  }
}

// Also we need to restore the files from scratch/original_roadmap.vue first!
// Wait! RoadmapQuestionnaire and RoadmapResultDashboard have DIFFERENT templates!
// We can't just overwrite them with original_roadmap.vue!
// But they have the EXACT SAME corrupted script block!
// Wait, my previous replace script already corrupted them.
// So the start of `const t` is now `const t = usePageI18n(...)`!
// And everything after it until `growthDimensionCards` (or whatever) was deleted!
