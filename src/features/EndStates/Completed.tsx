/*
 * Completed (PRD §6.4) — the victory, but the momentum does not die here.
 * - The path is fully lit (the 14th Ship's bloom flows into this); the lit
 *   stroke draws itself in on mount, a warm continuation.
 * - Identity framing, not just congratulations: not "ce l'hai fatta, riposa"
 *   but "sei diventato uno che spedisce, e questo continua".
 * - "Inizia un nuovo patto" is an open, inviting door — not a small button.
 *   (v2 hangs the 14→30→60 sprints here; for now the door is simply open.)
 * - Premium, sober, warm — no confetti.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Sentiero from '../Progress/Sentiero'
import type { DerivedState, Patto } from '../../lib/types'
import { EASE } from '../../lib/motion'
import styles from './EndStates.module.css'

interface CompletedProps {
  patto: Patto
  derived: DerivedState
  onNewPact: () => void
}

export default function Completed({ patto, derived, onNewPact }: CompletedProps) {
  const reduce = useReducedMotion()

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: EASE },
        }

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <motion.span className={styles.label} {...rise(0)}>
          {patto.protocolName}
        </motion.span>

        <motion.div className={styles.pathWrap} {...rise(0.06)}>
          <Sentiero nodes={derived.nodes} shippedCount={derived.shippedCount} />
        </motion.div>

        <motion.h1 className={styles.headline} {...rise(0.14)}>
          14 giorni. Nemmeno uno saltato.
        </motion.h1>

        <motion.p className={styles.sub} {...rise(0.2)}>
          Non hai solo finito un percorso: sei diventato uno che spedisce. E questo
          non si esaurisce oggi.
        </motion.p>

        {patto.why && (
          <motion.p className={styles.whyCallout} {...rise(0.26)}>
            « {patto.why} »
          </motion.p>
        )}

        <motion.div className={styles.ctaWrap} {...rise(0.32)}>
          <motion.button
            type="button"
            className={styles.cta}
            onClick={onNewPact}
            whileTap={{ scale: 0.97 }}
          >
            Inizia un nuovo patto
          </motion.button>
          <p className={styles.ctaSub}>
            Il percorso conta più del traguardo. La porta del prossimo è già aperta.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
