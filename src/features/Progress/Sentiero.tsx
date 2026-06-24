/*
 * Il Sentiero (PRD §5) — the visual heart. 14 nodes on a rising path:
 * completed nodes lit with a warm glow, the current node breathing as it waits
 * for the Ship, future nodes dim. The lit segment grows along the path as you
 * advance — on Ship the light flows to the new node.
 *
 * Two geometries: a wide ascending curve on desktop, and a tall VERTICAL climb
 * on mobile (the primary device) — big, well-spaced nodes so the progress and
 * the light-up stay strong on a phone. `dimmed` desaturates it for the broken
 * screen. The faint full curve underneath is the "truth" the node path rests on.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { DURATION_DAYS } from '../../lib/types'
import type { NodeState } from '../../lib/types'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { EASE } from '../../lib/motion'
import {
  SENTIERO_VIEWBOX,
  SENTIERO_VIEWBOX_V,
  buildSmoothPath,
  nodeLengthFractions,
  sentieroNodes,
  sentieroNodesVertical,
} from '../../lib/path'
import styles from './Sentiero.module.css'

// Geometry is fixed (14 days) — compute both layouts once.
function geometry(nodes: ReturnType<typeof sentieroNodes>, viewBox: { w: number; h: number }) {
  return {
    nodes,
    viewBox,
    path: buildSmoothPath(nodes),
    fractions: nodeLengthFractions(nodes),
    summit: nodes[nodes.length - 1],
  }
}

const HORIZONTAL = {
  ...geometry(sentieroNodes(DURATION_DAYS), SENTIERO_VIEWBOX),
  r: { future: 7, done: 8, current: 8.5, halo: 9, summit: 14 },
  orientation: 'h' as const,
}

const VERTICAL = {
  ...geometry(sentieroNodesVertical(DURATION_DAYS), SENTIERO_VIEWBOX_V),
  r: { future: 11, done: 12, current: 12.5, halo: 13.5, summit: 21 },
  orientation: 'v' as const,
}

interface SentieroProps {
  nodes: NodeState[]
  shippedCount: number
  /** Broken state: the reached path shows desaturated/de-energised, not lit. */
  dimmed?: boolean
}

export default function Sentiero({ nodes, shippedCount, dimmed = false }: SentieroProps) {
  const reduce = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const g = isMobile ? VERTICAL : HORIZONTAL

  const litFraction =
    shippedCount > 0 ? g.fractions[Math.min(shippedCount, DURATION_DAYS) - 1] : 0

  return (
    <div className={`${styles.wrap} ${g.orientation === 'v' ? styles.vertical : ''}`}>
      <svg
        className={dimmed ? `${styles.svg} ${styles.dimmed}` : styles.svg}
        data-orientation={g.orientation}
        viewBox={`0 0 ${g.viewBox.w} ${g.viewBox.h}`}
        role="img"
        aria-label={`Sentiero: ${shippedCount} di ${DURATION_DAYS} giorni spediti`}
      >
        <path className={styles.track} d={g.path} />

        <motion.path
          className={styles.lit}
          d={g.path}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: litFraction }}
          transition={{ duration: reduce ? 0 : 0.65, ease: EASE }}
        />

        <circle className={styles.summit} cx={g.summit.x} cy={g.summit.y} r={g.r.summit} />

        {g.nodes.map((pt, i) => {
          const state: NodeState = nodes[i] ?? 'future'
          if (state === 'current') {
            return (
              <g key={i}>
                <circle className={styles.nodeHalo} cx={pt.x} cy={pt.y} r={g.r.halo} />
                <circle className={styles.nodeCurrent} cx={pt.x} cy={pt.y} r={g.r.current} />
              </g>
            )
          }
          return (
            <circle
              key={i}
              className={state === 'done' ? styles.nodeDone : styles.nodeFuture}
              cx={pt.x}
              cy={pt.y}
              r={state === 'done' ? g.r.done : g.r.future}
            />
          )
        })}
      </svg>
    </div>
  )
}
