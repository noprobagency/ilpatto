/*
 * Time engine tests (PRD §12, Fase 1: "Testato falsificando le date").
 * Every case feeds an explicit `now` so the clock is fully controlled.
 */

import { describe, expect, it } from 'vitest'
import {
  addDays,
  applyShip,
  applySkipDay,
  createSealedPatto,
  diffDays,
  evaluate,
  getPattoDay,
  nextUnlockFor,
  reconcile,
  toLocalISODate,
} from './time'
import type { Patto, SealInput } from './types'

/** Build a local Date (month is 1-based here for readability). */
const local = (y: number, mo: number, d: number, h = 12, mi = 0): Date =>
  new Date(y, mo - 1, d, h, mi, 0, 0)

const SEAL_INPUT: SealInput = {
  protocolName: 'Il Patto',
  trigger: 'dopo il caffè',
  action: 'scrivo una riga di codice',
}

describe('local-date primitives', () => {
  it('formats local dates without UTC drift', () => {
    expect(toLocalISODate(local(2026, 6, 23, 0, 30))).toBe('2026-06-23')
    expect(toLocalISODate(local(2026, 1, 5, 23, 59))).toBe('2026-01-05')
  })

  it('diffDays returns whole-day deltas', () => {
    expect(diffDays('2026-06-24', '2026-06-23')).toBe(1)
    expect(diffDays('2026-06-23', '2026-06-24')).toBe(-1)
    expect(diffDays('2026-07-01', '2026-06-23')).toBe(8)
    expect(diffDays('2026-06-23', '2026-06-23')).toBe(0)
  })

  it('diffDays survives a DST transition (Europe spring forward, 2026-03-29)', () => {
    expect(diffDays('2026-03-30', '2026-03-28')).toBe(2)
  })

  it('addDays moves across month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('getPattoDay — 08:00 rollover', () => {
  it('before 08:00 belongs to the previous day', () => {
    expect(getPattoDay(local(2026, 6, 23, 7, 59))).toBe('2026-06-22')
  })

  it('at exactly 08:00 it is the new day', () => {
    expect(getPattoDay(local(2026, 6, 23, 8, 0))).toBe('2026-06-23')
  })

  it('after 08:00 it is today', () => {
    expect(getPattoDay(local(2026, 6, 23, 23, 30))).toBe('2026-06-23')
  })

  it('applies a simulated day offset (Skip Day)', () => {
    expect(getPattoDay(local(2026, 6, 23, 10, 0), 1)).toBe('2026-06-24')
    expect(getPattoDay(local(2026, 6, 23, 7, 0), 1)).toBe('2026-06-23') // pre-08:00 + 1
  })
})

describe('nextUnlockFor', () => {
  it('returns 08:00 on the day after the given patto-day', () => {
    expect(nextUnlockFor('2026-06-23').getTime()).toBe(local(2026, 6, 24, 8, 0).getTime())
  })
  it('crosses month boundaries', () => {
    expect(nextUnlockFor('2026-06-30').getTime()).toBe(local(2026, 7, 1, 8, 0).getTime())
  })
})

describe('seal → Day 1', () => {
  it('seals on the current patto-day and leaves Day 1 unshipped but shippable', () => {
    const now = local(2026, 6, 23, 10, 0)
    const patto = createSealedPatto(SEAL_INPUT, now)
    expect(patto.startPattoDate).toBe('2026-06-23')
    expect(patto.lastShippedPattoDate).toBeNull()
    expect(patto.shippedCount).toBe(0)
    expect(patto.status).toBe('active')

    const d = evaluate(patto, now)
    expect(d.view).toBe('active')
    expect(d.shippableToday).toBe(true)
    expect(d.dayNumber).toBe(1)
    expect(d.currentDayIndex).toBe(0)
    expect(d.nodes[0]).toBe('current')
    expect(d.nodes[1]).toBe('future')
  })

  it('trims input and falls back to a default name', () => {
    const patto = createSealedPatto(
      { protocolName: '   ', trigger: ' x ', action: ' y ', why: '  ' },
      local(2026, 6, 23, 10),
    )
    expect(patto.protocolName).toBe('Il Patto')
    expect(patto.trigger).toBe('x')
    expect(patto.action).toBe('y')
    expect('why' in patto).toBe(false)
  })
})

describe('happy path — 14 consecutive days', () => {
  it('ships once per day and completes on Day 14', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    for (let day = 0; day < 14; day++) {
      // Each day's morning, after 08:00.
      const now = local(2026, 6, 23 + day, 9, 0)
      const before = evaluate(patto, now)
      expect(before.shippableToday).toBe(true)
      expect(before.dayNumber).toBe(day + 1)
      patto = applyShip(patto, now)
      expect(patto.shippedCount).toBe(day + 1)

      const after = evaluate(patto, now)
      if (day < 13) {
        expect(after.view).toBe('shipped-today')
        expect(after.status).toBe('active')
      } else {
        expect(after.view).toBe('completed')
        expect(after.status).toBe('completed')
        expect(after.nodes.every((n) => n === 'done')).toBe(true)
      }
    }
  })
})

