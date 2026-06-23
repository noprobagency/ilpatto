/*
 * Debug gate. The debug menu must be usable from a phone on the LIVE site, but
 * never visible to ordinary visitors. So in production it is hidden by default
 * and unlocked only by a secret URL key; the unlock is then remembered in
 * localStorage. In local dev it is always on. (This deliberately supersedes the
 * earlier "debug never ships to production" rule — it's a conscious trade so
 * the day-by-day flow can be tested on the live URL.)
 */

/** Unlock with https://ilpatto.vercel.app/?debug=ship-1408 (then it sticks). */
export const DEBUG_KEY = 'ship-1408'
const DEBUG_FLAG = 'ilpatto.debug'

/** Is the debug menu currently enabled? Pure read — no side effects. */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === DEBUG_KEY) return true
    return window.localStorage.getItem(DEBUG_FLAG) === 'true'
  } catch {
    return false
  }
}

/**
 * If the secret key is present in the URL, persist the unlock and strip the
 * param from the visible address (so it isn't shoulder-surfed or shared by
 * accident). Call once on mount.
 */
export function persistDebugUnlock(): void {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') !== DEBUG_KEY) return
    window.localStorage.setItem(DEBUG_FLAG, 'true')
    params.delete('debug')
    const qs = params.toString()
    const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
    window.history.replaceState(null, '', url)
  } catch {
    /* ignore */
  }
}

/** Forget the unlock (the "Disattiva debug" control). */
export function clearDebugUnlock(): void {
  try {
    window.localStorage.removeItem(DEBUG_FLAG)
  } catch {
    /* ignore */
  }
}
