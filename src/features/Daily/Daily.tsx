/*
 * Daily (PRD §6.2, §9) — the main screen. Two focal points: the pact (the
 * central reminder) and the Ship button (the hot point). Everything else is
 * attenuated.
 *
 * Ship feedback aim (see memory ilpatto-ship-feedback-aim): light & motion do
 * the work, not the quantity of effects. The ordinary 13 Ships are quick and
 * never blocking — a sober light burst, the path light flowing (in Sentiero),
 * the counter ticking up, an optional short haptic. The 14th Ship — the one
 * that completes the pact — opens into a fuller warm bloom before handing off
 * to the Completed screen, so the arrival feels different from the rest.
 */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Sentiero from '../Progress/Sentiero'
import MechanismCards from '../Mechanisms/MechanismCards'
import AnimatedNumber from '../../components/AnimatedNumber'
import type { DerivedState, Patto } from '../../lib/types'
import styles from './Daily.module.css'

interface DailyProps {
  patto: Patto
  derived: DerivedState
  now: Date
  onShip: () => void
}

/** Optional, best-effort haptic (PRD §9). Silently no-ops where unsupported. */
function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignore */
  }
}

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

function unlockCountdown(now: Date, unlock: Date): string {
  const ms = unlock.getTime() - now.getTime()
  if (ms <= 0) return 'a breve'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `tra ~${minutes} min`
  return `tra ~${Math.round(ms / 3_600_000)} h`
}

export default function Daily({ patto, derived, now, onShip }: DailyProps) {
  const reduce = useReducedMotion()
  const [flash, setFlash] = useState(0)
  const [celebrating, setCelebrating] = useState(false)

  const handleShip = () => {
    const completing = derived.shippedCount + 1 >= patto.durationDays
    if (completing) {
      // The victory — a fuller bloom, then hand off to Completed.
      vibrate([18, 50, 30])
      if (reduce) {
        onShip()
        return
      }
      setCelebrating(true)
      window.setTimeout(onShip, 750)
    } else {
      // One of the thirteen — quick, never blocking.
      vibrate(14)
      setFlash((f) => f + 1)
      onShip()
    }
  }

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

        <div className={styles.counter}>
          <AnimatedNumber value={derived.shippedCount} className={styles.counterNum} />
          <span className={styles.counterTotal}>/ {patto.durationDays}</span>
          <span className={styles.counterLabel}>giorni spediti</span>
        </div>

        {derived.shippableToday && <MechanismCards patto={patto} />}

        <div className={styles.shipZone}>
          {flash > 0 && (
            <motion.span
              key={flash}
              className={styles.burst}
              initial={{ scale: 0.5, opacity: 0.55 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              aria-hidden="true"
            />
          )}

          {derived.shippableToday ? (
            <motion.button
              type="button"
              className={styles.ship}
              onClick={handleShip}
              whileTap={{ scale: 0.96 }}
              disabled={celebrating}
            >
              Ship
            </motion.button>
          ) : (
            <motion.div
              className={styles.quiet}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          )}
        </div>
      </div>

      {celebrating && (
        <motion.div
          className={styles.bloom}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.9, 0], scale: 1.7 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
    </main>
  )
}