describe('idempotency within a patto-day', () => {
  it('a second Ship the same day is a no-op', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    const again = applyShip(patto, local(2026, 6, 23, 18))
    expect(again).toBe(patto) // same reference, unchanged
    expect(again.shippedCount).toBe(1)
  })

  it('shows shipped-today until 08:00, then opens the next day', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))

    // 07:59 next morning still belongs to Day 1.
    expect(evaluate(patto, local(2026, 6, 24, 7, 59)).view).toBe('shipped-today')
    // 08:00 → Day 2 unlocks.
    const day2 = evaluate(patto, local(2026, 6, 24, 8, 0))
    expect(day2.view).toBe('active')
    expect(day2.shippableToday).toBe(true)
    expect(day2.dayNumber).toBe(2)
    expect(day2.currentDayIndex).toBe(1)
  })
})

describe('broken path', () => {
  it('breaks when a full day is skipped after shipping', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10)) // ship Day 1
    // Skip Day 2 entirely; reopen on Day 3.
    const d = evaluate(patto, local(2026, 6, 25, 9))
    expect(d.view).toBe('broken')
    expect(d.shippedCount).toBe(1)
  })

  it('breaks if Day 1 itself is never shipped and a day passes', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    // Reopen Day 2 morning without ever shipping Day 1.
    expect(evaluate(patto, local(2026, 6, 24, 9)).view).toBe('broken')
  })

  it('does NOT break pre-08:00 the morning after the seal (still Day 1)', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    const d = evaluate(patto, local(2026, 6, 24, 7, 30))
    expect(d.view).toBe('active')
    expect(d.shippableToday).toBe(true)
    expect(d.dayNumber).toBe(1)
  })

  it('reconcile freezes the broken status so it persists', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    const frozen = reconcile(patto, local(2026, 6, 25, 9))
    expect(frozen).not.toBe(patto)
    expect(frozen.status).toBe('broken')
    // Once broken, the clock no longer matters.
    expect(evaluate(frozen, local(2026, 12, 31, 12)).view).toBe('broken')
  })

  it('reconcile leaves a healthy active patto untouched (same ref)', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    expect(reconcile(patto, local(2026, 6, 23, 12))).toBe(patto)
  })
})

describe('completed is frozen', () => {
  it('stays completed even far in the future', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    for (let day = 0; day < 14; day++) {
      patto = applyShip(patto, local(2026, 6, 23 + day, 9))
    }
    expect(patto.status).toBe('completed')
    expect(evaluate(patto, local(2027, 1, 1, 12)).view).toBe('completed')
  })
})

describe('Skip Day is indistinguishable from real time passing', () => {
  it('an offset of 1 matches advancing the real clock by a day', () => {
    const base = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    const realNextDay = evaluate(base, local(2026, 6, 24, 10))
    const skipped = evaluate(applySkipDay(base), local(2026, 6, 23, 10))
    expect(skipped.currentPattoDay).toBe(realNextDay.currentPattoDay)
    expect(skipped.view).toBe(realNextDay.view)
    expect(skipped.dayNumber).toBe(realNextDay.dayNumber)
  })

  it('stacks offsets to drive the whole flow, including breaking', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    const now = local(2026, 6, 23, 10)
    patto = applyShip(patto, now) // Day 1 shipped
    patto = applySkipDay(patto) // → Day 2
    expect(evaluate(patto, now).shippableToday).toBe(true)
    patto = applySkipDay(patto) // → Day 3 without shipping Day 2
    expect(evaluate(patto, now).view).toBe('broken')
  })
})

describe('node states reflect progress', () => {
  it('marks done / current / future correctly mid-run', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10)) // Day 1 done
    patto = applyShip(patto, local(2026, 6, 24, 9)) // Day 2 done
    const d = evaluate(patto, local(2026, 6, 25, 9)) // Day 3 available
    expect(d.nodes[0]).toBe('done')
    expect(d.nodes[1]).toBe('done')
    expect(d.nodes[2]).toBe('current')
    expect(d.nodes[3]).toBe('future')
    expect(d.nodes.filter((n) => n === 'done')).toHaveLength(2)
  })
})

