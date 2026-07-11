import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const RAW_URL =
  'https://raw.githubusercontent.com/nilbuild/developer-roadmap/master/src/data/roadmaps'

const SLUG_MAP = {
  'ai-data-scientist.json': 'ai-data-scientist',
  'ai-engineer.json': 'ai-engineer',
  'android-developer.json': 'android',
  'backend.json': 'backend',
  'bi-analyst.json': 'bi-analyst',
  'data-analyst.json': 'data-analyst',
  'data-engineer.json': 'data-engineer',
  'devops-engineer.json': 'devops',
  'engineering-manager.json': 'engineering-manager',
  'frontend.json': 'frontend',
  'fullstack.json': 'full-stack',
  'game-developer.json': 'game-developer',
  'machine-learning-engineer.json': 'machine-learning',
  'mlops-engineer.json': 'mlops',
  'product-manager.json': 'product-manager',
  'qa-engineer.json': 'qa',
  'server-side-game-developer.json': 'server-side-game-developer',
  'software-architect.json': 'software-architect',
  'technical-writer.json': 'technical-writer',
}

const MISSING_SLUGS = [
  'cyber-security',
  'devsecops',
  'devrel',
  'ux-design',
  'ios',
  'blockchain',
]

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseResourceLinks(markdown) {
  const links = []
  const regex = /\[@(\w+)@([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    links.push({ type: match[1], title: match[2], url: match[3] })
  }
  if (links.length === 0) {
    const plainRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
    while ((match = plainRegex.exec(markdown)) !== null) {
      links.push({ type: 'website', title: match[1], url: match[2] })
    }
  }
  return links
}

const BACKEND_DIR =
  'D:\\Year 4\\CompetencyX-Backend\\data\\upstream\\roadmap_sh'
const OUTPUT = join(
  'D:\\Year 4\\CompetencyX-Frontend\\public\\data',
  'roadmap-resources.json',
)

async function fetch(url) {
  const res = await globalThis.fetch(url)
  if (!res.ok) return null
  return res.text()
}

async function downloadTopicResources(slug, label, nodeId) {
  const baseSlug = slugify(label)
  const fileName = `${baseSlug}@${nodeId}.md`
  const url = `${RAW_URL}/${slug}/content/${encodeURIComponent(fileName)}`
  const markdown = await fetch(url)
  if (!markdown) return null
  const links = parseResourceLinks(markdown)
  return links.length > 0 ? links : null
}

async function main() {
  const output = {}
  let totalLinks = 0

  // Process backend JSON files
  const fs = await import('fs')
  const files = fs.readdirSync(BACKEND_DIR).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    const slug = SLUG_MAP[file]
    if (!slug) continue

    const jsonPath = join(BACKEND_DIR, file)
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const topics = data.nodes.filter(
      (n) => (n.type === 'topic' || n.type === 'subtopic') && n.data?.label,
    )

    // Download in parallel batches of 10
    const roadmapOutput = {}
    let count = 0

    for (let i = 0; i < topics.length; i += 10) {
      const batch = topics.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map((t) => downloadTopicResources(slug, t.data.label, t.id)),
      )

      for (let j = 0; j < batch.length; j++) {
        const links =
          results[j].status === 'fulfilled' ? results[j].value : null
        if (links) {
          roadmapOutput[batch[j].data.label] = links
          totalLinks += links.length
          count++
        }
      }
    }

    if (count > 0) {
      output[slug] = roadmapOutput
      console.log(`  ${slug}: ${count} topics`)
    } else {
      console.log(`  ${slug}: none`)
    }
  }

  // Process missing slugs from raw GitHub
  for (const slug of MISSING_SLUGS) {
    try {
      const jsonUrl = `${RAW_URL}/${slug}/${slug}.json`
      const jsonText = await fetch(jsonUrl)
      if (!jsonText) {
        console.log(`  ${slug}: failed to fetch JSON`)
        continue
      }

      const data = JSON.parse(jsonText)
      const topics = data.nodes.filter(
        (n) => (n.type === 'topic' || n.type === 'subtopic') && n.data?.label,
      )

      const roadmapOutput = {}
      let count = 0

      for (let i = 0; i < topics.length; i += 10) {
        const batch = topics.slice(i, i + 10)
        const results = await Promise.allSettled(
          batch.map((t) => downloadTopicResources(slug, t.data.label, t.id)),
        )

        for (let j = 0; j < batch.length; j++) {
          const links =
            results[j].status === 'fulfilled' ? results[j].value : null
          if (links) {
            roadmapOutput[batch[j].data.label] = links
            totalLinks += links.length
            count++
          }
        }
      }

      if (count > 0) {
        output[slug] = roadmapOutput
        console.log(`  ${slug}: ${count} topics`)
      } else {
        console.log(`  ${slug}: none`)
      }
    } catch {
      console.log(`  ${slug}: failed`)
    }
  }

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8')
  const size = (await fs.promises.stat(OUTPUT)).size
  console.log(
    `\nDone! Total: ${Object.keys(output).length} roadmaps, ${totalLinks} resource links`,
  )
  console.log(`Saved to ${OUTPUT} (${size} bytes)`)
}

main().catch(console.error)
