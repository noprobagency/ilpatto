/*
 * Il Patto — time engine (PRD §8). The single most delicate piece.
 *
 * Core idea: a "patto-day" is a local calendar date that rolls over at 08:00.
 * Before 08:00 local you still belong to *yesterday*. Everything — whether
 * Ship is available, whether the path broke, what day you're on — is derived
 * by comparing patto-days, never by counting elapsed milliseconds. This makes
 * the whole machine robust to app close, reboot, timezone shifts, and
 * reopening days later. No live countdown is load-bearing.
 *
 * All functions are pure and take `now` explicitly so they can be tested by
 * falsifying the date (PRD §12, Fase 1).
 */

import { DURATION_DAYS, UNLOCK_HOUR } from './types'
import type {
  DerivedState,
  NodeState,
  Patto,
  PattoDate,
  SealInput,
} from './types'

/* ------------------------------------------------------------------ *
 * Local-date primitives
 * ------------------------------------------------------------------ */

/** Format a Date as a local `YYYY-MM-DD` (never UTC — local components only). */
export function toLocalISODate(d: Date): PattoDate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Parse a `YYYY-MM-DD` to a local Date anchored at noon. Noon (not midnight)
 * keeps day arithmetic immune to ±1h DST transitions.
 */
export function parseLocalISODate(iso: PattoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** Whole-day difference `a - b` between two patto-days. */
export function diffDays(a: PattoDate, b: PattoDate): number {
  const da = parseLocalISODate(a).getTime()
  const db = parseLocalISODate(b).getTime()
  return Math.round((da - db) / 86_400_000)
}

/** A new patto-day `n` days after `iso` (n may be negative). */
export function addDays(iso: PattoDate, n: number): PattoDate {
  const d = parseLocalISODate(iso)
  d.setDate(d.getDate() + n)
  return toLocalISODate(d)
}

/* ------------------------------------------------------------------ *
 * The patto-day clock
 * ------------------------------------------------------------------ */

/**
 * The patto-day that `now` resolves to. Applies an optional simulated
 * `dayOffset` (Skip Day), then the 08:00 rollover: before 08:00 you belong to
 * the previous calendar day.
 */
export function getPattoDay(now: Date, dayOffset = 0): PattoDate {
  const d = new Date(now.getTime())
  if (dayOffset !== 0) d.setDate(d.getDate() + dayOffset)
  if (d.getHours() < UNLOCK_HOUR) d.setDate(d.getDate() - 1)
  return toLocalISODate(d)
}

/**
 * The patto-day this patto considers `now` to be in, clamped up to the seal
 * day. If we are in the pre-08:00 sliver before Day 1 officially begins
 * (current patto-day < start), the seal day still counts as a *full* Day 1 and
 * its window runs to the next day's 08:00 — protecting the first day's
 * momentum (PRD principle: the early days are the most precious).
 */
export function effectivePattoDay(patto: Patto, now: Date): PattoDate {
  const current = getPattoDay(now, patto.devDayOffset ?? 0)
  return diffDays(current, patto.startPattoDate) < 0 ? patto.startPattoDate : current
}

/**
 * The 08:00 local boundary that opens the day *after* `pattoDate` — i.e. when
 * the next patto-day begins. Date-derived (no live clock), so it is correct
 * even in the pre-08:00 sliver, where the next unlock is the following day's,
 * not the imminent one (informational only).
 */
export function nextUnlockFor(pattoDate: PattoDate): Date {
  const d = parseLocalISODate(pattoDate)
  d.setDate(d.getDate() + 1)
  d.setHours(UNLOCK_HOUR, 0, 0, 0)
  return d
}

/* ------------------------------------------------------------------ *
 * State machine — derive everything the UI needs
 * ------------------------------------------------------------------ */

function buildNodes(
  duration: number,
  shippedCount: number,
  hasCurrent: boolean,
): NodeState[] {
  return Array.from({ length: duration }, (_, i) => {
    if (i < shippedCount) return 'done'
    if (hasCurrent && i === shippedCount) return 'current'
    return 'future'
  })
}

/**
 * Evaluate a patto against the current moment. Pure: never persists. The hook
 * is responsible for freezing terminal transitions (see `reconcile`).
 */
export function evaluate(patto: Patto, now: Date): DerivedState {
  const duration = patto.durationDays
  const shippedCount = patto.shippedCount
  const currentPattoDay = effectivePattoDay(patto, now)
  // Clamped to the fixed window: "Day 192/14" must never happen.
  const dayNumber = Math.min(
    duration,
    Math.max(1, diffDays(currentPattoDay, patto.startPattoDate) + 1),
  )
  const unlock = nextUnlockFor(currentPattoDay)

  // Single builder so every branch derives nodes + focus consistently.
  // When a Ship is available the focus is the node about to light
  // (shippedCount); otherwise it is the most recently completed node.
  const build = (
    view: DerivedState['view'],
    status: Patto['status'],
    shippableToday: boolean,
  ): DerivedState => ({
    view,
    status,
    currentPattoDay,
    dayNumber,
    shippedCount,
    currentDayIndex: shippableToday
      ? Math.min(shippedCount, duration - 1)
      : Math.min(Math.max(shippedCount - 1, 0), duration - 1),
    shippableToday,
    nodes: buildNodes(duration, shippedCount, shippableToday),
    nextUnlock: unlock,
  })

  // Terminal states are frozen and ignore the clock entirely.
  if (patto.status === 'completed') return build('completed', 'completed', false)
  if (patto.status === 'broken') return build('broken', 'broken', false)

  // Active: already shipped for today's patto-day → quiet "shipped-today".
  if (
    patto.lastShippedPattoDate !== null &&
    currentPattoDay === patto.lastShippedPattoDate
  ) {
    return build('shipped-today', 'active', false)
  }

  // Anchor = the day a Ship was last "owed from". Before the first ship the
  // anchor is the day before the seal, so the seal day (Day 1) is shippable.
  const anchor = patto.lastShippedPattoDate ?? addDays(patto.startPattoDate, -1)
  const gap = diffDays(currentPattoDay, anchor)

  // Exactly the next patto-day → Ship available.
  if (gap === 1) return build('active', 'active', true)

  // A full patto-day was skipped → the path closes.
  if (gap > 1) return build('broken', 'broken', false)

  // gap <= 0: the clock is at/behind the anchor (it moved backward past the
  // last Ship). lastShippedPattoDate is always non-null here — a never-shipped
  // patto clamps up to `start`, which yields gap >= 1 — so this is the quiet
  // "already shipped" state, never a false claim of a ship. Never punish.
  return build('shipped-today', 'active', false)
}

/* ------------------------------------------------------------------ *
 * Pure transitions (the hook persists their results)
 * ------------------------------------------------------------------ */

/**
 * Build a fresh, sealed patto from onboarding input. Day 1 is not yet shipped.
 *
 * The seal day always counts as a full Day 1, whatever the hour: we anchor to
 * the seal's *calendar* date (not the 08:00-shifted patto-day). Sealing at,
 * say, 06:00 therefore does NOT close Day 1 at 08:00 that same morning — the
 * first rollover is the next day's, and `effectivePattoDay` folds the pre-08:00
 * sliver into Day 1 so a Ship at seal time still counts.
 */
export function createSealedPatto(input: SealInput, now: Date): Patto {
  const why = input.why?.trim()
  const patto: Patto = {
    version: 1,
    protocolName: input.protocolName.trim() || 'Il Patto',
    trigger: input.trigger.trim(),
    action: input.action.trim(),
    durationDays: DURATION_DAYS,
    startPattoDate: toLocalISODate(now),
    lastShippedPattoDate: null,
    shippedCount: 0,
    status: 'active',
  }
  if (why) patto.why = why
  return patto
}

/**
 * Apply a Ship. Idempotent: if a Ship is not currently available (already
 * shipped today, broken, completed), the patto is returned unchanged.
 */
export function applyShip(patto: Patto, now: Date): Patto {
  const derived = evaluate(patto, now)
  if (!derived.shippableToday) return patto
  const shippedCount = patto.shippedCount + 1
  const completed = shippedCount >= patto.durationDays
  return {
    ...patto,
    // The effective patto-day (clamped to >= start), so a Ship made in the
    // pre-08:00 sliver records Day 1 (start), not the day before it.
    lastShippedPattoDate: derived.currentPattoDay,
    shippedCount,
    status: completed ? 'completed' : 'active',
  }
}

/**
 * Persist a broken transition if the clock has moved past a missed day. Pure:
 * returns a new patto when the status must freeze to 'broken', else the same
 * reference. Terminal states are never un-frozen.
 */
export function reconcile(patto: Patto, now: Date): Patto {
  if (patto.status !== 'active') return patto
  const derived = evaluate(patto, now)
  if (derived.status === 'broken') return { ...patto, status: 'broken' }
  return patto
}

/** Dev-only (Skip Day): advance the simulated clock by exactly one patto-day. */
export function applySkipDay(patto: Patto): Patto {
  return { ...patto, devDayOffset: (patto.devDayOffset ?? 0) + 1 }
}
