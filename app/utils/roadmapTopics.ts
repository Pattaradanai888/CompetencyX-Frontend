import type { ResourceLink, RoadmapTopic } from '~~/shared/types/assessment'

const ROADMAP_SLUG_MAP: Record<string, string> = {
  'frontend-developer': 'frontend',
  'backend-developer': 'backend',
  'full-stack-developer': 'full-stack',
  'devops-engineer': 'devops',
  'devsecops-engineer': 'devsecops',
  'data-analyst': 'data-analyst',
  'ai-engineer': 'ai-engineer',
  'ai-data-scientist': 'ai-data-scientist',
  'data-engineer': 'data-engineer',
  'android-developer': 'android',
  'machine-learning-engineer': 'machine-learning',
  'postgresql-developer-dba': 'backend',
  'ios-developer': 'ios',
  'blockchain-developer': 'blockchain',
  'qa-engineer': 'qa',
  'software-architect': 'software-architect',
  'cyber-security-engineer-analyst': 'cyber-security',
  'ux-designer': 'ux-design',
  'technical-writer': 'technical-writer',
  'game-developer': 'game-developer',
  'server-side-game-developer': 'server-side-game-developer',
  'mlops-engineer': 'mlops',
  'product-manager': 'product-manager',
  'engineering-manager': 'engineering-manager',
  'developer-relations': 'devrel',
  'bi-analyst': 'bi-analyst',
}

const RAW_URL =
  'https://raw.githubusercontent.com/nilbuild/developer-roadmap/master/src/data/roadmaps'

interface RoadmapShNode {
  id: string
  type: string
  data: { label: string }
  position: { x: number; y: number }
}

interface RoadmapShEdge {
  source: string
  target: string
}

interface RoadmapShData {
  nodes: RoadmapShNode[]
  edges: RoadmapShEdge[]
}

const cache = new Map<string, RoadmapShData>()

async function fetchRoadmapData(
  roadmapSlug: string,
): Promise<RoadmapShData | null> {
  if (cache.has(roadmapSlug)) {
    return cache.get(roadmapSlug)!
  }

  const urls = [
    `${RAW_URL}/${roadmapSlug}/${roadmapSlug}.json`,
    `https://cdn.jsdelivr.net/gh/nilbuild/developer-roadmap@master/src/data/roadmaps/${roadmapSlug}/${roadmapSlug}.json`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data: RoadmapShData = await res.json()
        cache.set(roadmapSlug, data)
        return data
      }
    } catch {
      continue
    }
  }

  console.debug(`[roadmapTopics] all fetch attempts failed for ${roadmapSlug}`)
  return null
}

function buildLabelMap(data: RoadmapShData): Map<string, string> {
  const map = new Map<string, string>()
  for (const node of data.nodes) {
    if (node.data?.label) {
      map.set(node.id, node.data.label)
    }
  }
  return map
}

function buildSectionMap(data: RoadmapShData): Map<string, string> {
  const contentTypes = new Set(['topic', 'subtopic'])
  const sorted = [...data.nodes].sort((a, b) => a.position.y - b.position.y)
  const sectionMap = new Map<string, string>()
  let currentSection = ''
  for (const node of sorted) {
    if (node.type === 'title' && node.data?.label) {
      currentSection = node.data.label
    } else if (node.type === 'section' && node.data?.label) {
      currentSection = node.data.label
    } else if (contentTypes.has(node.type)) {
      sectionMap.set(node.id, currentSection)
    }
  }
  return sectionMap
}

function buildPrerequisiteMap(
  data: RoadmapShData,
  labelMap: Map<string, string>,
): Map<string, string[]> {
  const prereqMap = new Map<string, string[]>()
  for (const edge of data.edges) {
    if (labelMap.has(edge.target) && labelMap.has(edge.source)) {
      if (!prereqMap.has(edge.target)) {
        prereqMap.set(edge.target, [])
      }
      prereqMap.get(edge.target)!.push(edge.source)
    }
  }
  return prereqMap
}

