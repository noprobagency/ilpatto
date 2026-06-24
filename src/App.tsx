/*
 * App shell — state-driven (PRD §6): onboarding → daily → completed | broken.
 *
 * Phase 3 ships the real Daily screen + Il Sentiero. Completed/broken are still
 * minimal placeholders here (Phase 6 makes them premium end states with the
 * anti-abandon relaunch). The debug menu mounts in local dev always, and in
 * production only when unlocked by the secret key (see lib/debugGate).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePatto } from './hooks/usePatto'
import {
  clearDebugUnlock,
  isDebugEnabled,
  persistDebugUnlock,
  setDebugUnlock,
} from './lib/debugGate'
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

  // In-app secret unlock for the installed PWA (no address bar): 5 quick taps
  // on the top-left corner. Persists the flag and reveals the debug menu.
  const tapsRef = useRef(0)
  const tapTimerRef = useRef<number | undefined>(undefined)
  const handleSecretTap = useCallback(() => {
    tapsRef.current += 1
    window.clearTimeout(tapTimerRef.current)
    tapTimerRef.current = window.setTimeout(() => {
      tapsRef.current = 0
    }, 1500)
    if (tapsRef.current >= 5) {
      tapsRef.current = 0
      setDebugUnlock()
      setDebugEnabled(true)
    }
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
      {!debugEnabled && (
        <button
          aria-hidden="true"
          tabIndex={-1}
          onClick={handleSecretTap}
          title=""
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 44,
            height: 44,
            padding: 0,
            opacity: 0,
            background: 'transparent',
            border: 'none',
            zIndex: 9998,
          }}
        />
      )}
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
