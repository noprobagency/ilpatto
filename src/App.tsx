/*
 * App shell — state-driven (PRD §6): onboarding → daily → completed | broken.
 *
 * Phase 2 ships the real Onboarding. The "daily" branch below is still a
 * temporary placeholder that exposes Ship / Skip Day / Reset so the full flow
 * stays testable; Phase 3 replaces it with the real Daily screen + Il Sentiero.
 */

import { usePatto } from './hooks/usePatto'
import Onboarding from './features/Onboarding/Onboarding'
import styles from './App.module.css'

function fmtTime(d: Date): string {
  return d.toLocaleString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function App() {
  const { patto, derived, storageAvailable, isDev, now, seal, ship, restart, skipDay } =
    usePatto()

  if (!storageAvailable) {
    return (
      <main className={styles.shell}>
        <p className={styles.warn}>
          Questo dispositivo ha la memoria locale disattivata (modalità privata o
          cookie bloccati). Il Patto ha bisogno di salvare il tuo progresso su
          questo dispositivo. Riattiva la memoria locale e ricarica.
        </p>
      </main>
    )
  }

  if (!patto || !derived) {
    return <Onboarding onSeal={seal} />
  }

  // Temporary Daily placeholder (replaced by Phase 3).
  return (
    <main className={styles.shell}>
      <span className={styles.harnessTag}>Fase 3 (placeholder) · Daily &amp; Sentiero in arrivo</span>

      <div className={styles.card}>
        <span className={styles.badge} data-status={derived.status}>
          {derived.status}
        </span>

        <p className={styles.protocol}>{patto.protocolName}</p>
        <p className={styles.pact}>
          Se <em>{patto.trigger}</em>, allora <em>{patto.action}</em>.
        </p>

        <div className={styles.statusRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Giorno</span>
            <span className={`${styles.statValue} tabular`}>
              {Math.min(derived.dayNumber, patto.durationDays)} / {patto.durationDays}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Spediti</span>
            <span className={`${styles.statValue} tabular`}>{derived.shippedCount}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Vista</span>
            <span className={styles.statValue}>{derived.view}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Giornata-patto</span>
            <span className={`${styles.statValue} tabular`}>{derived.currentPattoDay}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Prossimo sblocco</span>
            <span className={styles.statValue}>{fmtTime(derived.nextUnlock)}</span>
          </div>
        </div>

        <div className={styles.nodes}>
          {derived.nodes.map((state, i) => (
            <span
              key={i}
              className={styles.node}
              data-state={state}
              title={`Giorno ${i + 1}: ${state}`}
            />
          ))}
        </div>

        {derived.view === 'shipped-today' && (
          <p className={styles.quiet}>Spedito. Ci vediamo domani alle 8.</p>
        )}
        {derived.view === 'completed' && (
          <p className={styles.quiet}>14 giorni. Nemmeno uno saltato.</p>
        )}
        {derived.view === 'broken' && (
          <p className={styles.quiet}>
            Hai spedito {derived.shippedCount}{' '}
            {derived.shippedCount === 1 ? 'giorno' : 'giorni'} su {patto.durationDays}.
            Poi si è interrotto.
          </p>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={ship}
            disabled={!derived.shippableToday}
          >
            Ship
          </button>
          {isDev && (
            <button className={styles.btn} onClick={skipDay}>
              Skip Day ⏭
            </button>
          )}
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={restart}>
            Riparti / Reset
          </button>
        </div>
      </div>

      <details className={styles.debug}>
        <summary>Stato grezzo (debug)</summary>
        <pre>
          {JSON.stringify({ now: now.toISOString(), patto, derived: derived ?? null }, null, 2)}
        </pre>
      </details>
    </main>
  )
}
