/*
 * Broken (PRD §6.5) — the most delicate screen in the app. One job: make
 * "Riparti dai 14" more attractive than closing the app, at the moment when
 * abandoning entirely is easiest.
 *
 * - Honest, never punitive: the path is visibly closed (Sentiero desaturated to
 *   the reached node), not sugar-coated.
 * - The failure is of the PATH, not the person: "Il percorso si è interrotto",
 *   never "ti sei fermato / hai mollato / hai fallito". No blame, no sad faces.
 * - The relaunch is the largest, warmest element — the obvious next gesture.
 *   One tap re-seals the same pact and drops straight back to Day 1 (least
 *   friction). Tone: a coach who won't pretend it went well, but gets you up.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Sentiero from '../Progress/Sentiero'
import type { DerivedState, Patto } from '../../lib/types'
import styles from './EndStates.module.css'

interface BrokenProps {
  patto: Patto
  derived: DerivedState
  onRestartSamePact: () => void
}

export default function Broken({ patto, derived, onRestartSamePact }: BrokenProps) {
  const reduce = useReducedMotion()
  const n = derived.shippedCount

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <motion.span className={styles.label} {...rise(0)}>
          {patto.protocolName}
        </motion.span>

        <motion.div className={styles.pathWrap} {...rise(0.06)}>
          <Sentiero nodes={derived.nodes} shippedCount={n} dimmed />
        </motion.div>

        <motion.h1 className={styles.headline} {...rise(0.12)}>
          {n > 0
            ? `Il percorso si è interrotto al giorno ${n}.`
            : 'Il percorso si è chiuso prima di iniziare.'}
        </motion.h1>

        <motion.p className={styles.sub} {...rise(0.18)}>
          Non è un giudizio su di te — è un percorso che si chiude. Quello che hai
          imparato in questi giorni resta. Si riparte adesso.
        </motion.p>

        <motion.div className={styles.ctaWrap} {...rise(0.26)}>
          <motion.button
            type="button"
            className={styles.cta}
            onClick={onRestartSamePact}
            whileTap={{ scale: 0.97 }}
          >
            Riparti dai 14
          </motion.button>
          <p className={styles.pactReminder}>
            Lo stesso patto, da capo: <em>Se {patto.trigger}, allora {patto.action}.</em>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