function buildFollowOnMap(
  data: RoadmapShData,
  labelMap: Map<string, string>,
): Map<string, string[]> {
  const followOnMap = new Map<string, string[]>()
  for (const edge of data.edges) {
    if (labelMap.has(edge.source) && labelMap.has(edge.target)) {
      if (!followOnMap.has(edge.source)) {
        followOnMap.set(edge.source, [])
      }
      followOnMap.get(edge.source)!.push(edge.target)
    }
  }
  return followOnMap
}

function buildSubtopicMap(
  data: RoadmapShData,
  labelMap: Map<string, string>,
): Map<string, string[]> {
  const subtopicMap = new Map<string, string[]>()
  const subtopicNodeIds = new Set(
    data.nodes.filter((n) => n.type === 'subtopic').map((n) => n.id),
  )

  for (const edge of data.edges) {
    if (
      subtopicNodeIds.has(edge.target) &&
      !subtopicNodeIds.has(edge.source) &&
      labelMap.has(edge.source) &&
      labelMap.has(edge.target)
    ) {
      if (!subtopicMap.has(edge.source)) {
        subtopicMap.set(edge.source, [])
      }
      subtopicMap.get(edge.source)!.push(edge.target)
    }
  }
  return subtopicMap
}

function topologicalSort(data: RoadmapShData): string[] {
  const contentTypes = new Set(['topic', 'subtopic'])

  const topicNodes = data.nodes.filter(
    (n) => contentTypes.has(n.type) && n.data?.label,
  )

  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const node of topicNodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  }

  for (const edge of data.edges) {
    if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
      adjacency.get(edge.source)!.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    }
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const ordered: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    ordered.push(id)
    for (const neighbor of adjacency.get(id) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  if (ordered.length < topicNodes.length) {
    const visited = new Set(ordered)
    const remaining = topicNodes
      .filter((n) => !visited.has(n.id))
      .sort((a, b) => a.position.y - b.position.y)
    for (const node of remaining) {
      ordered.push(node.id)
    }
  }

  return ordered
}

function buildLabelToNodeId(data: RoadmapShData): Map<string, string> {
  const map = new Map<string, string>()
  for (const node of data.nodes) {
    if (
      node.data?.label &&
      (node.type === 'topic' || node.type === 'subtopic')
    ) {
      map.set(node.data.label, node.id)
    }
  }
  return map
}

export async function getRoadmapTopics(
  roleSlug: string | null | undefined,
): Promise<RoadmapTopic[]> {
  if (!roleSlug) return []

  const roadmapSlug = ROADMAP_SLUG_MAP[roleSlug] ?? roleSlug
  const data = await fetchRoadmapData(roadmapSlug)
  if (!data) {
    setTimeout(() => preloadFileList(roadmapSlug), 0)
    return []
  }

  const nodeIdMap = buildLabelToNodeId(data)
  for (const [label, id] of nodeIdMap) {
    labelToNodeId.set(label, id)
  }

  const labelMap = buildLabelMap(data)
  const sectionMap = buildSectionMap(data)
  const prereqMap = buildPrerequisiteMap(data, labelMap)
  const followOnMap = buildFollowOnMap(data, labelMap)
  const subtopicMap = buildSubtopicMap(data, labelMap)

  const ordered = topologicalSort(data)

  const seen = new Set<string>()
  const result: RoadmapTopic[] = []
  let index = 0

  for (const id of ordered) {
    const label = labelMap.get(id)
    if (!label || seen.has(label)) continue
    seen.add(label)

    const prereqIds = prereqMap.get(id) ?? []
    const prereqTitles = prereqIds
      .map((pid) => labelMap.get(pid))
      .filter((t): t is string => !!t)

    const followOnIds = followOnMap.get(id) ?? []
    const followOnTitles = followOnIds
      .map((pid) => labelMap.get(pid))
      .filter((t): t is string => !!t)

    const subIds = subtopicMap.get(id) ?? []
    const subTitles = subIds
      .map((pid) => labelMap.get(pid))
      .filter((t): t is string => !!t)

    result.push({
      id: -(index + 30),
      slug: label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      title: label,
      description: undefined,
      difficulty: 0,
      display_order: index,
      parent_id: null,
      prerequisites: [],
      topic_group: sectionMap.get(id) || undefined,
      prerequisite_titles: prereqTitles.length ? prereqTitles : undefined,
      subtopic_titles: subTitles.length ? subTitles : undefined,
      follow_on_titles: followOnTitles.length ? followOnTitles : undefined,
    })
    index++
  }

  setTimeout(() => preloadFileList(roadmapSlug), 0)

  return result.slice(0, 15)
}

