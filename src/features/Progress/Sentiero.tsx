/*
 * Il Sentiero (PRD §5) — the visual heart. 14 nodes on a rising curve:
 * completed nodes lit with a warm glow, the current node breathing as it waits
 * for the Ship, future nodes dim. The lit segment grows along the path as you
 * advance — on Ship the light flows to the new node (the burst/dopamine layer
 * is refined in Phase 5). The faint full curve underneath is the "truth" the
 * node path rests on.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { DURATION_DAYS } from '../../lib/types'
import type { NodeState } from '../../lib/types'
import {
  SENTIERO_VIEWBOX,
  buildSmoothPath,
  nodeLengthFractions,
  sentieroNodes,
} from '../../lib/path'
import styles from './Sentiero.module.css'

// Geometry is fixed (14 days) — compute once.
const NODES = sentieroNodes(DURATION_DAYS)
const PATH_D = buildSmoothPath(NODES)
const FRACTIONS = nodeLengthFractions(NODES)

interface SentieroProps {
  nodes: NodeState[]
  shippedCount: number
}

export default function Sentiero({ nodes, shippedCount }: SentieroProps) {
  const reduce = useReducedMotion()
  const litFraction = shippedCount > 0 ? FRACTIONS[Math.min(shippedCount, DURATION_DAYS) - 1] : 0
  const summit = NODES[NODES.length - 1]

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${SENTIERO_VIEWBOX.w} ${SENTIERO_VIEWBOX.h}`}
        role="img"
        aria-label={`Sentiero: ${shippedCount} di ${DURATION_DAYS} giorni spediti`}
      >
        <path className={styles.track} d={PATH_D} />

        <motion.path
          className={styles.lit}
          d={PATH_D}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: litFraction }}
          transition={{ duration: reduce ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Summit ring — the destination (Day 14) */}
        <circle className={styles.summit} cx={summit.x} cy={summit.y} r={14} />

        {NODES.map((pt, i) => {
          const state: NodeState = nodes[i] ?? 'future'
          if (state === 'current') {
            return (
              <g key={i}>
                <circle className={styles.nodeHalo} cx={pt.x} cy={pt.y} r={9} />
                <circle className={styles.nodeCurrent} cx={pt.x} cy={pt.y} r={8.5} />
              </g>
            )
          }
          return (
            <circle
              key={i}
              className={state === 'done' ? styles.nodeDone : styles.nodeFuture}
              cx={pt.x}
              cy={pt.y}
              r={state === 'done' ? 8 : 7}
            />
          )
        })}
      </svg>
    </div>
  )
}
