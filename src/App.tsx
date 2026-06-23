/*
 * App shell — state-driven (PRD §6): onboarding → daily → completed | broken.
 *
 * Phase 3 ships the real Daily screen + Il Sentiero. Completed/broken are still
 * minimal placeholders here (Phase 6 makes them premium end states with the
 * anti-abandon relaunch).
 */

import { usePatto } from './hooks/usePatto'
import Onboarding from './features/Onboarding/Onboarding'
import Daily from './features/Daily/Daily'
import Sentiero from './features/Progress/Sentiero'
import styles from './App.module.css'

export default function App() {
  const { patto, derived, storageAvailable, isDev, seal, ship, restart, skipDay } =
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

  if (derived.view === 'completed' || derived.view === 'broken') {
    const completed = derived.view === 'completed'
    return (
      <main className={styles.shell}>
        <span className={styles.harnessTag}>
          {completed ? 'Completato' : 'Interrotto'} · finale definitivo in Fase 6
        </span>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <Sentiero nodes={derived.nodes} shippedCount={derived.shippedCount} />
          <p className={styles.pact}>
            {completed
              ? '14 giorni. Nemmeno uno saltato.'
              : `Hai spedito ${derived.shippedCount} ${
                  derived.shippedCount === 1 ? 'giorno' : 'giorni'
                } su ${patto.durationDays}. Poi si è interrotto.`}
          </p>
          {completed && patto.why && <p className={styles.quiet}>« {patto.why} »</p>}
          <div className={styles.actions} style={{ justifyContent: 'center' }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={restart}>
              {completed ? 'Inizia un nuovo patto' : 'Riparti dai 14'}
            </button>
            {isDev && (
              <button className={styles.btn} onClick={skipDay}>
                Skip Day ⏭
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <Daily
      patto={patto}
      derived={derived}
      isDev={isDev}
      onShip={ship}
      onSkipDay={skipDay}
      onRestart={restart}
    />
  )
}