function preloadFileList(roadmapSlug: string) {
  if (fileListCache.has(roadmapSlug)) return
  fetchFileList(roadmapSlug)
}

async function fetchFileList(roadmapSlug: string): Promise<string[]> {
  try {
    const url = `https://api.github.com/repos/nilbuild/developer-roadmap/contents/src/data/roadmaps/${roadmapSlug}/content`
    const res = await fetch(url)
    if (!res.ok) return []
    const data: { name: string }[] = await res.json()
    const names = data.map((f) => f.name)
    fileListCache.set(roadmapSlug, names)
    return names
  } catch {
    return []
  }
}

export function getRoadmapSlug(roleSlug: string): string {
  return ROADMAP_SLUG_MAP[roleSlug] ?? roleSlug
}

const contentCache = new Map<string, ResourceLink[]>()
const labelToNodeId = new Map<string, string>()
const fileListCache = new Map<string, string[] | null>()

async function discoverContentFile(
  roadmapSlug: string,
  topicLabel: string,
): Promise<string | null> {
  const baseSlug = topicLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const nodeId = labelToNodeId.get(topicLabel)
  if (nodeId) {
    return `${baseSlug}@${nodeId}.md`
  }

  if (!fileListCache.has(roadmapSlug)) {
    await fetchFileList(roadmapSlug)
  }

  const cached = fileListCache.get(roadmapSlug)
  if (cached) {
    const match = cached.find((f) => f.startsWith(baseSlug))
    if (match) return match
  }

  return null
}

let resourcesJson: Record<string, Record<string, ResourceLink[]>> | null = null

async function loadResourcesJson() {
  if (resourcesJson) return resourcesJson
  try {
    const res = await fetch('/data/roadmap-resources.json')
    if (res.ok) {
      resourcesJson = await res.json()
    }
  } catch {
    // silent
  }
  return resourcesJson
}

export async function fetchTopicResources(
  roadmapSlug: string,
  topicLabel: string,
): Promise<ResourceLink[]> {
  const cacheKey = `${roadmapSlug}:${topicLabel}`
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!
  }

  // Method 1: try fetching content file from GitHub raw (with CDN fallback)
  const fileName = await discoverContentFile(roadmapSlug, topicLabel)
  if (fileName) {
    const contentUrls = [
      `${RAW_URL}/${roadmapSlug}/content/${encodeURIComponent(fileName)}`,
      `https://cdn.jsdelivr.net/gh/nilbuild/developer-roadmap@master/src/data/roadmaps/${roadmapSlug}/content/${encodeURIComponent(fileName)}`,
    ]

    for (const url of contentUrls) {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const markdown = await res.text()
          const links = parseResourceLinks(markdown)
          if (links.length) {
            contentCache.set(cacheKey, links)
            return links
          }
        }
      } catch {
        continue
      }
    }
  }

  // Method 2: fall back to static bundled resources JSON
  const json = await loadResourcesJson()
  const links = json?.[roadmapSlug]?.[topicLabel]
  if (links?.length) {
    contentCache.set(cacheKey, links)
    return links
  }

  return []
}

function parseResourceLinks(markdown: string): ResourceLink[] {
  const links: ResourceLink[] = []
  const linkRegex = /\[@(\w+)@([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(markdown)) !== null) {
    const type = match[1] as ResourceLink['type']
    const title = match[2] || ''
    const url = match[3] || ''
    if (title && url) {
      links.push({ type, title, url })
    }
  }
  return links
}
