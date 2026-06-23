import { describe, expect, it } from 'vitest'
import { buildSmoothPath, nodeLengthFractions, sentieroNodes } from './path'

describe('sentieroNodes', () => {
  const nodes = sentieroNodes(14)

  it('produces 14 nodes', () => {
    expect(nodes).toHaveLength(14)
  })

  it('rises: x strictly increases, y strictly decreases', () => {
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i].x).toBeGreaterThan(nodes[i - 1].x)
      expect(nodes[i].y).toBeLessThan(nodes[i - 1].y)
    }
  })

  it('is denser at the start (early x-steps smaller than late ones)', () => {
    const firstStep = nodes[1].x - nodes[0].x
    const lastStep = nodes[13].x - nodes[12].x
    expect(firstStep).toBeLessThan(lastStep)
  })

  it('climbs steeply early (early y-drop larger than late)', () => {
    const firstClimb = nodes[0].y - nodes[1].y
    const lastClimb = nodes[12].y - nodes[13].y
    expect(firstClimb).toBeGreaterThan(lastClimb)
  })
})

describe('nodeLengthFractions', () => {
  const fractions = nodeLengthFractions(sentieroNodes(14))

  it('runs from 0 to 1, strictly increasing', () => {
    expect(fractions).toHaveLength(14)
    expect(fractions[0]).toBe(0)
    expect(fractions[13]).toBeCloseTo(1, 5)
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeGreaterThan(fractions[i - 1])
    }
  })
})

describe('buildSmoothPath', () => {
  it('starts with a move command and contains cubic segments', () => {
    const d = buildSmoothPath(sentieroNodes(14))
    expect(d.startsWith('M ')).toBe(true)
    expect(d).toContain(' C ')
  })
})
