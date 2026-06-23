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
  addDays,
  applyShip,
  applySkipDay,
  createSealedPatto,
  diffDays,
  evaluate,
  getPattoDay,
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
  /** Dev-only; all no-ops in production builds. */
  skipDay: () => void
  stepBackDay: () => void
  /** Jump to day N with the previous N-1 days shipped, ready to ship day N. */
  goToDay: (n: number) => void
  forceBroken: () => void
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

  // Dev: step the simulated clock back one patto-day (via devDayOffset).
  const stepBackDay = useCallback(() => {
    if (!import.meta.env.DEV) return
    setPattoState((current) => {
      if (!current) return current
      const next = { ...current, devDayOffset: (current.devDayOffset ?? 0) - 1 }
      savePatto(next)
      return next
    })
  }, [])

  // Dev: jump straight to day N — N-1 days shipped, ready to ship day N. The
  // clock part still goes through devDayOffset so it stays time-faithful.
  const goToDay = useCallback(
    (n: number) => {
      if (!import.meta.env.DEV) return
      setPattoState((current) => {
        if (!current) return current
        const day = Math.min(Math.max(Math.round(n), 1), current.durationDays)
        const target = addDays(current.startPattoDate, day - 1)
        const offset = diffDays(target, getPattoDay(now, 0))
        const next: Patto = {
          ...current,
          devDayOffset: offset,
          shippedCount: day - 1,
          lastShippedPattoDate: day >= 2 ? addDays(current.startPattoDate, day - 2) : null,
          status: 'active',
        }
        savePatto(next)
        return next
      })
    },
    [now],
  )

  // Dev: force the broken end state to inspect that screen immediately.
  const forceBroken = useCallback(() => {
    if (!import.meta.env.DEV) return
    setPattoState((current) => {
      if (!current) return current
      const next: Patto = { ...current, status: 'broken' }
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
    stepBackDay,
    goToDay,
    forceBroken,
  }
}
