/*
 * App shell — state-driven (PRD §6): onboarding → daily → completed | broken.
 *
 * Phase 3 ships the real Daily screen + Il Sentiero. Completed/broken are still
 * minimal placeholders here (Phase 6 makes them premium end states with the
 * anti-abandon relaunch). The debug menu mounts in local dev always, and in
 * production only when unlocked by the secret key (see lib/debugGate).
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { usePatto } from './hooks/usePatto'
import { clearDebugUnlock, isDebugEnabled, persistDebugUnlock } from './lib/debugGate'
import Onboarding from './features/Onboarding/Onboarding'
import Daily from './features/Daily/Daily'
import Completed from './features/EndStates/Completed'
import Broken from './features/EndStates/Broken'
import DebugMenu from './features/Debug/DebugMenu'
import styles from './App.module.css'

export default function App() {
  const patto = usePatto()
  const { derived, storageAvailable, now } = patto

  // Debug gate — all hooks run before any early return.
  const [debugEnabled, setDebugEnabled] = useState(isDebugEnabled)
  useEffect(() => {
    persistDebugUnlock()
  }, [])
  const disableDebug = useCallback(() => {
    clearDebugUnlock()
    setDebugEnabled(false)
  }, [])

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

  let screen: ReactNode

  if (!patto.patto || !derived) {
    screen = <Onboarding onSeal={patto.seal} />
  } else if (derived.view === 'completed') {
    screen = (
      <Completed patto={patto.patto} derived={derived} onNewPact={patto.restart} />
    )
  } else if (derived.view === 'broken') {
    screen = (
      <Broken
        patto={patto.patto}
        derived={derived}
        onRestartSamePact={patto.restartSamePact}
      />
    )
  } else {
    screen = (
      <Daily patto={patto.patto} derived={derived} now={now} onShip={patto.ship} />
    )
  }

  return (
    <>
      {screen}
      {debugEnabled && (
        <DebugMenu
          patto={patto.patto}
          derived={derived}
          onSkip={patto.skipDay}
          onBack={patto.stepBackDay}
          onGoToDay={patto.goToDay}
          onForceBroken={patto.forceBroken}
          onReset={patto.restart}
          onDisable={disableDebug}
        />
      )}
    </>
  )
}
