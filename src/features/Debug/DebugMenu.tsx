/*
 * Dev-only debug menu (PRD §8 debug, extended). Mounted only when
 * import.meta.env.DEV — excluded from the production build entirely. All time
 * manipulation goes through devDayOffset in usePatto, so it stays
 * indistinguishable from real time passing and never dirties the engine.
 */

import { useState } from 'react'
import type { DerivedState, Patto } from '../../lib/types'
import styles from './DebugMenu.module.css'

interface DebugMenuProps {
  patto: Patto | null
  derived: DerivedState | null
  onSkip: () => void
  onBack: () => void
  onGoToDay: (n: number) => void
  onForceBroken: () => void
  onReset: () => void
}

function fmt(d: Date): string {
  return d.toLocaleString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <span className={styles.k}>{k}</span>
      <span className={styles.v}>{v}</span>
    </>
  )
}

export default function DebugMenu({
  patto,
  derived,
  onSkip,
  onBack,
  onGoToDay,
  onForceBroken,
  onReset,
}: DebugMenuProps) {
  const [open, setOpen] = useState(false)
  const [dayInput, setDayInput] = useState('')

  const go = () => {
    const n = parseInt(dayInput, 10)
    if (!Number.isNaN(n)) onGoToDay(n)
  }

  return (
    <div className={styles.bar}>
      {open && (
        <div className={styles.panel}>
          {patto && derived ? (
            <>
              <div className={styles.state}>
                <Row k="giornata-patto" v={derived.currentPattoDay} />
                <Row k="dayNumber" v={`${derived.dayNumber} / ${patto.durationDays}`} />
                <Row k="status · view" v={`${derived.status} · ${derived.view}`} />
                <Row k="shipped" v={String(derived.shippedCount)} />
                <Row k="lastShipped" v={patto.lastShippedPattoDate ?? '—'} />
                <Row k="devDayOffset" v={String(patto.devDayOffset ?? 0)} />
                <Row k="next rollover" v={fmt(derived.nextUnlock)} />
              </div>
              <div className={styles.controls}>
                <button className={styles.btn} onClick={onBack}>
                  ⏮ −1 giorno
                </button>
                <button className={styles.btn} onClick={onSkip}>
                  +1 giorno ⏭
                </button>
                <span className={styles.goGroup}>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    max={patto.durationDays}
                    placeholder="N"
                    value={dayInput}
                    onChange={(e) => setDayInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && go()}
                  />
                  <button className={styles.btn} onClick={go}>
                    Vai al giorno
                  </button>
                </span>
                <button
                  className={`${styles.btn} ${styles.danger}`}
                  onClick={onForceBroken}
                >
                  Forza interrotto
                </button>
                <button className={`${styles.btn} ${styles.danger}`} onClick={onReset}>
                  Reset totale
                </button>
              </div>
            </>
          ) : (
            <div className={styles.controls}>
              <span className={styles.empty}>Nessun patto (onboarding).</span>
              <button className={`${styles.btn} ${styles.danger}`} onClick={onReset}>
                Reset totale
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.handle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.dot} aria-hidden="true" />
        debug
        {derived && (
          <span className={styles.handleState}>
            · giorno {derived.dayNumber} · {derived.status}
          </span>
        )}
        <span className={styles.chev} aria-hidden="true">
          {open ? '▾' : '▴'}
        </span>
      </button>
    </div>
  )
}