describe('seal before 08:00 always grants a full Day 1 (CHANGE 2)', () => {
  it('anchors Day 1 to the seal calendar date (not the 08:00-shifted day)', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 6, 0))
    expect(patto.startPattoDate).toBe('2026-06-23')

    const atSeal = evaluate(patto, local(2026, 6, 23, 6, 0))
    expect(atSeal.view).toBe('active')
    expect(atSeal.shippableToday).toBe(true)
    expect(atSeal.dayNumber).toBe(1)
  })

  it('stays Day 1 across the same-morning 08:00 — the first rollover is the next day', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 6, 0))
    const sameMorning = evaluate(patto, local(2026, 6, 23, 9, 0)) // past 08:00, same day
    expect(sameMorning.view).toBe('active')
    expect(sameMorning.shippableToday).toBe(true)
    expect(sameMorning.dayNumber).toBe(1)
    // The next unlock is the NEXT day's 08:00 — a full cycle ahead.
    expect(sameMorning.nextUnlock.getTime()).toBe(local(2026, 6, 24, 8, 0).getTime())
  })

  it('ship at seal counts for Day 1; Day 2 unlocks a full cycle later', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 6, 0))
    patto = applyShip(patto, local(2026, 6, 23, 6, 0))
    expect(patto.shippedCount).toBe(1)
    // Same morning, past 08:00: Day 1 is done (shipped-today), NOT Day 2.
    const sameMorning = evaluate(patto, local(2026, 6, 23, 9, 0))
    expect(sameMorning.view).toBe('shipped-today')
    expect(sameMorning.dayNumber).toBe(1)
    // Day 2 only the next day at 08:00.
    const nextDay = evaluate(patto, local(2026, 6, 24, 9, 0))
    expect(nextDay.view).toBe('active')
    expect(nextDay.shippableToday).toBe(true)
    expect(nextDay.dayNumber).toBe(2)
  })

  it('an unshipped pre-08:00 seal has the full day; it breaks only the next morning', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 6, 0))
    expect(evaluate(patto, local(2026, 6, 23, 9, 0)).view).toBe('active') // still Day 1
    expect(evaluate(patto, local(2026, 6, 24, 9, 0)).view).toBe('broken') // window closed
  })
})

describe('reopening far in the future', () => {
  it('keeps a shipped-then-skipped patto broken, months later, with progress preserved', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    const d = evaluate(patto, local(2026, 12, 31, 12))
    expect(d.view).toBe('broken')
    expect(d.shippedCount).toBe(1)
    expect(d.nodes.filter((n) => n === 'done')).toHaveLength(1)
  })

  it('breaks a never-shipped patto reopened months later', () => {
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    expect(evaluate(patto, local(2026, 10, 1, 9)).view).toBe('broken')
  })
})

describe('terminal states are inert to further actions', () => {
  function completed(): Patto {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    for (let day = 0; day < 14; day++) patto = applyShip(patto, local(2026, 6, 23 + day, 9))
    return patto
  }
  function broken(): Patto {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    return reconcile(patto, local(2026, 6, 25, 9))
  }

  it('applyShip and reconcile are identity no-ops on a completed patto', () => {
    const patto = completed()
    const far = local(2027, 1, 1, 12)
    expect(applyShip(patto, far)).toBe(patto)
    expect(applyShip(patto, far).shippedCount).toBe(14) // never a 15th ship
    expect(reconcile(patto, far)).toBe(patto)
  })

  it('applyShip and reconcile are identity no-ops on a broken patto', () => {
    const patto = broken()
    const far = local(2027, 1, 1, 12)
    expect(applyShip(patto, far)).toBe(patto)
    expect(reconcile(patto, far)).toBe(patto)
  })
})

describe('reconcile preserves reference on quiet active states', () => {
  it('leaves a shipped-today patto untouched (same ref), incl. pre-08:00 next morning', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    expect(reconcile(patto, local(2026, 6, 23, 18))).toBe(patto)
    expect(reconcile(patto, local(2026, 6, 24, 7, 30))).toBe(patto)
  })
})

