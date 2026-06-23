/*
 * usePatto — the patto state machine (PRD §8, §12 Fase 1).
 *
 * Owns the persisted Patto and exposes derived state + the only actions that
 * mutate it (seal, ship, restart, and the dev-only skipDay). Pure logic lives
 * in lib/time.ts; this hook wires it to React state, localStorage, and the
 * day clock, and is responsible for freezing terminal transitions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyShip,
  applySkipDay,
  createSealedPatto,
  evaluate,
  reconcile,
} from '../lib/time'
import {
  clearPatto,
  isStorageAvailable,
  loadPatto,
  savePatto,
} from '../lib/storage'
import type { DerivedState, Patto, SealInput } from '../lib/types'
import { useDayClock } from './useDayClock'

export interface UsePatto {
  patto: Patto | null
  derived: DerivedState | null
  storageAvailable: boolean
  isDev: boolean
  /** Current moment, refreshed by the day clock. */
  now: Date
  seal: (input: SealInput) => void
  ship: () => void
  restart: () => void
  /** Dev-only; no-op in production builds. */
  skipDay: () => void
}

export function usePatto(): UsePatto {
  const now = useDayClock()
  // Lazy initializers run once, before first paint — no flash of onboarding.
  const [storageAvailable] = useState(() => isStorageAvailable())
  const [patto, setPattoState] = useState<Patto | null>(() => loadPatto())

  const persist = useCallback((next: Patto | null) => {
    setPattoState(next)
    if (next) savePatto(next)
    else clearPatto()
  }, [])

  // Freeze a broken transition the moment the clock reveals a missed day.
  // `reconcile` returns the same reference when nothing changes, so this only
  // fires on a real active → broken transition (no render loop).
  useEffect(() => {
    if (!patto) return
    const next = reconcile(patto, now)
    if (next !== patto) persist(next)
  }, [patto, now, persist])

  const derived = useMemo<DerivedState | null>(
    () => (patto ? evaluate(patto, now) : null),
    [patto, now],
  )

  const seal = useCallback(
    (input: SealInput) => persist(createSealedPatto(input, now)),
    [now, persist],
  )

  const ship = useCallback(() => {
    setPattoState((current) => {
      if (!current) return current
      const next = applyShip(current, now)
      if (next !== current) savePatto(next)
      return next
    })
  }, [now])

  const restart = useCallback(() => persist(null), [persist])

  const skipDay = useCallback(() => {
    if (!import.meta.env.DEV) return
    setPattoState((current) => {
      if (!current) return current
      const next = applySkipDay(current)
      savePatto(next)
      return next
    })
  }, [])

  return {
    patto,
    derived,
    storageAvailable,
    isDev: import.meta.env.DEV,
    now,
    seal,
    ship,
    restart,
    skipDay,
  }
}
