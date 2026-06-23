/*
 * Daily (PRD §6.2) — the main screen. Two focal points: the pact (the central
 * reminder) and the Ship button (the hot point). Everything else is attenuated.
 * The 3 mechanism cards (Phase 4) and the premium Ship feedback (Phase 5) layer
 * onto this. For now the Sentiero already animates the earned light.
 */

import { motion } from 'framer-motion'
import Sentiero from '../Progress/Sentiero'
import type { DerivedState, Patto } from '../../lib/types'
import styles from './Daily.module.css'

interface DailyProps {
  patto: Patto
  derived: DerivedState
  isDev: boolean
  onShip: () => void
  onSkipDay: () => void
  onRestart: () => void
}

export default function Daily({
  patto,
  derived,
  isDev,
  onShip,
  onSkipDay,
  onRestart,
}: DailyProps) {
  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <span className={styles.protocol}>{patto.protocolName}</span>

        <h1 className={styles.pact}>
          Se <em>{patto.trigger}</em>, allora <em>{patto.action}</em>.
        </h1>

        <div className={styles.sentieroWrap}>
          <Sentiero nodes={derived.nodes} shippedCount={derived.shippedCount} />
        </div>

        <p className={styles.counter}>
          <strong className="tabular">Giorno {derived.dayNumber}</strong> di{' '}
          {patto.durationDays}
        </p>

        <div className={styles.shipZone}>
          {derived.shippableToday ? (
            <motion.button
              type="button"
              className={styles.ship}
              onClick={onShip}
              whileTap={{ scale: 0.97 }}
            >
              Ship
            </motion.button>
          ) : (
            <div className={styles.quiet}>
              <span className={styles.quietMark} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={styles.quietTitle}>Spedito.</span>
              <span className={styles.quietSub}>Ci vediamo domani alle 8.</span>
            </div>
          )}
        </div>
      </div>

      {isDev && (
        <div className={styles.devBar}>
          <button className={styles.devBtn} onClick={onSkipDay}>
            Skip Day ⏭
          </button>
          <button className={styles.devBtn} onClick={onRestart}>
            Reset
          </button>
        </div>
      )}
    </main>
  )
}
