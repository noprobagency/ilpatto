/*
 * useDayClock — a lightweight "now" that refreshes when it matters: on focus,
 * on tab re-show, and once a minute. No countdown is load-bearing (state is
 * derived from dates), but this keeps the view fresh if the app stays open
 * across the 08:00 rollover or while the "next unlock" hint ticks down.
 */

import { useEffect, useState } from 'react'

export function useDayClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    const id = window.setInterval(tick, 60_000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return now
}
