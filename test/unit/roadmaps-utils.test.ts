import { describe, expect, it } from 'vitest'
import {
  buildRadarDimensions,
  getTopicDifficultyLabel,
  getTopicEntryTitle,
} from '../../app/utils/roadmaps'
import type { SkillAssessmentTopicEntry } from '../../shared/types/assessment'

const labels = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  targeted: 'Targeted',
}

const entries: SkillAssessmentTopicEntry[] = [
  {
    topic_slug: 'backend-developer--databases',
    topic_title: 'Data storage',
    topic_title_th: 'การจัดเก็บข้อมูล',
    node_slugs: ['data-storage'],
    state: 'assessed_gap',
    mastery: 0.25,
  },
  {
    topic_slug: 'backend-developer--caching',
    topic_title: 'Caching',
    topic_title_th: null,
    node_slugs: ['caching'],
    state: 'unassessed',
    mastery: null,
  },
  {
    topic_slug: 'backend-developer--internet-and-web',
    topic_title: 'Internet and web protocols',
    topic_title_th: 'อินเทอร์เน็ตและโปรโตคอลเว็บ',
    node_slugs: ['internet-and-web'],
    state: 'held',
    mastery: 1.0,
  },
  {
    // Held by a mark alone: the respondent never rated it, so there is no
    // Self-placed Mastery to plot.
    topic_slug: 'backend-developer--version-control',
    topic_title: 'Version control',
    node_slugs: ['version-control'],
    state: 'held',
    mastery: null,
    held_by_mark: true,
  },
]

describe('buildRadarDimensions', () => {
  it('plots one axis per rated set and leaves unassessed sets out', () => {
    const dimensions = buildRadarDimensions(entries, false)

    expect(dimensions.map((dimension) => dimension.key)).toEqual([
      'backend-developer--databases',
      'backend-developer--internet-and-web',
    ])
    expect(dimensions.map((dimension) => dimension.value)).toEqual([0.25, 1])
  })

  it('reads the Canonical Thai Wording in a Thai session and falls back to English', () => {
    const dimensions = buildRadarDimensions(entries, true)

    expect(dimensions.map((dimension) => dimension.label)).toEqual([
      'การจัดเก็บข้อมูล',
      'อินเทอร์เน็ตและโปรโตคอลเว็บ',
    ])
    expect(getTopicEntryTitle(entries[1]!, true)).toBe('Caching')
  })

  it('clamps a mastery outside 0..1 instead of drawing past the ring', () => {
    const [dimension] = buildRadarDimensions(
      [{ ...entries[0]!, mastery: 1.4 }],
      false,
    )
    expect(dimension!.value).toBe(1)
  })
})

describe('getTopicDifficultyLabel', () => {
  it('maps the numeric scale onto the three bands', () => {
    expect(getTopicDifficultyLabel(1, labels)).toBe('Foundation')
    expect(getTopicDifficultyLabel(2, labels)).toBe('Foundation')
    expect(getTopicDifficultyLabel(3, labels)).toBe('Intermediate')
    expect(getTopicDifficultyLabel(4, labels)).toBe('Intermediate')
    expect(getTopicDifficultyLabel(5, labels)).toBe('Advanced')
  })

  it('passes a pre-labelled string through and falls back to targeted', () => {
    expect(getTopicDifficultyLabel('Expert', labels)).toBe('Expert')
    expect(getTopicDifficultyLabel(undefined, labels)).toBe('Targeted')
    expect(getTopicDifficultyLabel('   ', labels)).toBe('Targeted')
  })
})
