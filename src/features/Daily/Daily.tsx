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
  now: Date
  isDev: boolean
  onShip: () => void
  onSkipDay: () => void
  onRestart: () => void
}

/** "oggi" / "domani" / weekday for the next 08:00 unlock — informational only. */
function unlockDayWord(now: Date, unlock: Date): string {
  const a = new Date(now)
  a.setHours(0, 0, 0, 0)
  const b = new Date(unlock)
  b.setHours(0, 0, 0, 0)
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  if (diff <= 0) return 'oggi'
  if (diff === 1) return 'domani'
  return unlock.toLocaleDateString('it-IT', { weekday: 'long' })
}

/** Soft relative countdown to the next unlock (purely informational). */
function unlockCountdown(now: Date, unlock: Date): string {
  const ms = unlock.getTime() - now.getTime()
  if (ms <= 0) return 'a breve'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `tra ~${minutes} min`
  return `tra ~${Math.round(ms / 3_600_000)} h`
}

export default function Daily({
  patto,
  derived,
  now,
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
              <span className={styles.quietSub}>
                Prossimo giorno {unlockDayWord(now, derived.nextUnlock)} alle 08:00
              </span>
              <span className={styles.countdown}>
                {unlockCountdown(now, derived.nextUnlock)}
              </span>
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
