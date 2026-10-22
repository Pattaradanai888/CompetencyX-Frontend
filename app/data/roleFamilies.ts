export type RoleFamily = 'build' | 'data' | 'infrastructure' | 'product'

const FAMILY_BY_SLUG: Record<string, RoleFamily> = {
  'frontend-developer': 'build',
  'backend-developer': 'build',
  'full-stack-developer': 'build',
  'android-developer': 'build',
  'ios-developer': 'build',
  'game-developer': 'build',
  'server-side-game-developer': 'build',
  'blockchain-developer': 'build',
  'software-architect': 'build',
  'ai-engineer': 'data',
  'ai-data-scientist': 'data',
  'data-analyst': 'data',
  'data-engineer': 'data',
  'machine-learning-engineer': 'data',
  'mlops-engineer': 'data',
  'bi-analyst': 'data',
  'devops-engineer': 'infrastructure',
  'devsecops-engineer': 'infrastructure',
  'cyber-security-engineer-analyst': 'infrastructure',
  'qa-engineer': 'infrastructure',
  'postgresql-developer-dba': 'infrastructure',
  'ux-designer': 'product',
  'product-manager': 'product',
  'engineering-manager': 'product',
  'developer-relations': 'product',
  'technical-writer': 'product',
}

export function getRoleFamily(slug: string | null | undefined): RoleFamily {
  return (slug && FAMILY_BY_SLUG[slug]) || 'build'
}
