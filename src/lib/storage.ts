/*
 * Il Patto — typed, versioned localStorage wrapper (PRD §3, §11).
 *
 * Single source of persistence. Fails soft: if localStorage is missing or
 * disabled (private mode, blocked cookies), reads return null and writes
 * report failure instead of throwing — the UI shows a clear message, never a
 * crash (PRD §8, edge cases).
 */

import { STORAGE_KEY } from './types'
import type { Patto } from './types'

/** Probe localStorage once: present *and* writable. */
export function isStorageAvailable(): boolean {
  try {
    const probe = '__ilpatto_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function isValidPatto(value: unknown): value is Patto {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    p.version === 1 &&
    typeof p.protocolName === 'string' &&
    // Pact fields are all optional/legacy — accept string-or-absent for each.
    (p.pactText === undefined || typeof p.pactText === 'string') &&
    (p.trigger === undefined || typeof p.trigger === 'string') &&
    (p.action === undefined || typeof p.action === 'string') &&
    typeof p.durationDays === 'number' &&
    typeof p.startPattoDate === 'string' &&
    (p.lastShippedPattoDate === null || typeof p.lastShippedPattoDate === 'string') &&
    typeof p.shippedCount === 'number' &&
    (p.status === 'active' || p.status === 'completed' || p.status === 'broken')
  )
}

/** Load the persisted patto, or null if none/invalid/unavailable. */
export function loadPatto(): Patto | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidPatto(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Persist the patto. Returns false if storage is unavailable. */
export function savePatto(patto: Patto): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patto))
    return true
  } catch {
    return false
  }
}

/** Remove the persisted patto (used when starting over). */
export function clearPatto(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to do — storage unavailable */
  }
}