describe('calendar boundaries', () => {
  it('handles the leap day Feb 28 → Feb 29 → Mar 1 (2028)', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2028, 2, 28, 10))
    patto = applyShip(patto, local(2028, 2, 28, 10))
    const leap = evaluate(patto, local(2028, 2, 29, 9))
    expect(leap.shippableToday).toBe(true)
    expect(leap.currentPattoDay).toBe('2028-02-29')

    patto = applyShip(patto, local(2028, 2, 29, 9))
    const march = evaluate(patto, local(2028, 3, 1, 9))
    expect(march.shippableToday).toBe(true)
    expect(march.currentPattoDay).toBe('2028-03-01')
  })

  it('handles a non-leap Feb 28 → Mar 1 (2027)', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2027, 2, 28, 10))
    patto = applyShip(patto, local(2027, 2, 28, 10))
    const march = evaluate(patto, local(2027, 3, 1, 9))
    expect(march.shippableToday).toBe(true)
    expect(march.currentPattoDay).toBe('2027-03-01')
  })
})

describe('Skip Day drives the full flow to completed', () => {
  it('ship + skip 14 times against a fixed clock reaches completed', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    const now = local(2026, 6, 23, 10)
    for (let i = 0; i < 14; i++) {
      expect(evaluate(patto, now).shippableToday).toBe(true)
      patto = applyShip(patto, now)
      if (i < 13) patto = applySkipDay(patto)
    }
    expect(patto.status).toBe('completed')
    expect(evaluate(patto, now).view).toBe('completed')
  })
})

describe('dayNumber is clamped to the 14-day window', () => {
  it('never exceeds durationDays on terminal/over-range states', () => {
    // Completed, reopened past day 14.
    let done = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    for (let day = 0; day < 14; day++) done = applyShip(done, local(2026, 6, 23 + day, 9))
    expect(evaluate(done, local(2026, 7, 10, 9)).dayNumber).toBe(14)

    // Broken, reopened far later.
    let bad = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    bad = applyShip(bad, local(2026, 6, 23, 10))
    expect(evaluate(bad, local(2026, 12, 31, 12)).dayNumber).toBe(14)
  })
})

describe('currentDayIndex always points at the node in focus', () => {
  it('points at the just-completed node on shipped-today (not the next, locked one)', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10)) // Day 1
    const d1 = evaluate(patto, local(2026, 6, 23, 18))
    expect(d1.view).toBe('shipped-today')
    expect(d1.currentDayIndex).toBe(0)
    expect(d1.nodes[d1.currentDayIndex]).toBe('done')

    patto = applyShip(patto, local(2026, 6, 24, 9)) // Day 2
    const d2 = evaluate(patto, local(2026, 6, 24, 18))
    expect(d2.currentDayIndex).toBe(1)
    expect(d2.nodes[d2.currentDayIndex]).toBe('done')
  })

  it('points at the next node when a Ship is available', () => {
    let patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    patto = applyShip(patto, local(2026, 6, 23, 10))
    const d = evaluate(patto, local(2026, 6, 24, 9))
    expect(d.shippableToday).toBe(true)
    expect(d.currentDayIndex).toBe(1)
    expect(d.nodes[d.currentDayIndex]).toBe('current')
  })

  it('points at the last node on completed and the last done node on broken', () => {
    let done = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    for (let day = 0; day < 14; day++) done = applyShip(done, local(2026, 6, 23 + day, 9))
    expect(evaluate(done, local(2026, 6, 23, 10)).currentDayIndex).toBe(13)

    let bad = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
    bad = applyShip(bad, local(2026, 6, 23, 10))
    const d = evaluate(bad, local(2026, 6, 25, 9))
    expect(d.view).toBe('broken')
    expect(d.currentDayIndex).toBe(0)
  })
})

describe('clock behind the seal day clamps to a full Day 1 (no false "shipped")', () => {
  it('a corrected fast clock shows Day 1 active and never claims a ship', () => {
    // Device clock was 2 days fast at seal → startPattoDate in the "future".
    const patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 25, 10))
    expect(patto.startPattoDate).toBe('2026-06-25')

    // Clock corrected backward to the true date: still Day 1, shippable, 0 shipped.
    const d = evaluate(patto, local(2026, 6, 23, 10))
    expect(d.view).toBe('active')
    expect(d.shippableToday).toBe(true)
    expect(d.dayNumber).toBe(1)
    expect(d.shippedCount).toBe(0)
    // reconcile must NOT freeze it as broken.
    expect(reconcile(patto, local(2026, 6, 23, 10))).toBe(patto)
  })
})

// A guard so a malformed Patto literal would fail typechecking here.
const _typecheck: Patto = createSealedPatto(SEAL_INPUT, local(2026, 6, 23, 10))
void _typecheck
