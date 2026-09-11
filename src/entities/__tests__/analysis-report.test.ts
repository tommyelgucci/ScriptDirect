import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { analysisReportSchema, findingSchema } from '../analysis-report'

describe('findingSchema', () => {
  it('defaults reviewState to unreviewed', () => {
    const result = findingSchema.safeParse({ id: createId('fnd'), text: 'The midpoint lacks a reversal.' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reviewState).toBe('unreviewed')
    }
  })

  it('rejects an invalid review state', () => {
    const result = findingSchema.safeParse({
      id: createId('fnd'),
      text: 'The midpoint lacks a reversal.',
      reviewState: 'ignored',
    })
    expect(result.success).toBe(false)
  })
})

describe('analysisReportSchema', () => {
  it('accepts a valid report with empty sections defaulted', () => {
    const result = analysisReportSchema.safeParse({
      id: createId('rpt'),
      createdAt: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.strengths).toEqual([])
    }
  })

  it('rejects a malformed createdAt timestamp', () => {
    const result = analysisReportSchema.safeParse({
      id: createId('rpt'),
      createdAt: 'yesterday',
    })
    expect(result.success).toBe(false)
  })
})
