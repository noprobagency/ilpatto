/*
 * Shared motion constants. One easing curve and one set of durations across
 * the whole app, so every transition feels like the same hand — nothing stands
 * out. The CSS side mirrors these in tokens.css (--ease, --dur-*).
 */

/** The single easing used everywhere (matches CSS --ease). */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Durations in seconds (mirror --dur-fast / --dur / --dur-slow). */
export const DUR = { fast: 0.18, base: 0.26, slow: 0.4 } as const
