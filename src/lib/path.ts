/*
 * Il Sentiero geometry (PRD §5). Pure, deterministic math for the 14-node
 * rising curve. The curve is steeper and denser at the start and wider/flatter
 * toward the end — echoing the asymptotic habit curve, so the first days carry
 * more visual weight ("i primi giorni sono i più importanti").
 *
 * Kept framework-free so it can be unit-tested and reused by any renderer.
 */

export interface Point {
  x: number
  y: number
}

export const SENTIERO_VIEWBOX = { w: 680, h: 240 }
const PAD = { x: 46, top: 42, bottom: 50 }

/** Round to 2 decimals to keep path strings compact. */
const r = (n: number): number => Math.round(n * 100) / 100

/**
 * The N node positions along the rising curve.
 * - x uses an ease-in (p^1.35): nodes are denser at the start, wider at the end.
 * - y uses an ease-out (1-(1-p)^1.7): the climb is steep early, then flattens.
 */
export function sentieroNodes(count: number): Point[] {
  const x0 = PAD.x
  const x1 = SENTIERO_VIEWBOX.w - PAD.x
  const yBottom = SENTIERO_VIEWBOX.h - PAD.bottom
  const yTop = PAD.top
  return Array.from({ length: count }, (_, i) => {
    const p = count === 1 ? 0 : i / (count - 1)
    const fx = Math.pow(p, 1.35)
    const fy = 1 - Math.pow(1 - p, 1.7)
    return { x: r(x0 + (x1 - x0) * fx), y: r(yBottom - (yBottom - yTop) * fy) }
  })
}

/** A smooth SVG path (Catmull-Rom → cubic Bézier) through the points. */
export function buildSmoothPath(pts: Point[]): string {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x} ${pts[0].y}` : ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${p2.x} ${p2.y}`
  }
  return d
}

function cubicAt(p1: Point, c1: Point, c2: Point, p2: Point, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p1.x + b * c1.x + c * c2.x + d * p2.x,
    y: a * p1.y + b * c1.y + c * c2.y + d * p2.y,
  }
}

/**
 * Cumulative arc-length fraction (0..1) at each node, matching the smooth path.
 * Used to light the path up to a given node — the lit stroke ends exactly on
 * the node it represents. fractions[0] === 0, last === 1.
 */
export function nodeLengthFractions(pts: Point[]): number[] {
  if (pts.length < 2) return pts.map(() => 0)
  const SAMPLES = 28
  const cum = [0]
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    let prev = p1
    let segLen = 0
    for (let s = 1; s <= SAMPLES; s++) {
      const pt = cubicAt(p1, c1, c2, p2, s / SAMPLES)
      segLen += Math.hypot(pt.x - prev.x, pt.y - prev.y)
      prev = pt
    }
    total += segLen
    cum.push(total)
  }
  return cum.map((c) => c / total)
}
