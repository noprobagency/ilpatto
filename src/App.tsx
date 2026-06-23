/*
 * Phase 1 verification harness.
 *
 * This is NOT the final UI. It exposes the time engine + state machine so the
 * date logic can be falsified by hand (Seal → Ship → Skip Day → … → completed,
 * and the broken case by skipping a Ship) before any real screens are built.
 * Phases 2–6 replace this with Onboarding / Daily / Il Sentiero / cards / Ship.
 */

import { usePatto } from './hooks/usePatto'
import type { SealInput } from './lib/types'
import styles from './App.module.css'

const DEFAULT_SEAL: SealInput = {
  protocolName: 'Il Patto',
  trigger: 'apro il laptop la mattina',
  action: 'scrivo una riga di codice',
  why: 'voglio diventare uno che spedisce',
}

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

  return (
    <main className={styles.shell}>
      <span className={styles.harnessTag}>Fase 1 · verifica motore temporale</span>

      {!patto || !derived ? (
        <div className={styles.card}>
          <p className={styles.protocol}>Nessun patto attivo</p>
          <p className={styles.pact}>
            Sigilla un patto di prova per iniziare a verificare la logica delle
            date.
          </p>
          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => seal(DEFAULT_SEAL)}
            >
              Sigilla patto di prova
            </button>
          </div>
        </div>
      ) : (
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
              <span className={`${styles.statValue} tabular`}>
                {derived.shippedCount}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Vista</span>
              <span className={styles.statValue}>{derived.view}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Giornata-patto</span>
              <span className={`${styles.statValue} tabular`}>
                {derived.currentPattoDay}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Prossimo sblocco</span>
              <span className={styles.statValue}>{fmtTime(derived.nextUnlock)}</span>
            </div>
          </div>

          <div className={styles.nodes}>
            {derived.nodes.map((state, i) => (
              <span key={i} className={styles.node} data-state={state} title={`Giorno ${i + 1}: ${state}`} />
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
              Hai spedito {derived.shippedCount} giorni su {patto.durationDays}. Poi
              si è interrotto.
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
      )}

      <details className={styles.debug}>
        <summary>Stato grezzo (debug)</summary>
        <pre>
          {JSON.stringify(
            { now: now.toISOString(), patto, derived: derived ?? null },
            null,
            2,
          )}
        </pre>
      </details>
    </main>
  )
}
