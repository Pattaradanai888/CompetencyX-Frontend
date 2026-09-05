import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_ROLE_META,
  ROLE_META,
  ROLE_META_VOCAB_TH,
  ROLE_RESPONSIBILITIES_TH,
  getRoleMeta,
} from '../../app/data/roleMeta'

const THAI_SCRIPT = /[฀-๿]/

const TAG_GROUPS = [
  'careerAreas',
  'workStyle',
  'environment',
  'experience',
  'skills',
  'interests',
] as const

describe('getRoleMeta', () => {
  afterEach(() => {
    delete ROLE_META['quantum-tinkerer']
  })

  it('returns the English metadata by default', () => {
    expect(getRoleMeta('frontend-developer')).toBe(
      ROLE_META['frontend-developer'],
    )
    expect(getRoleMeta('frontend-developer', 'en').workStyle).toEqual([
      'Creative',
      'Technical',
    ])
  })

  it('translates every tag group and the responsibilities of a known role', () => {
    const en = ROLE_META['frontend-developer']!
    const th = getRoleMeta('frontend-developer', 'th')

    expect(th.domain).toBe('เทคโนโลยี')
    expect(th.careerAreas).toEqual(['Frontend'])
    expect(th.workStyle).toEqual(['สร้างสรรค์', 'เชิงเทคนิค'])
    expect(th.environment).toEqual(['ทำงานทางไกลได้', 'เน้นการทำงานเป็นทีม'])
    expect(th.experience).toEqual(['เริ่มต้น', 'Junior', 'ระดับกลาง'])
    expect(th.skills).toEqual(['การเขียนโปรแกรม', 'การออกแบบ'])
    expect(th.interests).toEqual([
      'ความคิดสร้างสรรค์',
      'เทคโนโลยี',
      'การช่วยเหลือผู้อื่น',
    ])

    expect(th.responsibilities).toBe(
      ROLE_RESPONSIBILITIES_TH['frontend-developer'],
    )
    expect(th.responsibilities).toHaveLength(en.responsibilities.length)
    for (const item of th.responsibilities) {
      expect(item).toMatch(THAI_SCRIPT)
    }
  })

  it('has a Thai reading for every tag and a responsibilities list for every role', () => {
    for (const [slug, meta] of Object.entries(ROLE_META)) {
      expect(ROLE_META_VOCAB_TH, `domain ${meta.domain}`).toHaveProperty(
        meta.domain,
      )
      for (const group of TAG_GROUPS) {
        for (const tag of meta[group]) {
          expect(ROLE_META_VOCAB_TH, `${slug} ${group} ${tag}`).toHaveProperty(
            tag,
          )
        }
      }
      expect(ROLE_RESPONSIBILITIES_TH[slug], slug).toHaveLength(
        meta.responsibilities.length,
      )
    }
  })

  it('falls back to the default metadata for an unknown slug', () => {
    expect(getRoleMeta('no-such-role')).toBe(DEFAULT_ROLE_META)
    expect(getRoleMeta(null)).toBe(DEFAULT_ROLE_META)

    const th = getRoleMeta('no-such-role', 'th')
    expect(th.careerAreas).toEqual(['Full Stack'])
    expect(th.workStyle).toEqual(['เชิงเทคนิค', 'เชิงวิเคราะห์'])
    expect(th.responsibilities).toHaveLength(
      DEFAULT_ROLE_META.responsibilities.length,
    )
    for (const item of th.responsibilities) {
      expect(item).toMatch(THAI_SCRIPT)
    }
  })

  it('leaves a tag with no Thai reading in English', () => {
    ROLE_META['quantum-tinkerer'] = {
      ...DEFAULT_ROLE_META,
      skills: ['Programming', 'Quantum Circuits'],
    }

    const th = getRoleMeta('quantum-tinkerer', 'th')

    expect(th.skills).toEqual(['การเขียนโปรแกรม', 'Quantum Circuits'])
    // A role with no Thai responsibilities keeps the English list.
    expect(th.responsibilities).toBe(DEFAULT_ROLE_META.responsibilities)
  })
})
