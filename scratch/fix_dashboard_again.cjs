const fs = require('fs')
const dashboard = fs.readFileSync(
  'app/components/roadmaps/RoadmapResultDashboard.vue',
  'utf8',
)

// I know that everything between </script> and <!-- Left column: cards --> is messed up.
const scriptEnd = dashboard.indexOf('</script>') + '</script>'.length
const leftColumnStart = dashboard.indexOf('<div class="grid gap-5">') // where left column cards start

const headerHTML = `
<template>
  <section class="result-spotlight mt-10 overflow-hidden p-5 md:p-10">
    <div
      class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-4 py-2 text-sm font-bold text-accent"
    >
      <span aria-hidden="true">✓</span>
      {{ t.assessmentComplete }}
    </div>

    <h2
      class="mt-6 max-w-4xl font-display text-4xl leading-tight text-ink md:text-6xl"
    >
      {{ survey2RoleTitle }} {{ t.readinessOrganized }}
    </h2>
    <p class="mt-5 max-w-2xl text-sm leading-8 text-ink-soft md:text-base">
      {{ t.viewIntro }}
    </p>

    <div class="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
      <!-- Left column: cards -->
      `

const newContent =
  dashboard.substring(0, scriptEnd) +
  '\n' +
  headerHTML +
  dashboard.substring(leftColumnStart)
fs.writeFileSync(
  'app/components/roadmaps/RoadmapResultDashboard.vue',
  newContent,
)

// And we need to add the closing tags at the end of the file.
let endContent = fs.readFileSync(
  'app/components/roadmaps/RoadmapResultDashboard.vue',
  'utf8',
)
if (!endContent.endsWith('</section>\n</template>\n')) {
  endContent += '    </div>\n  </section>\n</template>\n'
  fs.writeFileSync(
    'app/components/roadmaps/RoadmapResultDashboard.vue',
    endContent,
  )
}

console.log('Fixed!')
