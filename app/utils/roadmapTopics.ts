import type { ResourceLink } from '~~/shared/types/assessment'

/**
 * Maps our role slugs onto roadmap.sh slugs.
 *
 * The roadmap graph itself is no longer fetched here: the backend imports it as
 * master data and serves it from `GET /api/v1/catalog/roles/{slug}/roadmap/`.
 * This map survives only because the bundled resource index below is keyed by
 * the roadmap.sh slug.
 */
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

export function getRoadmapSlug(roleSlug: string): string {
  return ROADMAP_SLUG_MAP[roleSlug] ?? roleSlug
}

const contentCache = new Map<string, ResourceLink[]>()

/**
 * The in-flight request, not its result: every topic on the page asks for the
 * index in the same tick, so caching only the resolved value still let all of
 * them start their own fetch -- a hundred-odd identical requests for one static
 * file on every roadmap render.
 */
let resourcesJsonRequest: Promise<Record<
  string,
  Record<string, ResourceLink[]>
> | null> | null = null

function loadResourcesJson() {
  resourcesJsonRequest ??= fetch('/data/roadmap-resources.json')
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => {
      // The index ships with the app; a failure here means the page was served
      // from a broken build, and topics simply render without resource links.
      return null
    })
  return resourcesJsonRequest
}

/**
 * Learning resources for one topic, read from the index bundled in
 * `public/data/roadmap-resources.json`.
 *
 * This used to fall back to GitHub (a raw content file, discovered through the
 * GitHub contents API). That repository has since restructured and no longer
 * publishes those paths, so every one of those requests 404s -- it produced a
 * console error per topic and bought nothing. Resources are bundled-only now;
 * to cover more topics, extend the bundled index rather than reaching out at
 * runtime.
 */
export async function fetchTopicResources(
  roadmapSlug: string,
  topicLabel: string,
): Promise<ResourceLink[]> {
  const cacheKey = `${roadmapSlug}:${topicLabel}`
  const cached = contentCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const json = await loadResourcesJson()
  const links = json?.[roadmapSlug]?.[topicLabel]
  if (links?.length) {
    contentCache.set(cacheKey, links)
    return links
  }

  return []
}
