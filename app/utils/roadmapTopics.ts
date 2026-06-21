import type { RoadmapTopic } from '~~/shared/types/assessment'

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

async function fetchRoadmapData(roadmapSlug: string): Promise<RoadmapShData | null> {
  if (cache.has(roadmapSlug)) {
    return cache.get(roadmapSlug)!
  }

  try {
    const url = `${RAW_URL}/${roadmapSlug}/${roadmapSlug}.json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data: RoadmapShData = await res.json()
    cache.set(roadmapSlug, data)
    return data
  } catch {
    return null
  }
}

function extractTopicLabels(data: RoadmapShData): string[] {
  const contentTypes = new Set(['topic', 'subtopic'])

  const topicNodes = data.nodes.filter(
    (n) => contentTypes.has(n.type) && n.data?.label,
  )

  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  const nodeMap = new Map<string, RoadmapShNode>()

  for (const node of topicNodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
    nodeMap.set(node.id, node)
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

  const seen = new Set<string>()
  return ordered
    .map((id) => {
      const label = nodeMap.get(id)?.data?.label
      return label ?? ''
    })
    .filter((label): label is string => !!label && !seen.has(label) && seen.add(label) as unknown as boolean)
}

export async function getRoadmapTopics(
  roleSlug: string | null | undefined,
): Promise<RoadmapTopic[]> {
  if (!roleSlug) return []

  const roadmapSlug = ROADMAP_SLUG_MAP[roleSlug] ?? roleSlug
  const data = await fetchRoadmapData(roadmapSlug)
  if (!data) return []

  const labels = extractTopicLabels(data)
  return labels.slice(0, 6).map((label, index) => ({
    id: -(index + 30),
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: label,
    description: undefined,
    difficulty: 0,
    display_order: index,
    parent_id: null,
    prerequisites: [],
  }))
}

export function getRoadmapSlug(roleSlug: string): string {
  return ROADMAP_SLUG_MAP[roleSlug] ?? roleSlug
}
