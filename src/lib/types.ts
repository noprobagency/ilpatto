/*
 * Il Patto — data model (PRD §11)
 *
 * Persisted under localStorage key `ilpatto.v1`. Everything is derived from
 * comparisons between *local dates* (patto-days), never from live timers — so
 * the state survives app close, reboot, and reopening days later.
 */

export const STORAGE_KEY = 'ilpatto.v1'
export const DURATION_DAYS = 14
/** A patto-day rolls over at this local hour (PRD §8: unlock at 08:00). */
export const UNLOCK_HOUR = 8

export type PattoStatus = 'active' | 'completed' | 'broken'

/** An ISO calendar date in local time, `YYYY-MM-DD` (a "patto-day"). */
export type PattoDate = string

export interface Patto {
  version: 1
  /** "Il Patto" or a custom name. */
  protocolName: string
  /** The pact in the user's own words — primary since v1.1 (free text). */
  pactText?: string
  /** Legacy v1 se-allora fields — optional, kept only for retro-compatibility. */
  trigger?: string
  action?: string
  why?: string
  /** Fixed at 14 in v1. */
  durationDays: typeof DURATION_DAYS
  /** Patto-day of the seal — this is Day 1. */
  startPattoDate: PattoDate
  /** Patto-day of the last Ship, or null if nothing shipped yet. */
  lastShippedPattoDate: PattoDate | null
  /** Days shipped so far (0..14). */
  shippedCount: number
  status: PattoStatus
  /** Dev-only: days added to "now" by Skip Day. Never present in production. */
  devDayOffset?: number
}

/** Per-node state for "Il Sentiero" (PRD §5). */
export type NodeState = 'done' | 'current' | 'future'

/**
 * Everything the UI needs, computed fresh from a Patto + the current moment.
 * None of this is persisted — it is always re-derived (PRD §8).
 */
export interface DerivedState {
  /**
   * What screen to show.
   * - `active`        — Ship is available now.
   * - `shipped-today` — already shipped for this patto-day; quiet until 08:00.
   * - `completed`     — 14 days done. - `broken` — a day was missed.
   */
  view: 'active' | 'shipped-today' | 'completed' | 'broken'
  status: PattoStatus
  /**
   * The patto-day "now" resolves to: the 08:00-rollover date (+ dev offset),
   * clamped up to the seal day so the seal day always reads as Day 1.
   */
  currentPattoDay: PattoDate
  /** 1-based day number since the seal, clamped to [1, durationDays]. */
  dayNumber: number
  shippedCount: number
  /**
   * 0-based index of the node currently in focus on the path. When a Ship is
   * available it points at the node about to light (the next, `current` node);
   * otherwise it points at the most recently completed node.
   */
  currentDayIndex: number
  /** Can the user press Ship right now? */
  shippableToday: boolean
  /** Per-node states, length = durationDays. */
  nodes: NodeState[]
  /** Next 08:00 local unlock (informational only). */
  nextUnlock: Date
}

/** Fields the onboarding flow collects before sealing (v1.1: free-text pact). */
export interface SealInput {
  protocolName: string
  pactText: string
}

/**
 * The pact to display: the user's own words (v1.1+), or — for legacy v1 pattos —
 * the se-allora fields composed into a sentence.
 */
export function pactDisplay(
  p: Pick<Patto, 'pactText' | 'trigger' | 'action'>,
): string {
  const text = p.pactText?.trim()
  if (text) return text
  if (p.trigger?.trim() && p.action?.trim()) {
    return `Se ${p.trigger.trim()}, allora ${p.action.trim()}.`
  }
  return p.trigger?.trim() || p.action?.trim() || ''
}
